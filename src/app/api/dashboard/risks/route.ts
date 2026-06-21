import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { THRESHOLDS } from '@/lib/constants';

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({
      where: { isActiveDataset: true },
    });

    if (!activeUpload) {
      return NextResponse.json({
        riskMatrix: [],
        criticalAlerts: [],
        membersAtRisk: [],
        countriesAtRisk: [],
        recommendations: [],
      });
    }

    const records = await db.adhesionRecordClean.findMany({
      where: { uploadId: activeUpload.id },
    });

    const total = records.length;

    // Payment rate
    const membresPayes = records.filter(r => r.statutPaiement === 'Payé').length;
    const tauxPaiement = total > 0 ? (membresPayes / total) * 100 : 0;
    const paymentRateNiveau = tauxPaiement >= THRESHOLDS.paymentRate.green
      ? 'faible'
      : tauxPaiement >= THRESHOLDS.paymentRate.orange
        ? 'moyen'
        : 'élevé';
    const paymentTendance = tauxPaiement >= THRESHOLDS.paymentRate.green ? 'stable' : 'en hausse';

    // Recovery rate
    const montantAttendu = records.reduce((s, r) => s + (r.montant || 0), 0);
    const montantPaye = records.reduce((s, r) => s + (r.montantPaye || 0), 0);
    const tauxRecouvrement = montantAttendu > 0 ? (montantPaye / montantAttendu) * 100 : 0;
    const recoveryNiveau = tauxRecouvrement >= THRESHOLDS.recoveryRate.green
      ? 'faible'
      : tauxRecouvrement >= THRESHOLDS.recoveryRate.orange
        ? 'moyen'
        : 'élevé';
    const recoveryTendance = tauxRecouvrement >= THRESHOLDS.recoveryRate.green ? 'stable' : 'en hausse';

    // Activation rate
    const membresActifs = records.filter(r => r.statutActivation === 'Actif').length;
    const tauxActivation = total > 0 ? (membresActifs / total) * 100 : 0;
    const activationNiveau = tauxActivation >= THRESHOLDS.activationRate.green
      ? 'faible'
      : tauxActivation >= THRESHOLDS.activationRate.orange
        ? 'moyen'
        : 'élevé';
    const activationTendance = tauxActivation >= THRESHOLDS.activationRate.green ? 'stable' : 'en hausse';

    // Duplicate emails
    const emails = records.map(r => r.emailNormalise).filter(Boolean);
    const duplicateEmails = emails.length - new Set(emails).size;
    const dupNiveau = duplicateEmails <= THRESHOLDS.duplicateEmails.green
      ? 'faible'
      : duplicateEmails <= THRESHOLDS.duplicateEmails.orange
        ? 'moyen'
        : 'élevé';
    const dupTendance = duplicateEmails <= THRESHOLDS.duplicateEmails.green ? 'stable' : 'en hausse';

    // Unaccounted payments
    const unaccountedPayments = records.filter(r => r.statutPaiement === 'Payé' && !r.datePaiementComptabilite).length;
    const unaccNiveau = unaccountedPayments <= THRESHOLDS.unaccountedPayments.green
      ? 'faible'
      : unaccountedPayments <= THRESHOLDS.unaccountedPayments.orange
        ? 'moyen'
        : 'élevé';
    const unaccTendance = unaccountedPayments <= THRESHOLDS.unaccountedPayments.green ? 'stable' : 'en hausse';

    // Old debt
    const oldDebt90 = records.filter(r => r.trancheAgeCreance === '>90').length;
    const oldDebtNiveau = oldDebt90 <= THRESHOLDS.oldDebt90Days.green
      ? 'faible'
      : oldDebt90 <= THRESHOLDS.oldDebt90Days.orange
        ? 'moyen'
        : 'élevé';
    const oldDebtTendance = oldDebt90 <= THRESHOLDS.oldDebt90Days.green ? 'stable' : 'en hausse';

    // Risk Matrix
    const riskMatrix = [
      { categorie: 'Taux Paiement', niveau: paymentRateNiveau, score: Math.round(tauxPaiement * 10) / 10, tendance: paymentTendance },
      { categorie: 'Recouvrement', niveau: recoveryNiveau, score: Math.round(tauxRecouvrement * 10) / 10, tendance: recoveryTendance },
      { categorie: 'Activation', niveau: activationNiveau, score: Math.round(tauxActivation * 10) / 10, tendance: activationTendance },
      { categorie: 'Doublons', niveau: dupNiveau, score: Math.min(100, duplicateEmails * 2), tendance: dupTendance },
      { categorie: 'Paiements', niveau: unaccNiveau, score: Math.min(100, unaccountedPayments * 2), tendance: unaccTendance },
      { categorie: 'Créances >90j', niveau: oldDebtNiveau, score: Math.min(100, oldDebt90 * 2), tendance: oldDebtTendance },
    ];

    // Critical Alerts
    const criticalAlerts: { id: string; titre: string; description: string; severite: string; date: string; categorie: string }[] = [];

    if (tauxPaiement < THRESHOLDS.paymentRate.orange) {
      criticalAlerts.push({
        id: 'paiement-critique',
        titre: 'Taux de paiement critique',
        description: `Seul ${tauxPaiement.toFixed(1)}% des membres ont payé leur cotisation`,
        severite: 'critique',
        date: new Date().toISOString().split('T')[0],
        categorie: 'Paiement',
      });
    } else if (tauxPaiement < THRESHOLDS.paymentRate.green) {
      criticalAlerts.push({
        id: 'paiement-faible',
        titre: 'Taux de paiement faible',
        description: `Le taux de paiement est de ${tauxPaiement.toFixed(1)}%, en dessous de l'objectif de ${THRESHOLDS.paymentRate.green}%`,
        severite: 'avertissement',
        date: new Date().toISOString().split('T')[0],
        categorie: 'Paiement',
      });
    }

    if (tauxRecouvrement < THRESHOLDS.recoveryRate.orange) {
      criticalAlerts.push({
        id: 'recouvrement-critique',
        titre: 'Taux de recouvrement critique',
        description: `Le taux de recouvrement est de ${tauxRecouvrement.toFixed(1)}%`,
        severite: 'critique',
        date: new Date().toISOString().split('T')[0],
        categorie: 'Recouvrement',
      });
    }

    if (oldDebt90 > THRESHOLDS.oldDebt90Days.orange) {
      criticalAlerts.push({
        id: 'creances-anciennes',
        titre: 'Créances anciennes élevées',
        description: `${oldDebt90} créances de plus de 90 jours nécessitent une action urgente`,
        severite: 'critique',
        date: new Date().toISOString().split('T')[0],
        categorie: 'Créances',
      });
    } else if (oldDebt90 > THRESHOLDS.oldDebt90Days.green) {
      criticalAlerts.push({
        id: 'creances-attention',
        titre: 'Créances vieillissantes',
        description: `${oldDebt90} créances de plus de 90 jours nécessitent une attention`,
        severite: 'avertissement',
        date: new Date().toISOString().split('T')[0],
        categorie: 'Créances',
      });
    }

    const payeNonActif = records.filter(r => r.flagPayeNonActif).length;
    if (payeNonActif > 0) {
      criticalAlerts.push({
        id: 'payes-inactifs',
        titre: 'Membres payés mais inactifs',
        description: `${payeNonActif} membres ont payé mais sont marqués inactifs`,
        severite: 'avertissement',
        date: new Date().toISOString().split('T')[0],
        categorie: 'Activation',
      });
    }

    const actifNonPaye = records.filter(r => r.flagActifNonPaye).length;
    if (actifNonPaye > 0) {
      criticalAlerts.push({
        id: 'actifs-non-payes',
        titre: 'Membres actifs non payés',
        description: `${actifNonPaye} membres sont actifs mais n\'ont pas payé`,
        severite: 'critique',
        date: new Date().toISOString().split('T')[0],
        categorie: 'Paiement',
      });
    }

    if (duplicateEmails > THRESHOLDS.duplicateEmails.orange) {
      criticalAlerts.push({
        id: 'doublons-emails',
        titre: 'Nombreux doublons d\'emails',
        description: `${duplicateEmails} adresses email en doublon dans la base`,
        severite: 'avertissement',
        date: new Date().toISOString().split('T')[0],
        categorie: 'Qualité',
      });
    }

    if (unaccountedPayments > THRESHOLDS.unaccountedPayments.orange) {
      criticalAlerts.push({
        id: 'sans-compta',
        titre: 'Paiements sans comptabilité',
        description: `${unaccountedPayments} paiements sans date de comptabilisation`,
        severite: 'avertissement',
        date: new Date().toISOString().split('T')[0],
        categorie: 'Comptabilité',
      });
    }

    // Members at risk
    const membersAtRisk = records
      .filter(r =>
        (r.montantARecouvrer || 0) > 0 && (r.trancheAgeCreance === '60-90' || r.trancheAgeCreance === '>90')
      )
      .sort((a, b) => (b.ageCreanceJours || 0) - (a.ageCreanceJours || 0))
      .slice(0, 50)
      .map(r => {
        const age = r.ageCreanceJours || 0;
        let risk = 'moyen';
        let motif = '';
        if (age >= 90) { risk = 'élevé'; motif = 'Créance > 90 jours'; }
        else if (age >= 60) { risk = 'moyen'; motif = 'Créance 60-90 jours'; }
        if (r.flagActifNonPaye) { motif += motif ? ', actif non payé' : 'Actif non payé'; risk = 'élevé'; }
        return {
          id: r.codeMembre || r.sourceId || `R${r.rowNumber}`,
          societe: r.societeNormalisee || r.societeOriginale || '—',
          pays: r.paysNormalise || '—',
          risk,
          motif,
        };
      });

    // Countries at risk
    const countryData: Record<string, { total: number; paid: number }> = {};
    for (const r of records) {
      const pays = r.paysNormalise || 'Non défini';
      if (!countryData[pays]) countryData[pays] = { total: 0, paid: 0 };
      countryData[pays].total++;
      if (r.statutPaiement === 'Payé') countryData[pays].paid++;
    }
    const countriesAtRisk = Object.entries(countryData)
      .filter(([, data]) => data.total >= 3 && (data.paid / data.total) < 0.5)
      .map(([pays, data]) => {
        const tauxPaiementPays = Math.round((data.paid / data.total) * 10000) / 100;
        return {
          pays,
          risque: tauxPaiementPays < 25 ? 'élevé' : 'moyen',
          tauxPaiement: tauxPaiementPays,
          membreCount: data.total,
          motif: `Taux de paiement à ${tauxPaiementPays}%`,
        };
      })
      .sort((a, b) => a.tauxPaiement - b.tauxPaiement);

    // Recommendations
    const recommendations: { id: string; priorite: string; titre: string; description: string; categorie: string }[] = [];

    if (tauxPaiement < THRESHOLDS.paymentRate.green) {
      recommendations.push({
        id: 'rec-paiement',
        priorite: 'haute',
        titre: 'Améliorer le taux de paiement',
        description: `Lancer une campagne de relance pour les ${total - membresPayes} membres impayés. Mettre en place des rappels automatiques.`,
        categorie: 'Paiement',
      });
    }

    if (tauxRecouvrement < THRESHOLDS.recoveryRate.green) {
      recommendations.push({
        id: 'rec-recouvrement',
        priorite: 'haute',
        titre: 'Accélérer le recouvrement',
        description: `Prioriser les créances de plus de 90 jours. Envisager des plans de paiement échelonnés pour les créances importantes.`,
        categorie: 'Recouvrement',
      });
    }

    if (duplicateEmails > THRESHOLDS.duplicateEmails.green) {
      recommendations.push({
        id: 'rec-doublons',
        priorite: 'moyenne',
        titre: 'Résoudre les doublons',
        description: `Procéder à un dédoublonnage des ${duplicateEmails} adresses email en doublon pour améliorer la qualité des données.`,
        categorie: 'Qualité',
      });
    }

    if (unaccountedPayments > THRESHOLDS.unaccountedPayments.green) {
      recommendations.push({
        id: 'rec-compta',
        priorite: 'moyenne',
        titre: 'Compléter les dates de comptabilisation',
        description: `${unaccountedPayments} paiements n'ont pas de date de comptabilisation. Mettre à jour les enregistrements concernés.`,
        categorie: 'Comptabilité',
      });
    }

    if (payeNonActif > 0) {
      recommendations.push({
        id: 'rec-activation',
        priorite: 'basse',
        titre: 'Vérifier les statuts d\'activation',
        description: `${payeNonActif} membres payés sont inactifs. Vérifier s'ils doivent être réactivés ou si le paiement est en erreur.`,
        categorie: 'Activation',
      });
    }

    recommendations.push({
      id: 'rec-prevention',
      priorite: 'basse',
      titre: 'Mettre en place des contrôles préventifs',
      description: 'Automatiser la validation des données à l\'import pour réduire les anomalies à la source.',
      categorie: 'Processus',
    });

    return NextResponse.json({
      riskMatrix,
      criticalAlerts,
      membersAtRisk,
      countriesAtRisk,
      recommendations,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
