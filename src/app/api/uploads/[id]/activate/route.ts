import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.uploadedFile.updateMany({
      where: { isActiveDataset: true },
      data: { isActiveDataset: false },
    });

    await db.uploadedFile.update({
      where: { id },
      data: { isActiveDataset: true },
    });

    return NextResponse.json({ success: true, message: 'Dataset activated' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
