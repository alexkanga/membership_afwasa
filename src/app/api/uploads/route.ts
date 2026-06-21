import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const uploads = await db.uploadedFile.findMany({
      orderBy: { uploadedAt: "desc" },
      include: {
        uploadedBy: {
          select: { name: true, email: true },
        },
        importErrors: {
          select: { id: true },
        },
      },
    });

    return NextResponse.json({
      uploads: uploads.map((u) => ({
        id: u.id,
        filename: u.originalFilename,
        uploadedAt: u.uploadedAt.toISOString(),
        uploadedBy: u.uploadedBy?.name || "Inconnu",
        totalRows: u.totalRows,
        validRows: u.validRows,
        invalidRows: u.invalidRows,
        errorCount: u.importErrors?.length || 0,
        status: u.importStatus,
        isActive: u.isActiveDataset,
        errorMessage: u.errorMessage,
      })),
    });
  } catch {
    return NextResponse.json({ uploads: [] });
  }
}
