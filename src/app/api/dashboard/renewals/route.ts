import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({
      where: { isActiveDataset: true },
    });

    if (!activeUpload) {
      return NextResponse.json({
        nouveauVsRenouvellement: {
          nouveau: { count: 0, pourcentage: 0 },
          renouvellement: { count: 0, pourcentage: 0 },
        },
        revenuNouveauVsRenouvellement: {
          nouveau: { montant: 0, pourcentage: 0 },
          renouvellement: { montant: 0, pourcentage: 0 },
        },
        tauxRenouvellement: 0,
        tendanceRenouvellement: 0,
        byCountry: [],
        byCategory: [],
      });
    }

    const records = await db.adhesionRecordClean.findMany({
      where: { uploadId: activeUpload.id },
    });

    const nouvelles = records.filter(r => r.typeAdhesionNormalise === 'Nouvelle');
    const renouvellements = records.filter(r => r.typeAdhesionNormalise === 'Renouvellement');
    const total = records.length;

    const nouvellesCount = nouvelles.length;
    const renouvellementCount = renouvellements.length;

    const nouvellesRevenue = Math.round(
      nouvelles.filter(r => r.statutPaiement === 'Payé').reduce((s, r) => s + (r.montantPaye || 0), 0) * 100
    ) / 100;
    const renouvellementsRevenue = Math.round(
      renouvellements.filter(r => r.statutPaiement === 'Payé').reduce((s, r) => s + (r.montantPaye || 0), 0) * 100
    ) / 100;

    // Renewal rate
    const tauxRenouvellement = total > 0
      ? Math.round((renouvellementCount / total) * 10000) / 100
      : 0;

    // Revenue totals for percentages
    const totalRevenue = nouvellesRevenue + renouvellementsRevenue;

    // By country: both new and renewal
    const countryMap: Record<string, { nouveau: number; renouvellement: number }> = {};
    for (const r of nouvelles) {
      const pays = r.paysNormalise || 'Non défini';
      if (!countryMap[pays]) countryMap[pays] = { nouveau: 0, renouvellement: 0 };
      countryMap[pays].nouveau++;
    }
    for (const r of renouvellements) {
      const pays = r.paysNormalise || 'Non défini';
      if (!countryMap[pays]) countryMap[pays] = { nouveau: 0, renouvellement: 0 };
      countryMap[pays].renouvellement++;
    }
    const byCountry = Object.entries(countryMap)
      .map(([pays, data]) => ({
        pays,
        nouveau: data.nouveau,
        renouvellement: data.renouvellement,
        total: data.nouveau + data.renouvellement,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    // By category: both new and renewal
    const catMap: Record<string, { nouveau: number; renouvellement: number }> = {};
    for (const r of nouvelles) {
      const cat = r.categorieMembre || 'Non défini';
      if (!catMap[cat]) catMap[cat] = { nouveau: 0, renouvellement: 0 };
      catMap[cat].nouveau++;
    }
    for (const r of renouvellements) {
      const cat = r.categorieMembre || 'Non défini';
      if (!catMap[cat]) catMap[cat] = { nouveau: 0, renouvellement: 0 };
      catMap[cat].renouvellement++;
    }
    const byCategory = Object.entries(catMap)
      .map(([categorie, data]) => ({
        categorie,
        nouveau: data.nouveau,
        renouvellement: data.renouvellement,
        total: data.nouveau + data.renouvellement,
      }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      nouveauVsRenouvellement: {
        nouveau: {
          count: nouvellesCount,
          pourcentage: total > 0 ? Math.round((nouvellesCount / total) * 10000) / 100 : 0,
        },
        renouvellement: {
          count: renouvellementCount,
          pourcentage: total > 0 ? Math.round((renouvellementCount / total) * 10000) / 100 : 0,
        },
      },
      revenuNouveauVsRenouvellement: {
        nouveau: {
          montant: nouvellesRevenue,
          pourcentage: totalRevenue > 0 ? Math.round((nouvellesRevenue / totalRevenue) * 10000) / 100 : 0,
        },
        renouvellement: {
          montant: renouvellementsRevenue,
          pourcentage: totalRevenue > 0 ? Math.round((renouvellementsRevenue / totalRevenue) * 10000) / 100 : 0,
        },
      },
      tauxRenouvellement,
      tendanceRenouvellement: 0,
      byCountry,
      byCategory,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
