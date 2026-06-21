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

    const nouvelles = records.filter(r => r.typeAdhesionNormalise === 'Nouvelle');
    const renouvellements = records.filter(r => r.typeAdhesionNormalise === 'Renouvellement');

    const nouvellesRevenue = nouvelles.filter(r => r.statutPaiement === 'Payé').reduce((s, r) => s + (r.montantPaye || 0), 0);
    const renouvellementsRevenue = renouvellements.filter(r => r.statutPaiement === 'Payé').reduce((s, r) => s + (r.montantPaye || 0), 0);

    // Renewal rate: renewals / total subscriptions
    const tauxRenouvellement = records.length > 0
      ? Math.round((renouvellements.length / records.length) * 10000) / 100
      : 0;

    // Renewals by country
    const renewalsByCountryMap: Record<string, number> = {};
    for (const r of renouvellements) {
      const pays = r.paysNormalise || 'Non défini';
      renewalsByCountryMap[pays] = (renewalsByCountryMap[pays] || 0) + 1;
    }
    const renewalsByCountry = Object.entries(renewalsByCountryMap)
      .map(([pays, count]) => ({ pays, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Renewals by category
    const renewalsByCategoryMap: Record<string, number> = {};
    for (const r of renouvellements) {
      const cat = r.categorieMembre || 'Non défini';
      renewalsByCategoryMap[cat] = (renewalsByCategoryMap[cat] || 0) + 1;
    }
    const renewalsByCategory = Object.entries(renewalsByCategoryMap)
      .map(([categorie, count]) => ({ categorie, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      hasData: true,
      newVsRenewal: {
        nouvelles: {
          count: nouvelles.length,
          revenue: Math.round(nouvellesRevenue * 100) / 100,
        },
        renouvellements: {
          count: renouvellements.length,
          revenue: Math.round(renouvellementsRevenue * 100) / 100,
        },
      },
      tauxRenouvellement,
      renewalsByCountry,
      renewalsByCategory,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
