import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({ where: { isActiveDataset: true } });
    if (!activeUpload) {
      return NextResponse.json({
        kpis: {
          totalInscriptions: 0,
          membresUniques: 0,
          membresPayes: 0,
          tauxPaiement: 0,
          montantPaye: 0,
          montantARecouvrer: 0,
          tauxRecouvrement: 0,
          membresActifs: 0,
          paysRepresentes: 0,
        },
        trends: {},
        monthlyEvolution: [],
        topCountries: [],
        topCategories: [],
        alerts: [],
      });
    }
    const uploadId = activeUpload.id;

    // Aggregate KPIs
    const totalInscriptions = await db.adhesionRecordClean.count({ where: { uploadId } });

    const membresPayes = await db.adhesionRecordClean.count({ where: { uploadId, statutPaiement: 'Payé' } });
    const membresActifs = await db.adhesionRecordClean.count({ where: { uploadId, statutActivation: 'Actif' } });

    const _aggMontant = await db.adhesionRecordClean.aggregate({
      where: { uploadId },
      _sum: { montantPaye: true, montantARecouvrer: true },
    });

    const montantPaye = Math.round(_aggMontant._sum.montantPaye || 0);
    const montantARecouvrer = Math.round(_aggMontant._sum.montantARecouvrer || 0);
    const tauxPaiement = totalInscriptions > 0 ? Math.round((membresPayes / totalInscriptions) * 10000) / 100 : 0;
    const tauxRecouvrement = (montantPaye + montantARecouvrer) > 0
      ? Math.round((montantPaye / (montantPaye + montantARecouvrer)) * 10000) / 100
      : 0;

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

    // Top countries by member count
    const countryAgg = await db.adhesionRecordClean.groupBy({
      by: ['paysNormalise'],
      where: { uploadId, paysNormalise: { not: '' } },
      _count: { paysNormalise: true },
      orderBy: { _count: { paysNormalise: 'desc' } },
      take: 10,
    });

    // Top categories
    const catAgg = await db.adhesionRecordClean.groupBy({
      by: ['categorieMembre'],
      where: { uploadId },
      _count: { categorieMembre: true },
      orderBy: { _count: { categorieMembre: 'desc' } },
      take: 5,
    });

    // Monthly evolution (inscriptions + paiements)
    const allRecords = await db.adhesionRecordClean.findMany({
      where: { uploadId, dateInscription: { not: null } },
      select: { dateInscription: true, statutPaiement: true },
    });
    const monthlyInscMap: Record<string, number> = {};
    const monthlyPayMap: Record<string, number> = {};
    for (const r of allRecords) {
      if (r.dateInscription) {
        const key = `${r.dateInscription.getFullYear()}-${String(r.dateInscription.getMonth() + 1).padStart(2, '0')}`;
        monthlyInscMap[key] = (monthlyInscMap[key] || 0) + 1;
        if (r.statutPaiement === 'Payé') {
          monthlyPayMap[key] = (monthlyPayMap[key] || 0) + 1;
        }
      }
    }
    const monthlyEvolution = Object.entries(monthlyInscMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, inscriptions]) => ({
        mois,
        inscriptions,
        paiements: monthlyPayMap[mois] || 0,
      }));

    // Build alerts
    const alerts: { id: string; type: string; description: string; severite: string; count: number }[] = [];

    const nonPayes = totalInscriptions - membresPayes;
    if (nonPayes > 0) {
      alerts.push({
        id: 'non-payes',
        type: 'Impayés',
        description: `${nonPayes} membres n'ont pas encore payé leur cotisation`,
        severite: tauxPaiement < 60 ? 'critique' : tauxPaiement < 80 ? 'avertissement' : 'info',
        count: nonPayes,
      });
    }

    const nonActifs = totalInscriptions - membresActifs;
    if (nonActifs > 0) {
      alerts.push({
        id: 'non-actifs',
        type: 'Inactifs',
        description: `${nonActifs} membres sont marqués inactifs`,
        severite: 'avertissement',
        count: nonActifs,
      });
    }

    if (montantARecouvrer > 0) {
      alerts.push({
        id: 'recouvrement',
        type: 'Recouvrement',
        description: `${montantARecouvrer.toLocaleString('fr-FR')} € à recouvrer`,
        severite: tauxRecouvrement < 70 ? 'critique' : 'avertissement',
        count: Math.round(montantARecouvrer),
      });
    }

    return NextResponse.json({
      kpis: {
        totalInscriptions,
        membresUniques,
        membresPayes,
        tauxPaiement,
        montantPaye,
        montantARecouvrer,
        tauxRecouvrement,
        membresActifs,
        paysRepresentes,
      },
      trends: {},
      monthlyEvolution,
      topCountries: countryAgg.map(c => ({
        pays: c.paysNormalise || 'Inconnu',
        count: c._count.paysNormalise,
      })),
      topCategories: catAgg.map(c => ({
        categorie: c.categorieMembre || 'Autre',
        count: c._count.categorieMembre,
      })),
      alerts,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error('Summary error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
