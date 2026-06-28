import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AFRICAN_COUNTRIES, REGION_COUNTRY_MAP, AFRICAN_REGIONS } from '@/lib/constants';

function isAfricanCountry(pays: string | null | undefined): boolean {
  if (!pays) return false;
  return (AFRICAN_COUNTRIES as readonly string[]).includes(pays);
}

function getMemberGroup(categorie: string | null | undefined): string {
  if (!categorie) return 'INDIVIDUEL';
  const c = categorie.toUpperCase();
  if (c.includes('ACTIF')) return 'ACTIF';
  if (c.includes('AFFILI')) return 'AFFILIE';
  return 'INDIVIDUEL';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeUpload = await db.uploadedFile.findFirst({ where: { isActiveDataset: true } });
    if (!activeUpload) {
      return NextResponse.json(getEmptyResponse());
    }
    const uploadId = activeUpload.id;

    // Fetch all records we need
    const allRecords = await db.adhesionRecordClean.findMany({
      where: { uploadId },
      select: {
        categorieMembre: true,
        sousCategorieMembre: true,
        paysNormalise: true,
        regionAfrique: true,
        statutPaiement: true,
        statutActivation: true,
        montant: true,
        montantPaye: true,
        montantARecouvrer: true,
        dateInscription: true,
        datePaiementActivation: true,
        datePaiementComptabilite: true,
        codeMembre: true,
        emailNormalise: true,
        planAdhesionNormalise: true,
        ageCreanceJours: true,
        trancheAgeCreance: true,
        flagDoublonEmail: true,
        flagPayeSansDateCompta: true,
        flagPayeSansCodeMembre: true,
        flagActifNonPaye: true,
        flagPayeNonActif: true,
        flagPayeSansDatePaiement: true,
      },
    });

    if (allRecords.length === 0) {
      return NextResponse.json(getEmptyResponse());
    }

    // === APPLY CUMULATIVE FILTERS ===
    let records = allRecords;

    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const typeDate = searchParams.get('typeDate') || 'inscription';
    if (dateDebut || dateFin) {
      const start = dateDebut ? new Date(dateDebut) : null;
      const end = dateFin ? new Date(dateFin) : null;
      if (end) end.setHours(23, 59, 59, 999);
      records = records.filter((r) => {
        const refDate = typeDate === 'paiement'
          ? r.datePaiementActivation || r.datePaiementComptabilite
          : r.dateInscription || r.datePaiementActivation;
        if (!refDate) return false;
        if (start && refDate < start) return false;
        if (end && refDate > end) return false;
        return true;
      });
    }

    const continent = searchParams.get('continent');
    if (continent && continent !== 'all') {
      records = records.filter((r) => {
        const isAfrica = isAfricanCountry(r.paysNormalise);
        return continent === 'afrique' ? isAfrica : !isAfrica;
      });
    }

    const regionAfrique = searchParams.get('regionAfrique');
    if (regionAfrique && regionAfrique !== 'all') {
      records = records.filter((r) => r.regionAfrique === regionAfrique);
    }

    const planAdhesion = searchParams.get('planAdhesion');
    if (planAdhesion && planAdhesion !== 'all') {
      records = records.filter((r) => r.planAdhesionNormalise === planAdhesion);
    }

    if (records.length === 0) {
      return NextResponse.json(getEmptyResponse());
    }

    // Helper to classify
    const classify = (r: (typeof allRecords)[0]) => {
      const isPaid = r.statutPaiement === 'Payé';
      const isAfrica = isAfricanCountry(r.paysNormalise);
      const group = getMemberGroup(r.categorieMembre);
      const isActif = r.statutActivation === 'Actif';
      return { isPaid, isAfrica, group, isActif };
    };

    // === EFFECTIFS ===
    let inscritsPayes = 0, inscritsNonPayes = 0;
    let actifsPayes = 0, actifsNonPayes = 0;
    let affiliesPayes = 0, affiliesNonPayes = 0;
    let individuelsPayes = 0, individuelsNonPayes = 0;

    // === MONTANTS (in EUR, will be converted on frontend) ===
    let montantInscritsPayes = 0, montantInscritsNonPayes = 0;
    let montantActifsPayes = 0, montantActifsNonPayes = 0;
    let montantAffiliesPayes = 0, montantAffiliesNonPayes = 0;
    let montantIndividuelsPayes = 0, montantIndividuelsNonPayes = 0;

    // === GEOGRAPHIE ===
    let afriquePayes = 0, afriqueNonPayes = 0, horsAfriquePayes = 0, horsAfriqueNonPayes = 0;
    let montantAfriquePaye = 0, montantHorsAfriquePaye = 0;
    let montantAfriqueRecouvrer = 0, montantHorsAfriqueRecouvrer = 0;

    // === GROUPES by sous-catégorie ===
    const sousCatActifs: Record<string, { total: number; payes: number; nonPayes: number }> = {};
    const sousCatAffilies: Record<string, { total: number; payes: number; nonPayes: number }> = {};
    const sousCatIndividuels: Record<string, { total: number; payes: number; nonPayes: number }> = {};

    // === PLANS ===
    const plansMap: Record<string, { groupe: string; total: number; payes: number; nonPayes: number; montantPaye: number }> = {};

    // === PAYS ===
    const paysMap: Record<string, { payes: number; nonPayes: number }> = {};

    // === REGIONS ===
    const regionMap: Record<string, { payes: number; nonPayes: number }> = {};
    const allRegionKeys = new Set<string>();

    // === EVOLUTION MENSUELLE ===
    const monthlyMap: Record<string, { montantPaye: number; montantNonPaye: number }> = {};

    // === CREANCES PAR TRANCHE ===
    const creanceTranches: Record<string, number> = {
      '0-30j': 0,
      '31-60j': 0,
      '61-90j': 0,
      '>90j': 0,
    };

    // === QUALITE & ANOMALIES ===
    let payesSansDateCompta = 0;
    let payesSansCodeMembre = 0;
    let creancesPlus90j = 0;
    let doublesEmails = 0;
    let totalWithValidEmail = 0;
    let totalWithPays = 0;
    let totalWithCodeMembre = 0;
    let totalWithDates = 0;
    let totalRecords = records.length;

    // === PLANS LIST ===
    const plansSet = new Set<string>();

    for (const r of records) {
      const { isPaid, isAfrica, group, isActif } = classify(r);

      // Effectifs
      if (isPaid) inscritsPayes++; else inscritsNonPayes++;
      if (group === 'ACTIF') { if (isPaid) actifsPayes++; else actifsNonPayes++; }
      else if (group === 'AFFILIE') { if (isPaid) affiliesPayes++; else affiliesNonPayes++; }
      else { if (isPaid) individuelsPayes++; else individuelsNonPayes++; }

      // Montants
      const mp = r.montantPaye || 0;
      const mr = r.montantARecouvrer || 0;
      if (isPaid) {
        montantInscritsPayes += mp;
        if (group === 'ACTIF') montantActifsPayes += mp;
        else if (group === 'AFFILIE') montantAffiliesPayes += mp;
        else montantIndividuelsPayes += mp;
      } else {
        montantInscritsNonPayes += mr;
        if (group === 'ACTIF') montantActifsNonPayes += mr;
        else if (group === 'AFFILIE') montantAffiliesNonPayes += mr;
        else montantIndividuelsNonPayes += mr;
      }

      // Geographie
      if (isAfrica) {
        if (isPaid) { afriquePayes++; montantAfriquePaye += mp; }
        else { afriqueNonPayes++; montantAfriqueRecouvrer += mr; }
      } else {
        if (isPaid) { horsAfriquePayes++; montantHorsAfriquePaye += mp; }
        else { horsAfriqueNonPayes++; montantHorsAfriqueRecouvrer += mr; }
      }

      // Sous-catégories
      const sc = r.sousCategorieMembre || r.planAdhesionNormalise || 'Autre';
      const targetMap = group === 'ACTIF' ? sousCatActifs : group === 'AFFILIE' ? sousCatAffilies : sousCatIndividuels;
      if (!targetMap[sc]) targetMap[sc] = { total: 0, payes: 0, nonPayes: 0 };
      targetMap[sc].total++;
      if (isPaid) targetMap[sc].payes++; else targetMap[sc].nonPayes++;

      // Plans
      const plan = r.planAdhesionNormalise || 'Autre';
      plansSet.add(plan);
      if (!plansMap[plan]) plansMap[plan] = { groupe: group, total: 0, payes: 0, nonPayes: 0, montantPaye: 0 };
      plansMap[plan].total++;
      if (isPaid) { plansMap[plan].payes++; plansMap[plan].montantPaye += mp; }
      else plansMap[plan].nonPayes++;

      // Pays
      const pays = r.paysNormalise || 'Inconnu';
      if (!paysMap[pays]) paysMap[pays] = { payes: 0, nonPayes: 0 };
      if (isPaid) paysMap[pays].payes++; else paysMap[pays].nonPayes++;

      // Regions
      if (isAfrica && r.regionAfrique) {
        allRegionKeys.add(r.regionAfrique);
        if (!regionMap[r.regionAfrique]) regionMap[r.regionAfrique] = { payes: 0, nonPayes: 0 };
        if (isPaid) regionMap[r.regionAfrique].payes++; else regionMap[r.regionAfrique].nonPayes++;
      }

      // Evolution mensuelle (using dateInscription or datePaiementActivation)
      const refDate = r.dateInscription || r.datePaiementActivation;
      if (refDate) {
        const key = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[key]) monthlyMap[key] = { montantPaye: 0, montantNonPaye: 0 };
        if (isPaid) monthlyMap[key].montantPaye += mp;
        else monthlyMap[key].montantNonPaye += mr;
      }

      // Créances par tranche
      if (!isPaid && r.ageCreanceJours !== null && r.ageCreanceJours !== undefined) {
        const age = r.ageCreanceJours;
        if (age <= 30) creanceTranches['0-30j'] += mr;
        else if (age <= 60) creanceTranches['31-60j'] += mr;
        else if (age <= 90) creanceTranches['>90j'] += mr; // will count actual >90 below
        else creanceTranches['>90j'] += mr;
      }

      // Qualité & Anomalies
      if (r.flagPayeSansDateCompta) payesSansDateCompta++;
      if (r.flagPayeSansCodeMembre) payesSansCodeMembre++;
      if (r.flagDoublonEmail) doublesEmails++;
      if (!isPaid && r.ageCreanceJours !== null && r.ageCreanceJours !== undefined && r.ageCreanceJours > 90) creancesPlus90j++;
      if (r.emailNormalise && r.emailNormalise.length > 0) totalWithValidEmail++;
      if (r.paysNormalise && r.paysNormalise.length > 0) totalWithPays++;
      if (r.codeMembre && r.codeMembre.length > 0) totalWithCodeMembre++;
      if (r.dateInscription || r.datePaiementActivation) totalWithDates++;
    }

    // Fix creance tranches — ensure 61-90j is separate
    // Re-process for correct tranche classification
    for (const r of records) {
      if (r.statutPaiement === 'Payé') continue;
      const age = r.ageCreanceJours;
      if (age === null || age === undefined) continue;
      // Already counted above, skip — but the 61-90 range was wrong. Let's fix:
      // Actually the above logic lumps 61-90 into >90j. Let me recount properly.
    }
    // Proper recount for creances
    creanceTranches['0-30j'] = 0;
    creanceTranches['31-60j'] = 0;
    creanceTranches['61-90j'] = 0;
    creanceTranches['>90j'] = 0;
    for (const r of records) {
      if (r.statutPaiement === 'Payé') continue;
      const age = r.ageCreanceJours;
      if (age === null || age === undefined) continue;
      const mr = r.montantARecouvrer || 0;
      if (age <= 30) creanceTranches['0-30j'] += mr;
      else if (age <= 60) creanceTranches['31-60j'] += mr;
      else if (age <= 90) creanceTranches['61-90j'] += mr;
      else creanceTranches['>90j'] += mr;
    }

    // Sort evolution mensuelle
    const evolutionMensuelle = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, data]) => ({ mois, ...data }));

    // Build pays list sorted by total desc
    const paysList = Object.entries(paysMap)
      .map(([pays, data]) => ({
        pays,
        inscritsPayes: data.payes,
        inscritsNonPayes: data.nonPayes,
        total: data.payes + data.nonPayes,
      }))
      .sort((a, b) => b.total - a.total);

    const totalInscrits = paysList.reduce((s, p) => s + p.total, 0);

    // Build regions list
    const regions = Object.entries(regionMap)
      .map(([region, data]) => ({
        region: AFRICAN_REGIONS[region] || region,
        regionKey: region,
        payes: data.payes,
        nonPayes: data.nonPayes,
        total: data.payes + data.nonPayes,
      }))
      .sort((a, b) => b.total - a.total);

    // Build sous-categories
    const buildSousCatList = (map: Record<string, { total: number; payes: number; nonPayes: number }>) =>
      Object.entries(map)
        .map(([sc, data]) => ({ sousCategorie: sc, ...data }))
        .sort((a, b) => b.total - a.total);

    // Build plans list
    const plansList = Object.entries(plansMap)
      .map(([plan, data]) => ({ plan, ...data }))
      .sort((a, b) => b.total - a.total);

    // Top 10 sous-categories across all groups
    const allSousCats = [
      ...buildSousCatList(sousCatActifs).map((s) => ({ ...s, groupe: 'ACTIF' })),
      ...buildSousCatList(sousCatAffilies).map((s) => ({ ...s, groupe: 'AFFILIE' })),
      ...buildSousCatList(sousCatIndividuels).map((s) => ({ ...s, groupe: 'INDIVIDUEL' })),
    ].sort((a, b) => b.total - a.total).slice(0, 10);

    // Pays uniques payés
    const paysPayesSet = new Set(paysList.filter(p => p.inscritsPayes > 0).map(p => p.pays));
    const paysTousSet = new Set(paysList.map(p => p.pays));

    // Montant total à payer
    const montantTotalAPayer = montantInscritsPayes + montantInscritsNonPayes;
    const tauxRecouvrement = montantTotalAPayer > 0 ? (montantInscritsPayes / montantTotalAPayer) * 100 : 0;

    // Qualité
    const qualite = {
      completudeEmail: totalRecords > 0 ? Math.round((totalWithValidEmail / totalRecords) * 100) : 0,
      completudePays: totalRecords > 0 ? Math.round((totalWithPays / totalRecords) * 100) : 0,
      completudeCodeMembre: totalRecords > 0 ? Math.round((totalWithCodeMembre / totalRecords) * 100) : 0,
      completudeDates: totalRecords > 0 ? Math.round((totalWithDates / totalRecords) * 100) : 0,
    };

    // Anomalies
    const anomalies = [];
    if (payesSansDateCompta > 0) {
      anomalies.push({
        anomalie: 'Payés sans date comptable',
        description: 'Membres avec statut Payé mais aucune date de paiement en comptabilité',
        nombre: payesSansDateCompta,
        impact: 'Élevé',
        severite: 'critique',
      });
    }
    if (payesSansCodeMembre > 0) {
      anomalies.push({
        anomalie: 'Payés sans code membre',
        description: 'Membres avec statut Payé mais aucun code membre attribué',
        nombre: payesSansCodeMembre,
        impact: 'Élevé',
        severite: 'critique',
      });
    }
    if (creancesPlus90j > 0) {
      anomalies.push({
        anomalie: 'Créances > 90 jours',
        description: 'Montants impayés avec un délai supérieur à 90 jours',
        nombre: creancesPlus90j,
        impact: 'Élevé',
        severite: 'critique',
      });
    }
    if (doublesEmails > 0) {
      anomalies.push({
        anomalie: 'Doublons email',
        description: 'Adresses email dupliquées dans la base',
        nombre: doublesEmails,
        impact: 'Moyen',
        severite: 'avertissement',
      });
    }
    const actifsNonPayesAnomaly = records.filter(r => r.statutActivation === 'Actif' && r.statutPaiement !== 'Payé').length;
    if (actifsNonPayesAnomaly > 0) {
      anomalies.push({
        anomalie: 'Actifs non payés',
        description: 'Membres actifs dont la cotisation n\'est pas payée',
        nombre: actifsNonPayesAnomaly,
        impact: 'Moyen',
        severite: 'avertissement',
      });
    }
    const payesNonActifs = records.filter(r => r.statutPaiement === 'Payé' && r.statutActivation !== 'Actif').length;
    if (payesNonActifs > 0) {
      anomalies.push({
        anomalie: 'Paiements non comptabilisés',
        description: 'Membres ayant payé mais non marqués comme actifs',
        nombre: payesNonActifs,
        impact: 'Moyen',
        severite: 'avertissement',
      });
    }

    return NextResponse.json({
      effectifs: {
        inscritsPayes,
        inscritsNonPayes,
        actifsPayes,
        actifsNonPayes,
        affiliesPayes,
        affiliesNonPayes,
        individuelsPayes,
        individuelsNonPayes,
      },
      montants: {
        inscritsPayes: montantInscritsPayes,
        inscritsNonPayes: montantInscritsNonPayes,
        actifsPayes: montantActifsPayes,
        actifsNonPayes: montantActifsNonPayes,
        affiliesPayes: montantAffiliesPayes,
        affiliesNonPayes: montantAffiliesNonPayes,
        individuelsPayes: montantIndividuelsPayes,
        individuelsNonPayes: montantIndividuelsNonPayes,
      },
      geographie: {
        afriquePayes,
        afriqueNonPayes,
        horsAfriquePayes,
        horsAfriqueNonPayes,
        montantAfriquePaye,
        montantHorsAfriquePaye,
        montantAfriqueRecouvrer,
        montantHorsAfriqueRecouvrer,
        paysPayesUniques: paysPayesSet.size,
        paysTousUniques: paysTousSet.size,
      },
      groupes: {
        actifs: buildSousCatList(sousCatActifs),
        affilies: buildSousCatList(sousCatAffilies),
        individuels: buildSousCatList(sousCatIndividuels),
        actifsPayes, actifsNonPayes,
        affiliesPayes, affiliesNonPayes,
        individuelsPayes, individuelsNonPayes,
        montantActifsPayes, montantAffiliesPayes, montantIndividuelsPayes,
      },
      plans: plansList,
      pays: paysList.map((p) => ({
        ...p,
        pctTotal: totalInscrits > 0 ? Math.round((p.total / totalInscrits) * 1000) / 10 : 0,
      })),
      regions,
      evolutionMensuelle,
      creancesParTranche: Object.entries(creanceTranches).map(([tranche, montant]) => ({ tranche, montant })),
      qualite,
      anomalies,
      sousCategories: allSousCats,
      recouvrement: {
        montantTotalAPayer,
        montantPaye: montantInscritsPayes,
        montantARecouvrer: montantInscritsNonPayes,
        tauxRecouvrement,
      },
      qualityAlerts: {
        payesSansDateCompta,
        payesSansCodeMembre,
        creancesPlus90j,
        doublesEmails,
      },
      plansList: Array.from(plansSet).sort(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error('Summary error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function getEmptyResponse() {
  return {
    effectifs: { inscritsPayes: 0, inscritsNonPayes: 0, actifsPayes: 0, actifsNonPayes: 0, affiliesPayes: 0, affiliesNonPayes: 0, individuelsPayes: 0, individuelsNonPayes: 0 },
    montants: { inscritsPayes: 0, inscritsNonPayes: 0, actifsPayes: 0, actifsNonPayes: 0, affiliesPayes: 0, affiliesNonPayes: 0, individuelsPayes: 0, individuelsNonPayes: 0 },
    geographie: { afriquePayes: 0, afriqueNonPayes: 0, horsAfriquePayes: 0, horsAfriqueNonPayes: 0, montantAfriquePaye: 0, montantHorsAfriquePaye: 0, montantAfriqueRecouvrer: 0, montantHorsAfriqueRecouvrer: 0, paysPayesUniques: 0, paysTousUniques: 0 },
    groupes: { actifs: [], affilies: [], individuels: [], actifsPayes: 0, actifsNonPayes: 0, affiliesPayes: 0, affiliesNonPayes: 0, individuelsPayes: 0, individuelsNonPayes: 0, montantActifsPayes: 0, montantAffiliesPayes: 0, montantIndividuelsPayes: 0 },
    plans: [],
    pays: [],
    regions: [],
    evolutionMensuelle: [],
    creancesParTranche: [],
    qualite: { completudeEmail: 0, completudePays: 0, completudeCodeMembre: 0, completudeDates: 0 },
    anomalies: [],
    sousCategories: [],
    recouvrement: { montantTotalAPayer: 0, montantPaye: 0, montantARecouvrer: 0, tauxRecouvrement: 0 },
    qualityAlerts: { payesSansDateCompta: 0, payesSansCodeMembre: 0, creancesPlus90j: 0, doublesEmails: 0 },
    plansList: [],
  };
}