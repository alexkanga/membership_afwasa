import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    // Totals
    const montantTotalAttendu = records.reduce((s, r) => s + (r.montant || 0), 0);
    const montantTotalPaye = records.reduce((s, r) => s + (r.montantPaye || 0), 0);
    const montantARecouvrer = records.reduce((s, r) => s + (r.montantARecouvrer || 0), 0);
    const tauxRecouvrement = montantTotalAttendu > 0
      ? Math.round((montantTotalPaye / montantTotalAttendu) * 10000) / 100
      : 0;

    // Average cotisation
    const paidRecords = records.filter(r => r.montant != null && r.montant > 0);
    const averageCotisation = paidRecords.length > 0
      ? Math.round((paidRecords.reduce((s, r) => s + (r.montant || 0), 0) / paidRecords.length) * 100) / 100
      : 0;

    // Revenue by payment mode
    const byModeMap: Record<string, { count: number; revenue: number }> = {};
    for (const r of records) {
      const mode = r.modePaiementNormalise || 'Non défini';
      if (!byModeMap[mode]) byModeMap[mode] = { count: 0, revenue: 0 };
      byModeMap[mode].count++;
      if (r.statutPaiement === 'Payé') {
        byModeMap[mode].revenue += r.montantPaye || 0;
      }
    }
    const revenueByMode = Object.entries(byModeMap).map(([mode, data]) => ({
      mode,
      members: data.count,
      revenue: Math.round(data.revenue * 100) / 100,
    }));

    // Revenue by subscription type
    const byTypeMap: Record<string, { count: number; revenue: number }> = {};
    for (const r of records) {
      const type = r.typeAdhesionNormalise || 'Non défini';
      if (!byTypeMap[type]) byTypeMap[type] = { count: 0, revenue: 0 };
      byTypeMap[type].count++;
      if (r.statutPaiement === 'Payé') {
        byTypeMap[type].revenue += r.montantPaye || 0;
      }
    }
    const revenueByType = Object.entries(byTypeMap).map(([type, data]) => ({
      type,
      members: data.count,
      revenue: Math.round(data.revenue * 100) / 100,
    }));

    // Monthly revenue
    const monthlyRevenueMap: Record<string, { revenue: number; count: number }> = {};
    for (const r of records) {
      if (r.dateInscription && r.statutPaiement === 'Payé') {
        const key = `${r.dateInscription.getFullYear()}-${String(r.dateInscription.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyRevenueMap[key]) monthlyRevenueMap[key] = { revenue: 0, count: 0 };
        monthlyRevenueMap[key].revenue += r.montantPaye || 0;
        monthlyRevenueMap[key].count++;
      }
    }
    const monthlyRevenue = Object.entries(monthlyRevenueMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, revenue: Math.round(data.revenue * 100) / 100, payments: data.count }));

    // Debt by age bracket
    const debtBrackets: Record<string, { count: number; amount: number }> = {
      '<30': { count: 0, amount: 0 },
      '30-60': { count: 0, amount: 0 },
      '60-90': { count: 0, amount: 0 },
      '>90': { count: 0, amount: 0 },
    };
    for (const r of records) {
      if (r.trancheAgeCreance && r.statutPaiement !== 'Payé') {
        const bracket = debtBrackets[r.trancheAgeCreance];
        if (bracket) {
          bracket.count++;
          bracket.amount += r.montantARecouvrer || 0;
        }
      }
    }
    const debtByAgeBracket = Object.entries(debtBrackets).map(([bracket, data]) => ({
      bracket,
      members: data.count,
      amount: Math.round(data.amount * 100) / 100,
    }));

    // Unaccounted payments (paid but no accounting date)
    const unaccountedPayments = records.filter(
      r => r.statutPaiement === 'Payé' && !r.datePaiementComptabilite
    ).length;

    return NextResponse.json({
      success: true,
      hasData: true,
      total: {
        montantTotalAttendu: Math.round(montantTotalAttendu * 100) / 100,
        montantTotalPaye: Math.round(montantTotalPaye * 100) / 100,
        montantARecouvrer: Math.round(montantARecouvrer * 100) / 100,
        tauxRecouvrement,
      },
      averageCotisation,
      revenueByMode,
      revenueByType,
      monthlyRevenue,
      debtByAgeBracket,
      unaccountedPayments,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
