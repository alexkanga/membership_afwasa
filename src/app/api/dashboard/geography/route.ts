import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { REGION_COUNTRY_MAP, AFRICAN_REGIONS, AFRICAN_COUNTRIES } from '@/lib/constants';

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({
      where: { isActiveDataset: true },
    });

    if (!activeUpload) {
      return NextResponse.json({
        africaVsOther: {
          afrique: { count: 0, pourcentage: 0 },
          horsAfrique: { count: 0, pourcentage: 0 },
        },
        paysRepartition: [],
        regions: [],
        totalPays: 0,
      });
    }

    const records = await db.adhesionRecordClean.findMany({
      where: { uploadId: activeUpload.id },
    });

    const total = records.length;
    const afriqueRecords = records.filter(r => r.zoneGeographique === 'Afrique');
    const horsAfriqueRecords = records.filter(r => r.zoneGeographique === 'Hors Afrique');

    // Members per country with payment rate
    const countryMap: Record<string, { count: number; paid: number }> = {};
    for (const r of records) {
      const pays = r.paysNormalise || 'Non défini';
      if (!countryMap[pays]) {
        countryMap[pays] = { count: 0, paid: 0 };
      }
      countryMap[pays].count++;
      if (r.statutPaiement === 'Payé') {
        countryMap[pays].paid++;
      }
    }

    const paysRepartition = Object.entries(countryMap)
      .map(([pays, data]) => ({
        pays,
        count: data.count,
        tauxPaiement: data.count > 0 ? Math.round((data.paid / data.count) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const totalPays = Object.keys(countryMap).length;

    // Regions (map countries to African regions)
    const regionMap: Record<string, number> = {};
    for (const r of records) {
      const pays = r.paysNormalise || '';
      let region = REGION_COUNTRY_MAP[pays];
      if (region) {
        region = AFRICAN_REGIONS[region] || region;
      }
      if (!region) {
        if (AFRICAN_COUNTRIES.includes(pays as typeof AFRICAN_COUNTRIES[number])) {
          region = 'Autre (Afrique)';
        } else if (r.zoneGeographique === 'Hors Afrique') {
          region = 'Hors Afrique';
        } else {
          region = 'Non classé';
        }
      }
      regionMap[region] = (regionMap[region] || 0) + 1;
    }

    const regions = Object.entries(regionMap)
      .map(([region, count]) => ({
        region,
        count,
        pourcentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      africaVsOther: {
        afrique: {
          count: afriqueRecords.length,
          pourcentage: total > 0 ? Math.round((afriqueRecords.length / total) * 10000) / 100 : 0,
        },
        horsAfrique: {
          count: horsAfriqueRecords.length,
          pourcentage: total > 0 ? Math.round((horsAfriqueRecords.length / total) * 10000) / 100 : 0,
        },
      },
      paysRepartition,
      regions,
      totalPays,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
