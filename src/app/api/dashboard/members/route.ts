import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const activeUpload = await db.uploadedFile.findFirst({
      where: { isActiveDataset: true },
    });

    if (!activeUpload) {
      return NextResponse.json({ success: true, hasData: false, breakdowns: {}, members: [] });
    }

    const records = await db.adhesionRecordClean.findMany({
      where: { uploadId: activeUpload.id },
    });

    // Members by category
    const byCategory: Record<string, number> = {};
    for (const r of records) {
      const cat = r.categorieMembre || 'Non défini';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    // Members by payment status
    const byPaymentStatus: Record<string, number> = {};
    for (const r of records) {
      const status = r.statutPaiement || 'Non défini';
      byPaymentStatus[status] = (byPaymentStatus[status] || 0) + 1;
    }

    // Members by activation status
    const byActivationStatus: Record<string, number> = {};
    for (const r of records) {
      const status = r.statutActivation || 'Non défini';
      byActivationStatus[status] = (byActivationStatus[status] || 0) + 1;
    }

    // Members by subscription type
    const bySubscriptionType: Record<string, number> = {};
    for (const r of records) {
      const type = r.typeAdhesionNormalise || 'Non défini';
      bySubscriptionType[type] = (bySubscriptionType[type] || 0) + 1;
    }

    // Members with/without code
    const withCode = records.filter(r => r.codeMembre && r.codeMembre.trim() !== '').length;
    const withoutCode = records.length - withCode;

    // Paid & active
    const paidAndActive = records.filter(r => r.statutPaiement === 'Payé' && r.statutActivation === 'Actif').length;

    // Paginated member list
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const paginatedRecords = await db.adhesionRecordClean.findMany({
      where: { uploadId: activeUpload.id },
      orderBy: { dateInscription: 'desc' },
      skip: offset,
      take: limit,
    });

    const totalMembers = records.length;
    const totalPages = Math.ceil(totalMembers / limit);

    return NextResponse.json({
      success: true,
      hasData: true,
      breakdowns: {
        byCategory,
        byPaymentStatus,
        byActivationStatus,
        bySubscriptionType,
        withCode,
        withoutCode,
        paidAndActive,
      },
      members: {
        data: paginatedRecords,
        total: totalMembers,
        page,
        totalPages,
        limit,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
