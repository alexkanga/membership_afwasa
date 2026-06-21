import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({
      where: { isActiveDataset: true },
    });

    if (!activeUpload) {
      return NextResponse.json({
        kpis: {
          montantAttendu: 0,
          montantPaye: 0,
          montantARecouvrer: 0,
          tauxRecouvrement: 0,
        },
        trends: {},
        waterfall: [],
        modePaiement: [],
        monthlyRevenue: [],
        ageCreance: [],
        toFollowUp: [],
      });
    }

    const records = await db.adhesionRecordClean.findMany({
      where: { uploadId: activeUpload.id },
    });

    // Totals
    const montantAttendu = Math.round(records.reduce((s, r) => s + (r.montant || 0), 0));
    const montantPaye = Math.round(records.reduce((s, r) => s + (r.montantPaye || 0), 0));
    const montantARecouvrer = Math.round(records.reduce((s, r) => s + (r.montantARecouvrer || 0), 0));
    const tauxRecouvrement = montantAttendu > 0
      ? Math.round((montantPaye / montantAttendu) * 10000) / 100
      : 0;

    // Waterfall: Attendu → Payé → Recouvrer
    const waterfall = [
      { etape: 'Montant Attendu', valeur: montantAttendu },
      { etape: 'Montant Payé', valeur: montantPaye },
      { etape: 'À Recouvrer', valeur: montantARecouvrer },
    ];

    // Revenue by payment mode with pourcentage
    const byModeMap: Record<string, number> = {};
    let totalRevenueByMode = 0;
    for (const r of records) {
      if (r.statutPaiement === 'Payé') {
        const mode = r.modePaiementNormalise || 'Non défini';
        byModeMap[mode] = (byModeMap[mode] || 0) + (r.montantPaye || 0);
        totalRevenueByMode += r.montantPaye || 0;
      }
    }
    const modePaiement = Object.entries(byModeMap)
      .map(([mode, montant]) => ({
        mode,
        montant: Math.round(montant * 100) / 100,
        pourcentage: totalRevenueByMode > 0 ? Math.round((montant / totalRevenueByMode) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.montant - a.montant);

    // Monthly revenue
    const monthlyRevenueMap: Record<string, number> = {};
    for (const r of records) {
      if (r.dateInscription && r.statutPaiement === 'Payé') {
        const key = `${r.dateInscription.getFullYear()}-${String(r.dateInscription.getMonth() + 1).padStart(2, '0')}`;
        monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + (r.montantPaye || 0);
      }
    }
    const monthlyRevenue = Object.entries(monthlyRevenueMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, montant]) => ({ mois, montant: Math.round(montant * 100) / 100 }));

    // Debt by age bracket
    const debtBrackets: Record<string, { count: number; amount: number }> = {
      '<30j': { count: 0, amount: 0 },
      '30-60j': { count: 0, amount: 0 },
      '60-90j': { count: 0, amount: 0 },
      '>90j': { count: 0, amount: 0 },
    };
    for (const r of records) {
      if (r.statutPaiement !== 'Payé' && (r.montantARecouvrer || 0) > 0) {
        const age = r.ageCreanceJours || 0;
        let bracket = '<30j';
        if (age >= 90) bracket = '>90j';
        else if (age >= 60) bracket = '60-90j';
        else if (age >= 30) bracket = '30-60j';
        debtBrackets[bracket].count++;
        debtBrackets[bracket].amount += r.montantARecouvrer || 0;
      }
    }
    const ageCreance = Object.entries(debtBrackets).map(([tranche, data]) => ({
      tranche,
      montant: Math.round(data.amount * 100) / 100,
      count: data.count,
    }));

    // Members to follow up (unpaid with receivables, sorted by debt age desc)
    const toFollowUp = records
      .filter(r =>
        r.statutPaiement !== 'Payé' && (r.montantARecouvrer || 0) > 0
      )
      .sort((a, b) => (b.ageCreanceJours || 0) - (a.ageCreanceJours || 0))
      .slice(0, 50)
      .map(r => {
        const age = r.ageCreanceJours || 0;
        let tranche = '<30j';
        if (age >= 90) tranche = '>90j';
        else if (age >= 60) tranche = '60-90j';
        else if (age >= 30) tranche = '30-60j';
        return {
          id: r.codeMembre || r.sourceId || `R${r.rowNumber}`,
          societe: r.societeNormalisee || r.societeOriginale || '—',
          pays: r.paysNormalise || '—',
          montant: Math.round(r.montantARecouvrer || 0),
          ageJours: age,
          tranche,
        };
      });

    return NextResponse.json({
      kpis: {
        montantAttendu,
        montantPaye,
        montantARecouvrer,
        tauxRecouvrement,
      },
      trends: {},
      waterfall,
      modePaiement,
      monthlyRevenue,
      ageCreance,
      toFollowUp,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
