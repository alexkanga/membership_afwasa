import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({
      where: { isActiveDataset: true },
    });
    if (!activeUpload) {
      return NextResponse.json({
        inscription: { min: null, max: null },
        paiement: { min: null, max: null },
      });
    }

    const uploadId = activeUpload.id;

    // Min/max inscription
    const inscMin = await db.adhesionRecordClean.findFirst({
      where: { uploadId, dateInscription: { not: null } },
      select: { dateInscription: true },
      orderBy: { dateInscription: 'asc' },
    });
    const inscMax = await db.adhesionRecordClean.findFirst({
      where: { uploadId, dateInscription: { not: null } },
      select: { dateInscription: true },
      orderBy: { dateInscription: 'desc' },
    });

    // Min/max paiement (datePaiementActivation)
    const payMin = await db.adhesionRecordClean.findFirst({
      where: { uploadId, datePaiementActivation: { not: null } },
      select: { datePaiementActivation: true },
      orderBy: { datePaiementActivation: 'asc' },
    });
    const payMax = await db.adhesionRecordClean.findFirst({
      where: { uploadId, datePaiementActivation: { not: null } },
      select: { datePaiementActivation: true },
      orderBy: { datePaiementActivation: 'desc' },
    });

    const fmt = (d: Date | null | undefined) =>
      d ? d.toISOString().split('T')[0] : null;

    return NextResponse.json({
      inscription: {
        min: fmt(inscMin?.dateInscription),
        max: fmt(inscMax?.dateInscription),
      },
      paiement: {
        min: fmt(payMin?.datePaiementActivation),
        max: fmt(payMax?.datePaiementActivation),
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error('Date range error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}