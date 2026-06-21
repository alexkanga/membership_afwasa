import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function getStatut(taux: number): string {
  if (taux >= 95) return 'bon';
  if (taux >= 75) return 'moyen';
  return 'faible';
}

export async function GET() {
  try {
    const activeUpload = await db.uploadedFile.findFirst({
      where: { isActiveDataset: true },
    });

    if (!activeUpload) {
      return NextResponse.json({
        scoreGlobal: 0,
        completeness: [],
        doublons: [],
        anomalies: [],
      });
    }

    const records = await db.adhesionRecordClean.findMany({
      where: { uploadId: activeUpload.id },
    });

    const total = records.length;

    // Completeness rates as array
    const hasEmail = records.filter(r => r.emailNormalise && r.emailNormalise.trim() !== '').length;
    const hasPays = records.filter(r => r.paysNormalise && r.paysNormalise.trim() !== '').length;
    const hasCodeMembre = records.filter(r => r.codeMembre && r.codeMembre.trim() !== '').length;
    const hasDateInscription = records.filter(r => r.dateInscription !== null).length;
    const hasDatePaiement = records.filter(r => r.datePaiementActivation !== null).length;
    const hasDateCompta = records.filter(r => r.datePaiementComptabilite !== null).length;
    const hasMontant = records.filter(r => r.montant != null && r.montant > 0).length;
    const hasSociete = records.filter(r => r.societeNormalisee && r.societeNormalisee.trim() !== '').length;
    const hasModePaiement = records.filter(r => r.modePaiementNormalise && r.modePaiementNormalise.trim() !== '').length;
    const hasNumFacture = records.filter(r => r.numFacture && r.numFacture.trim() !== '').length;

    const completeness = [
      { champ: 'Email', taux: total > 0 ? Math.round((hasEmail / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasEmail / total) * 100 : 0) },
      { champ: 'Pays', taux: total > 0 ? Math.round((hasPays / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasPays / total) * 100 : 0) },
      { champ: 'Code Membre', taux: total > 0 ? Math.round((hasCodeMembre / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasCodeMembre / total) * 100 : 0) },
      { champ: 'Date Insc.', taux: total > 0 ? Math.round((hasDateInscription / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasDateInscription / total) * 100 : 0) },
      { champ: 'Date Paiement', taux: total > 0 ? Math.round((hasDatePaiement / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasDatePaiement / total) * 100 : 0) },
      { champ: 'Date Compta.', taux: total > 0 ? Math.round((hasDateCompta / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasDateCompta / total) * 100 : 0) },
      { champ: 'Montant', taux: total > 0 ? Math.round((hasMontant / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasMontant / total) * 100 : 0) },
      { champ: 'Société', taux: total > 0 ? Math.round((hasSociete / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasSociete / total) * 100 : 0) },
      { champ: 'Mode Paiem.', taux: total > 0 ? Math.round((hasModePaiement / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasModePaiement / total) * 100 : 0) },
      { champ: 'N° Facture', taux: total > 0 ? Math.round((hasNumFacture / total) * 10000) / 100 : 0, statut: getStatut(total > 0 ? (hasNumFacture / total) * 100 : 0) },
    ];

    // Duplicate counts as array
    const emails = records.map(r => r.emailNormalise).filter(Boolean);
    const duplicateEmails = emails.length - new Set(emails).size;

    const codes = records.map(r => r.codeMembre).filter(c => c && c.trim() !== '');
    const duplicateCodes = codes.length - new Set(codes).size;

    const factures = records.map(r => r.numFacture).filter(f => f && f.trim() !== '');
    const duplicateFactures = factures.length - new Set(factures).size;

    const doublons = [
      { type: 'Emails', count: duplicateEmails },
      { type: 'Code Membre', count: duplicateCodes },
      { type: 'Factures', count: duplicateFactures },
    ];

    // Anomalies as array
    const anomalies: { id: string; type: string; champ: string; description: string; severite: string; count: number }[] = [];

    const flagDoublonEmail = records.filter(r => r.flagDoublonEmail).length;
    if (flagDoublonEmail > 0) anomalies.push({ id: 'dup-email', type: 'Doublon', champ: 'Email', description: `${flagDoublonEmail} adresses email en doublon`, severite: 'critique', count: flagDoublonEmail });

    const flagDoublonCode = records.filter(r => r.flagDoublonCodeMembre).length;
    if (flagDoublonCode > 0) anomalies.push({ id: 'dup-code', type: 'Doublon', champ: 'Code Membre', description: `${flagDoublonCode} codes membre en doublon`, severite: 'critique', count: flagDoublonCode });

    const flagDoublonFacture = records.filter(r => r.flagDoublonFacture).length;
    if (flagDoublonFacture > 0) anomalies.push({ id: 'dup-facture', type: 'Doublon', champ: 'N° Facture', description: `${flagDoublonFacture} factures en doublon`, severite: 'avertissement', count: flagDoublonFacture });

    const flagPayeSansDatePaiement = records.filter(r => r.flagPayeSansDatePaiement).length;
    if (flagPayeSansDatePaiement > 0) anomalies.push({ id: 'paye-no-date', type: 'Incohérence', champ: 'Date Paiement', description: `${flagPayeSansDatePaiement} payés sans date de paiement`, severite: 'avertissement', count: flagPayeSansDatePaiement });

    const flagPayeSansDateCompta = records.filter(r => r.flagPayeSansDateCompta).length;
    if (flagPayeSansDateCompta > 0) anomalies.push({ id: 'paye-no-compta', type: 'Incohérence', champ: 'Date Compta.', description: `${flagPayeSansDateCompta} payés sans date comptabilité`, severite: 'avertissement', count: flagPayeSansDateCompta });

    const flagPayeNonActif = records.filter(r => r.flagPayeNonActif).length;
    if (flagPayeNonActif > 0) anomalies.push({ id: 'paye-inactif', type: 'Incohérence', champ: 'Activation', description: `${flagPayeNonActif} payés mais inactifs`, severite: 'avertissement', count: flagPayeNonActif });

    const flagActifNonPaye = records.filter(r => r.flagActifNonPaye).length;
    if (flagActifNonPaye > 0) anomalies.push({ id: 'actif-non-paye', type: 'Incohérence', champ: 'Paiement', description: `${flagActifNonPaye} actifs mais non payés`, severite: 'critique', count: flagActifNonPaye });

    const invalidEmails = records.filter(r => r.emailNormalise && r.emailNormalise.trim() !== '' && !r.emailValide).length;
    if (invalidEmails > 0) anomalies.push({ id: 'invalid-email', type: 'Validation', champ: 'Email', description: `${invalidEmails} adresses email invalides`, severite: 'avertissement', count: invalidEmails });

    // Global quality score based on completeness and anomalies
    const avgCompleteness = completeness.reduce((s, c) => s + c.taux, 0) / completeness.length;
    const anomalyPenalty = Math.min(anomalies.reduce((s, a) => s + a.count * 0.5, 0), 20);
    const scoreGlobal = Math.max(0, Math.min(100, Math.round((avgCompleteness * 0.7 + (100 - anomalyPenalty) * 0.3) * 10) / 10));

    return NextResponse.json({
      scoreGlobal,
      completeness,
      doublons,
      anomalies,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
