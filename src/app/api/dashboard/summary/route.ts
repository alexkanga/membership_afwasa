import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({ where: { isActiveDataset: true } });
    if (!activeUpload) {
      return NextResponse.json({ success: true, hasData: false, kpis: {}, monthlyEvolution: [], topCountries: [], topCategories: [] });
    }
    const uploadId = activeUpload.id;

    // Aggregate KPIs using Prisma queries
    const _total = await db.adhesionRecordClean.count({ where: { uploadId } });
    const totalInscriptions = _total;

    const _payes = await db.adhesionRecordClean.count({ where: { uploadId, statutPaiement: 'Payé' } });
    const _nonPayes = totalInscriptions - _payes;
    const _actifs = await db.adhesionRecordClean.count({ where: { uploadId, statutActivation: 'Actif' } });

    const _aggMontant = await db.adhesionRecordClean.aggregate({
      where: { uploadId },
      _sum: { montant: true, montantPaye: true, montantARecouvrer: true },
    });

    const montantTotalAttendu = _aggMontant._sum.montant || 0;
    const montantTotalPaye = _aggMontant._sum.montantPaye || 0;
    const montantARecouvrer = _aggMontant._sum.montantARecouvrer || 0;

    // Unique emails
    const uniqueResult = await db.adhesionRecordClean.findMany({
      where: { uploadId, emailNormalise: { not: '' } },
      distinct: ['emailNormalise'],
      select: { emailNormalise: true },
    });
    const membresUniques = uniqueResult.length;

    // Distinct countries
    const countriesResult = await db.adhesionRecordClean.findMany({
      where: { uploadId, paysNormalise: { not: '' } },
      distinct: ['paysNormalise'],
      select: { paysNormalise: true },
    });
    const paysRepresentes = countriesResult.length;

    // Africa vs non-Africa
    const _afrique = await db.adhesionRecordClean.count({ where: { uploadId, zoneGeographique: 'Afrique' } });
    const _horsAfrique = totalInscriptions - _afrique;

    // New vs renewal
    const _nouvelles = await db.adhesionRecordClean.count({ where: { uploadId, typeAdhesionNormalise: 'Nouvelle' } });
    const _renouvellements = await db.adhesionRecordClean.count({ where: { uploadId, typeAdhesionNormalise: 'Renouvellement' } });

    // Average quality score
    const _scoreAgg = await db.adhesionRecordClean.aggregate({
      where: { uploadId },
      _avg: { scoreQualiteLigne: true },
    });

    // Payed & active
    const payesActifs = await db.adhesionRecordClean.count({ where: { uploadId, statutPaiement: 'Payé', statutActivation: 'Actif' } });
    // Payed, active, with code
    const payesActifsCodes = await db.adhesionRecordClean.count({ where: { uploadId, statutPaiement: 'Payé', statutActivation: 'Actif', codeMembre: { not: '' } } });

    // Top countries by member count
    const countryAgg = await db.adhesionRecordClean.groupBy({
      by: ['paysNormalise'],
      where: { uploadId, paysNormalise: { not: '' } },
      _count: { paysNormalise: true },
      _sum: { montant: true, montantPaye: true },
      orderBy: { _count: { paysNormalise: 'desc' } },
      take: 10,
    });

    // Top categories
    const catAgg = await db.adhesionRecordClean.groupBy({
      by: ['categorieMembre'],
      where: { uploadId },
      _count: { categorieMembre: true },
      _sum: { montant: true, montantPaye: true },
      orderBy: { _count: { categorieMembre: 'desc' } },
      take: 5,
    });

    // Monthly evolution
    const monthlyRecords = await db.adhesionRecordClean.findMany({
      where: { uploadId, dateInscription: { not: null } },
      select: { dateInscription: true },
    });
    const monthlyMap: Record<string, number> = {};
    for (const r of monthlyRecords) {
      if (r.dateInscription) {
        const key = `${r.dateInscription.getFullYear()}-${String(r.dateInscription.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = (monthlyMap[key] || 0) + 1;
      }
    }
    const monthlyEvolution = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));

    // Total anomalies
    const totalAnomalies = await db.importError.count({ where: { uploadId } });

    return NextResponse.json({
      success: true,
      hasData: true,
      kpis: {
        totalInscriptions,
        membresUniques,
        membresActifs: _actifs,
        membresNonActifs: totalInscriptions - _actifs,
        tauxActivation: totalInscriptions > 0 ? Math.round((_actifs / totalInscriptions) * 10000) / 100 : 0,
        membresPayes: _payes,
        membresNonPayes: _nonPayes,
        tauxPaiement: totalInscriptions > 0 ? Math.round((_payes / totalInscriptions) * 10000) / 100 : 0,
        montantTotalAttendu: Math.round(montantTotalAttendu),
        montantTotalPaye: Math.round(montantTotalPaye),
        montantARecouvrer: Math.round(montantARecouvrer),
        tauxRecouvrement: montantTotalAttendu > 0 ? Math.round((montantTotalPaye / montantTotalAttendu) * 10000) / 100 : 0,
        paysRepresentes,
        membresAfrique: _afrique,
        membresHorsAfrique: _horsAfrique,
        nouvellesAdhesions: _nouvelles,
        renouvellements: _renouvellements,
        tauxRenouvellement: (_nouvelles + _renouvellements) > 0 ? Math.round((_renouvellements / (_nouvelles + _renouvellements)) * 10000) / 100 : 0,
        scoreQualiteGlobal: Math.round(_scoreAgg._avg.scoreQualiteLigne || 0),
        totalAnomalies,
        cotisationMoyenne: _payes > 0 ? Math.round(montantTotalPaye / _payes) : 0,
        payesActifs,
        payesActifsCodes,
      },
      monthlyEvolution,
      topCountries: countryAgg.map(c => ({
        pays: c.paysNormalise || 'Inconnu',
        membres: c._count.paysNormalise,
        montant: Math.round(c._sum.montant || 0),
        montantPaye: Math.round(c._sum.montantPaye || 0),
      })),
      topCategories: catAgg.map(c => ({
        categorie: c.categorieMembre || 'Autre',
        membres: c._count.categorieMembre,
        montant: Math.round(c._sum.montant || 0),
        montantPaye: Math.round(c._sum.montantPaye || 0),
      })),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error('Summary error:', msg);
    return NextResponse.json({ success: false, error: msg, hasData: false }, { status: 500 });
  }
}
