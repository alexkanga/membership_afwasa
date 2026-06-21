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

    // Completeness rates
    const hasEmail = records.filter(r => r.emailNormalise && r.emailNormalise.trim() !== '').length;
    const hasPays = records.filter(r => r.paysNormalise && r.paysNormalise.trim() !== '').length;
    const hasCodeMembre = records.filter(r => r.codeMembre && r.codeMembre.trim() !== '').length;
    const hasDateInscription = records.filter(r => r.dateInscription !== null).length;
    const hasDatePaiement = records.filter(r => r.datePaiementActivation !== null).length;
    const hasDateCompta = records.filter(r => r.datePaiementComptabilite !== null).length;

    const completeness = {
      email: total > 0 ? Math.round((hasEmail / total) * 10000) / 100 : 0,
      pays: total > 0 ? Math.round((hasPays / total) * 10000) / 100 : 0,
      codeMembre: total > 0 ? Math.round((hasCodeMembre / total) * 10000) / 100 : 0,
      dateInscription: total > 0 ? Math.round((hasDateInscription / total) * 10000) / 100 : 0,
      datePaiement: total > 0 ? Math.round((hasDatePaiement / total) * 10000) / 100 : 0,
      dateCompta: total > 0 ? Math.round((hasDateCompta / total) * 10000) / 100 : 0,
    };

    // Duplicate counts
    const emails = records.map(r => r.emailNormalise).filter(Boolean);
    const emailSet = new Set(emails);
    const duplicateEmails = emails.length - emailSet.size;

    const codes = records.map(r => r.codeMembre).filter(c => c && c.trim() !== '');
    const codeSet = new Set(codes);
    const duplicateCodes = codes.length - codeSet.size;

    const factures = records.map(r => r.numFacture).filter(f => f && f.trim() !== '');
    const factureSet = new Set(factures);
    const duplicateFactures = factures.length - factureSet.size;

    const duplicates = {
      email: duplicateEmails,
      codeMembre: duplicateCodes,
      facture: duplicateFactures,
    };

    // Invalid emails
    const invalidEmails = records.filter(r => r.emailNormalise && r.emailNormalise.trim() !== '' && !r.emailValide).length;

    // Anomalies by flag type
    const flagCounts = {
      doublonEmail: records.filter(r => r.flagDoublonEmail).length,
      doublonCodeMembre: records.filter(r => r.flagDoublonCodeMembre).length,
      doublonFacture: records.filter(r => r.flagDoublonFacture).length,
      payeSansDatePaiement: records.filter(r => r.flagPayeSansDatePaiement).length,
      payeSansDateCompta: records.filter(r => r.flagPayeSansDateCompta).length,
      payeSansCodeMembre: records.filter(r => r.flagPayeSansCodeMembre).length,
      payeNonActif: records.filter(r => r.flagPayeNonActif).length,
      actifNonPaye: records.filter(r => r.flagActifNonPaye).length,
    };

    // Quality score per field
    const qualityScorePerField = {
      email: 100 - Math.round(((total - hasEmail) / total) * 100) - Math.round((invalidEmails / total) * 100),
      pays: 100 - Math.round(((total - hasPays) / total) * 100),
      codeMembre: 100 - Math.round(((total - hasCodeMembre) / total) * 100),
      dates: 100 - Math.round(((total - hasDateInscription) / total) * 100),
    };

    // Ensure scores don't go below 0
    for (const key of Object.keys(qualityScorePerField)) {
      qualityScorePerField[key as keyof typeof qualityScorePerField] = Math.max(0, qualityScorePerField[key as keyof typeof qualityScorePerField]);
    }

    return NextResponse.json({
      success: true,
      hasData: true,
      completeness,
      duplicates,
      invalidEmails,
      anomaliesByFlag: flagCounts,
      qualityScorePerField,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
