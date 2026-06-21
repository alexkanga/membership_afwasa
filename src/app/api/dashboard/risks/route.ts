import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { THRESHOLDS } from '@/lib/constants';

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({
      where: { isActiveDataset: true },
    });

    if (!activeUpload) {
      return NextResponse.json({ success: true, hasData: false });
    }

    const records = await db.adhesionRecordClean.findMany({
      where: { uploadId: activeUpload.id },
    });

    const total = records.length;

    // Payment rate
    const membresPayes = records.filter(r => r.statutPaiement === 'Payé').length;
    const tauxPaiement = total > 0 ? (membresPayes / total) * 100 : 0;
    const paymentRateLevel = tauxPaiement >= THRESHOLDS.paymentRate.green
      ? 'ok'
      : tauxPaiement >= THRESHOLDS.paymentRate.orange
        ? 'warning'
        : 'critical';

    // Recovery rate
    const montantAttendu = records.reduce((s, r) => s + (r.montant || 0), 0);
    const montantPaye = records.reduce((s, r) => s + (r.montantPaye || 0), 0);
    const tauxRecouvrement = montantAttendu > 0 ? (montantPaye / montantAttendu) * 100 : 0;
    const recoveryLevel = tauxRecouvrement >= THRESHOLDS.recoveryRate.green
      ? 'ok'
      : tauxRecouvrement >= THRESHOLDS.recoveryRate.orange
        ? 'warning'
        : 'critical';

    // Activation rate
    const membresActifs = records.filter(r => r.statutActivation === 'Actif').length;
    const tauxActivation = total > 0 ? (membresActifs / total) * 100 : 0;
    const activationLevel = tauxActivation >= THRESHOLDS.activationRate.green
      ? 'ok'
      : tauxActivation >= THRESHOLDS.activationRate.orange
        ? 'warning'
        : 'critical';

    // Duplicate emails
    const emails = records.map(r => r.emailNormalise).filter(Boolean);
    const duplicateEmails = emails.length - new Set(emails).size;
    const duplicatesLevel = duplicateEmails <= THRESHOLDS.duplicateEmails.green
      ? 'ok'
      : duplicateEmails <= THRESHOLDS.duplicateEmails.orange
        ? 'warning'
        : 'critical';

    // Unaccounted payments
    const unaccountedPayments = records.filter(r => r.statutPaiement === 'Payé' && !r.datePaiementComptabilite).length;
    const unaccountedLevel = unaccountedPayments <= THRESHOLDS.unaccountedPayments.green
      ? 'ok'
      : unaccountedPayments <= THRESHOLDS.unaccountedPayments.orange
        ? 'warning'
        : 'critical';

    // Old debt 90+ days
    const oldDebt90 = records.filter(r => r.trancheAgeCreance === '>90').length;
    const oldDebtLevel = oldDebt90 <= THRESHOLDS.oldDebt90Days.green
      ? 'ok'
      : oldDebt90 <= THRESHOLDS.oldDebt90Days.orange
        ? 'warning'
        : 'critical';

    // Top risk alerts
    const riskAlerts: Array<{ type: string; count: number; level: string; description: string }> = [];

    if (paymentRateLevel === 'critical') {
      riskAlerts.push({ type: 'payment_rate', count: Math.round((100 - tauxPaiement)), level: 'critical', description: `Taux de paiement critique: ${tauxPaiement.toFixed(1)}%` });
    }
    if (recoveryLevel === 'critical') {
      riskAlerts.push({ type: 'recovery_rate', count: Math.round(montantAttendu - montantPaye), level: 'critical', description: `Taux de recouvrement critique: ${tauxRecouvrement.toFixed(1)}%` });
    }
    if (oldDebtLevel !== 'ok') {
      riskAlerts.push({ type: 'old_debt', count: oldDebt90, level: oldDebtLevel, description: `${oldDebt90} créances de plus de 90 jours` });
    }
    if (duplicatesLevel !== 'ok') {
      riskAlerts.push({ type: 'duplicates', count: duplicateEmails, level: duplicatesLevel, description: `${duplicateEmails} emails en doublon` });
    }
    if (unaccountedLevel !== 'ok') {
      riskAlerts.push({ type: 'unaccounted', count: unaccountedPayments, level: unaccountedLevel, description: `${unaccountedPayments} paiements sans date comptabilité` });
    }

    const payeNonActif = records.filter(r => r.flagPayeNonActif).length;
    const actifNonPaye = records.filter(r => r.flagActifNonPaye).length;
    if (payeNonActif > 0) {
      riskAlerts.push({ type: 'paid_inactive', count: payeNonActif, level: 'warning', description: `${payeNonActif} membres payés mais inactifs` });
    }
    if (actifNonPaye > 0) {
      riskAlerts.push({ type: 'active_unpaid', count: actifNonPaye, level: 'warning', description: `${actifNonPaye} membres actifs mais non payés` });
    }

    // Members at risk (high debt, anomalies)
    const membersAtRisk = records.filter(r =>
      (r.montantARecouvrer || 0) > 0 && (r.trancheAgeCreance === '60-90' || r.trancheAgeCreance === '>90')
    ).slice(0, 50).map(r => ({
      rowNumber: r.rowNumber,
      email: r.emailNormalise,
      pays: r.paysNormalise,
      montantARecouvrer: r.montantARecouvrer,
      ageCreanceJours: r.ageCreanceJours,
      trancheAgeCreance: r.trancheAgeCreance,
      categorieMembre: r.categorieMembre,
    }));

    // Countries at risk (low payment)
    const countryData: Record<string, { total: number; paid: number }> = {};
    for (const r of records) {
      const pays = r.paysNormalise || 'Non défini';
      if (!countryData[pays]) countryData[pays] = { total: 0, paid: 0 };
      countryData[pays].total++;
      if (r.statutPaiement === 'Payé') countryData[pays].paid++;
    }
    const countriesAtRisk = Object.entries(countryData)
      .filter(([, data]) => data.total >= 3 && (data.paid / data.total) < 0.5)
      .map(([pays, data]) => ({
        pays,
        total: data.total,
        paymentRate: Math.round((data.paid / data.total) * 10000) / 100,
      }))
      .sort((a, b) => a.paymentRate - b.paymentRate);

    // Categories at risk
    const categoryData: Record<string, { total: number; paid: number }> = {};
    for (const r of records) {
      const cat = r.categorieMembre || 'Non défini';
      if (!categoryData[cat]) categoryData[cat] = { total: 0, paid: 0 };
      categoryData[cat].total++;
      if (r.statutPaiement === 'Payé') categoryData[cat].paid++;
    }
    const categoriesAtRisk = Object.entries(categoryData)
      .filter(([, data]) => data.total >= 3 && (data.paid / data.total) < 0.5)
      .map(([categorie, data]) => ({
        categorie,
        total: data.total,
        paymentRate: Math.round((data.paid / data.total) * 10000) / 100,
      }))
      .sort((a, b) => a.paymentRate - b.paymentRate);

    // Risk level summary
    const riskSummary = {
      paymentRate: { value: Math.round(tauxPaiement * 100) / 100, level: paymentRateLevel },
      recoveryRate: { value: Math.round(tauxRecouvrement * 100) / 100, level: recoveryLevel },
      activationRate: { value: Math.round(tauxActivation * 100) / 100, level: activationLevel },
      duplicates: { value: duplicateEmails, level: duplicatesLevel },
      unaccountedPayments: { value: unaccountedPayments, level: unaccountedLevel },
      oldDebt90: { value: oldDebt90, level: oldDebtLevel },
    };

    const criticalCount = Object.values(riskSummary).filter(v => v.level === 'critical').length;
    const warningCount = Object.values(riskSummary).filter(v => v.level === 'warning').length;

    return NextResponse.json({
      success: true,
      hasData: true,
      riskAlerts,
      membersAtRisk,
      countriesAtRisk,
      categoriesAtRisk,
      riskSummary,
      overallRisk: criticalCount > 0 ? 'critical' : warningCount > 0 ? 'warning' : 'ok',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
