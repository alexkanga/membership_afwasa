import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({
      where: { isActiveDataset: true },
    });

    if (!activeUpload) {
      return NextResponse.json({ success: true, hasData: false, categories: [] });
    }

    const records = await db.adhesionRecordClean.findMany({
      where: { uploadId: activeUpload.id },
    });

    // Group by category
    const categoryMap: Record<string, { total: number; paid: number; unpaid: number; revenue: number; toRecover: number }> = {};

    for (const r of records) {
      const cat = r.categorieMembre || 'Non défini';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, paid: 0, unpaid: 0, revenue: 0, toRecover: 0 };
      }
      categoryMap[cat].total++;
      if (r.statutPaiement === 'Payé') {
        categoryMap[cat].paid++;
        categoryMap[cat].revenue += r.montantPaye || 0;
      } else {
        categoryMap[cat].unpaid++;
        categoryMap[cat].toRecover += r.montantARecouvrer || 0;
      }
    }

    const categories = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      totalMembers: data.total,
      paidMembers: data.paid,
      unpaidMembers: data.unpaid,
      paymentRate: data.total > 0 ? Math.round((data.paid / data.total) * 10000) / 100 : 0,
      revenue: Math.round(data.revenue * 100) / 100,
      amountToRecover: Math.round(data.toRecover * 100) / 100,
    }));

    return NextResponse.json({ success: true, hasData: true, categories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
