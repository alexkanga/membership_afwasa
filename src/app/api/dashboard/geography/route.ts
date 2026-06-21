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

    const total = records.length;
    const afrique = records.filter(r => r.zoneGeographique === 'Afrique');
    const horsAfrique = records.filter(r => r.zoneGeographique === 'Hors Afrique');

    // Members per country (top 20)
    const countryMap: Record<string, { count: number; paid: number; revenue: number }> = {};
    for (const r of records) {
      const pays = r.paysNormalise || 'Non défini';
      if (!countryMap[pays]) {
        countryMap[pays] = { count: 0, paid: 0, revenue: 0 };
      }
      countryMap[pays].count++;
      if (r.statutPaiement === 'Payé') {
        countryMap[pays].paid++;
        countryMap[pays].revenue += r.montantPaye || 0;
      }
    }

    const membersPerCountry = Object.entries(countryMap)
      .map(([pays, data]) => ({
        pays,
        membres: data.count,
        paymentRate: data.count > 0 ? Math.round((data.paid / data.count) * 10000) / 100 : 0,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.membres - a.membres)
      .slice(0, 20);

    // Revenue per country
    const revenuePerCountry = Object.entries(countryMap)
      .map(([pays, data]) => ({ pays, revenue: Math.round(data.revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);

    // Payment rate per country
    const paymentRatePerCountry = Object.entries(countryMap)
      .filter(([, data]) => data.count >= 2)
      .map(([pays, data]) => ({
        pays,
        paymentRate: data.count > 0 ? Math.round((data.paid / data.count) * 10000) / 100 : 0,
        total: data.count,
      }))
      .sort((a, b) => a.paymentRate - b.paymentRate);

    // Countries with high inscriptions but low payment
    const highInscriptionLowPayment = membersPerCountry
      .filter(c => c.membres >= 3 && c.paymentRate < 50)
      .sort((a, b) => a.paymentRate - b.paymentRate);

    return NextResponse.json({
      success: true,
      hasData: true,
      afriqueVsHorsAfrique: {
        afrique: {
          membres: afrique.length,
          pourcentage: total > 0 ? Math.round((afrique.length / total) * 10000) / 100 : 0,
        },
        horsAfrique: {
          membres: horsAfrique.length,
          pourcentage: total > 0 ? Math.round((horsAfrique.length / total) * 10000) / 100 : 0,
        },
      },
      membersPerCountry,
      revenuePerCountry,
      paymentRatePerCountry,
      highInscriptionLowPayment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
