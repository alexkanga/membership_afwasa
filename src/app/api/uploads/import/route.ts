import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { EXPECTED_SHEET, AFRICAN_COUNTRIES, REGION_COUNTRY_MAP } from '@/lib/constants';

function isValidEmail(email: string): boolean {
  if (!email || email.trim().length === 0) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

function normalizeEmail(raw: unknown) {
  if (!raw || typeof raw !== 'string') return { value: '', valid: false };
  const trimmed = raw.trim().toLowerCase();
  return { value: trimmed, valid: isValidEmail(trimmed) };
}

function normalizeCountry(raw: unknown) {
  if (!raw || typeof raw !== 'string') return { paysNormalise: '', zoneGeographique: 'Hors Afrique', regionAfrique: null as string | null };
  const trimmed = raw.trim();
  if (!trimmed) return { paysNormalise: '', zoneGeographique: 'Hors Afrique', regionAfrique: null as string | null };
  const isAfrican = AFRICAN_COUNTRIES.some(c => c.toLowerCase() === trimmed.toLowerCase());
  if (isAfrican) {
    const region = REGION_COUNTRY_MAP[trimmed] || null;
    return { paysNormalise: trimmed, zoneGeographique: 'Afrique', regionAfrique: region };
  }
  return { paysNormalise: trimmed, zoneGeographique: 'Hors Afrique', regionAfrique: null as string | null };
}

function normalizePlanAdhesion(raw: string): string {
  const v = raw.toLowerCase();
  if (v.includes('actif') && (v.includes('grande') || v.includes('large'))) return 'Actif Grande Taille';
  if (v.includes('actif') && (v.includes('régu') || v.includes('regu') || v.includes('municip') || v.includes('acad'))) return 'Actif Régulateur';
  if (v.includes('affili') && v.includes('africain')) return 'Affilié Africain';
  if (v.includes('affili') && v.includes('non')) return 'Affilié Non-Africain';
  if (v.includes('individuel') && v.includes('africain')) return 'Individuel Africain';
  if (v.includes('individuel') && v.includes('non')) return 'Individuel Non-Africain';
  if (v.includes('membre individuel') || v.includes('individuel')) return 'Individuel';
  if (v.includes('honneur') || v.includes('honoraire')) return 'Honneur';
  if (v.includes('affilié') || v.includes('affilie')) return 'Affilié';
  if (v.includes('actif')) return 'Actif';
  return 'Autre';
}

function normalizeModePaiement(raw: string): string {
  if (!raw) return 'Offline';
  const v = raw.toLowerCase();
  if (v.includes('stripe')) return 'Stripe';
  return 'Offline';
}

function normalizeTypeAdhesion(raw: string): string {
  if (!raw) return 'Nouvelle';
  const v = raw.toLowerCase();
  if (v.includes('renew') || v.includes('renouv')) return 'Renouvellement';
  return 'Nouvelle';
}

function normalizeStatutPaiement(raw: string): string {
  if (!raw) return 'Non payé';
  const v = raw.trim().toLowerCase();
  if (v === 'oui' || v === 'yes' || v === 'true' || v === '1' || v === 'paid' || v === 'payé') return 'Payé';
  return 'Non payé';
}

function normalizeStatutActivation(raw: string): string {
  if (!raw) return 'Non actif';
  const v = raw.trim().toLowerCase();
  if (v === 'oui' || v === 'yes' || v === 'true' || v === '1' || v === 'active' || v === 'actif') return 'Actif';
  return 'Non actif';
}

function calcDelayDays(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
}

function parseExcelDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number') {
    const date = new Date(1899, 11, 30);
    date.setDate(date.getDate() + val);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof val === 'string') {
    const d = new Date(val.trim());
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !file.name.endsWith('.xlsx')) {
      return NextResponse.json({ success: false, error: 'Fichier .xlsx requis' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

    if (!workbook.SheetNames.includes(EXPECTED_SHEET)) {
      return NextResponse.json({ success: false, error: `Feuille "${EXPECTED_SHEET}" non trouvée` }, { status: 400 });
    }

    const sheet = workbook.Sheets[EXPECTED_SHEET];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    if (jsonData.length === 0) {
      return NextResponse.json({ success: false, error: 'Aucune donnée' }, { status: 400 });
    }

    const admin = await db.user.findFirst({ where: { role: 'admin', isActive: true } });
    const uploaderId = admin?.id || '';

    // Create upload record
    const uploadedFile = await db.uploadedFile.create({
      data: {
        originalFilename: file.name,
        storedFilename: file.name,
        filePath: `/uploads/${file.name}`,
        uploadedByUserId: uploaderId,
        fileSize: file.size,
        sheetName: EXPECTED_SHEET,
        totalRows: jsonData.length,
        totalColumns: Object.keys(jsonData[0]).length,
        importStatus: 'processing',
      },
    });
    const uploadId = uploadedFile.id;

    // Parse all rows
    const rawBatch: Array<{ uploadId: string; rowNumber: number; planAdhesion: string; societeInstitutionUniv: string; pays: string; email: string; montant: number; dateInscription: Date | null; numFacture: string; modePaiement: string; datePaiementActivation: Date | null; sourceId: string; estActive: string; typeAdhesion: string; codeMembre: string; datePaiementComptabilite: Date | null; aPaye: string; rawJson: string }> = [];
    const emailCounts: Record<string, number> = {};
    const codeCounts: Record<string, number> = {};
    const factureCounts: Record<string, number> = {};

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const email = String(row['EMAIL'] || '').trim().toLowerCase();
      const codeMembre = String(row['CODE MEMBRE'] || '').trim();
      const numFacture = String(row['NUM FACTURE'] || '').trim();
      if (email) emailCounts[email] = (emailCounts[email] || 0) + 1;
      if (codeMembre) codeCounts[codeMembre] = (codeCounts[codeMembre] || 0) + 1;
      if (numFacture) factureCounts[numFacture] = (factureCounts[numFacture] || 0) + 1;

      const montantRaw = row['MONTANT'];
      const montant = typeof montantRaw === 'number' ? montantRaw : parseFloat(String(montantRaw)) || 0;

      rawBatch.push({
        uploadId,
        rowNumber: i + 1,
        planAdhesion: String(row['PLAN_ADHESION'] || ''),
        societeInstitutionUniv: String(row['SOCIETE / INSTITUTION / UNIVERSITE'] || ''),
        pays: String(row['PAYS'] || ''),
        email,
        montant: isNaN(montant) ? 0 : montant,
        dateInscription: parseExcelDate(row['DATE INSCRIPTION']),
        numFacture,
        modePaiement: String(row['MODE PAIEMENT'] || ''),
        datePaiementActivation: parseExcelDate(row['DATE PAIEMENT / ACTIVATION']),
        sourceId: String(row['ID'] || ''),
        estActive: String(row['EST ACTIVE ?'] || ''),
        typeAdhesion: String(row['TYPE ADHESION'] || ''),
        codeMembre,
        datePaiementComptabilite: parseExcelDate(row['DATE PAIEMENT COMPTABILITE']),
        aPaye: String(row['A PAYE ?'] || ''),
        rawJson: JSON.stringify(row),
      });
    }

    // Bulk insert raw records (batch of 100)
    const batchSize = 100;
    for (let i = 0; i < rawBatch.length; i += batchSize) {
      await db.adhesionRecordRaw.createMany({ data: rawBatch.slice(i, i + batchSize) });
    }

    // Process clean records
    let validRows = 0;
    let invalidRows = 0;
    const errorsBatch: Array<{ uploadId: string; rowNumber: number; columnName: string; errorType: string; errorMessage: string; severity: string }> = [];
    const cleanBatch: Array<{ uploadId: string; rowNumber: number; planAdhesionOriginal: string; planAdhesionNormalise: string; categorieMembre: string; societeOriginale: string; societeNormalisee: string; paysOriginal: string; paysNormalise: string; zoneGeographique: string; regionAfrique: string | null; emailOriginal: string; emailNormalise: string; emailValide: boolean; montant: number; dateInscription: Date | null; numFacture: string; modePaiementOriginal: string; modePaiementNormalise: string; datePaiementActivation: Date | null; sourceId: string; statutActivation: string; typeAdhesionOriginal: string; typeAdhesionNormalise: string; codeMembre: string; datePaiementComptabilite: Date | null; statutPaiement: string; montantPaye: number; montantARecouvrer: number; delaiInscriptionPaiementJours: number | null; delaiPaiementComptabiliteJours: number | null; ageCreanceJours: number | null; trancheAgeCreance: string; flagDoublonEmail: boolean; flagDoublonCodeMembre: boolean; flagDoublonFacture: boolean; flagPayeSansDatePaiement: boolean; flagPayeSansDateCompta: boolean; flagPayeSansCodeMembre: boolean; flagPayeNonActif: boolean; flagActifNonPaye: boolean; scoreQualiteLigne: number }> = [];

    for (const raw of rawBatch) {
      let score = 100;
      const emailResult = normalizeEmail(raw.email);
      if (!raw.email) { score -= 20; errorsBatch.push({ uploadId, rowNumber: raw.rowNumber, columnName: 'EMAIL', errorType: 'email_manquant', errorMessage: 'Email manquant', severity: 'important' }); }
      else if (!emailResult.valid) { score -= 15; errorsBatch.push({ uploadId, rowNumber: raw.rowNumber, columnName: 'EMAIL', errorType: 'email_invalide', errorMessage: `Email invalide: ${raw.email}`, severity: 'important' }); }

      const countryResult = normalizeCountry(raw.pays);
      if (!raw.pays) { score -= 10; errorsBatch.push({ uploadId, rowNumber: raw.rowNumber, columnName: 'PAYS', errorType: 'pays_manquant', errorMessage: 'Pays manquant', severity: 'mineur' }); }

      const statutPaiement = normalizeStatutPaiement(raw.aPaye);
      const statutActivation = normalizeStatutActivation(raw.estActive);

      const delaiIP = calcDelayDays(raw.dateInscription, raw.datePaiementActivation);
      const delaiPC = calcDelayDays(raw.datePaiementActivation, raw.datePaiementComptabilite);
      const ageCreance = statutPaiement === 'Non payé' && raw.dateInscription ? calcDelayDays(raw.dateInscription, new Date()) : null;
      const tranche = ageCreance === null ? '' : ageCreance < 30 ? '<30' : ageCreance <= 60 ? '30-60' : ageCreance <= 90 ? '60-90' : '>90';

      const doublonEmail = emailResult.value ? (emailCounts[emailResult.value] || 0) > 1 : false;
      const doublonCode = raw.codeMembre ? (codeCounts[raw.codeMembre] || 0) > 1 : false;
      const doublonFacture = raw.numFacture ? (factureCounts[raw.numFacture] || 0) > 1 : false;
      const payeSansDate = statutPaiement === 'Payé' && !raw.datePaiementActivation;
      const payeSansCompta = statutPaiement === 'Payé' && !raw.datePaiementComptabilite;
      const payeSansCode = statutPaiement === 'Payé' && !raw.codeMembre;
      const payeNonActif = statutPaiement === 'Payé' && statutActivation === 'Non actif';
      const actifNonPaye = statutActivation === 'Actif' && statutPaiement !== 'Payé';

      if (doublonEmail) score -= 10;
      if (doublonCode) score -= 10;
      if (doublonFacture) score -= 10;
      if (payeSansDate) score -= 5;
      if (payeSansCompta) score -= 5;
      if (payeSansCode) score -= 5;
      if (payeNonActif) score -= 10;
      if (actifNonPaye) score -= 10;
      if (!raw.dateInscription) score -= 10;
      score = Math.max(0, score);

      if (score >= 50) validRows++; else invalidRows++;

      if (doublonEmail && raw.rowNumber <= 10) errorsBatch.push({ uploadId, rowNumber: raw.rowNumber, columnName: 'EMAIL', errorType: 'doublon_email', errorMessage: `Doublon email: ${emailResult.value}`, severity: 'mineur' });

      cleanBatch.push({
        uploadId, rowNumber: raw.rowNumber,
        planAdhesionOriginal: raw.planAdhesion,
        planAdhesionNormalise: raw.planAdhesion.trim(),
        categorieMembre: normalizePlanAdhesion(raw.planAdhesion),
        societeOriginale: raw.societeInstitutionUniv,
        societeNormalisee: raw.societeInstitutionUniv.trim(),
        paysOriginal: raw.pays,
        paysNormalise: countryResult.paysNormalise,
        zoneGeographique: countryResult.zoneGeographique,
        regionAfrique: countryResult.regionAfrique,
        emailOriginal: raw.email,
        emailNormalise: emailResult.value,
        emailValide: emailResult.valid,
        montant: raw.montant,
        dateInscription: raw.dateInscription,
        numFacture: raw.numFacture,
        modePaiementOriginal: raw.modePaiement,
        modePaiementNormalise: normalizeModePaiement(raw.modePaiement),
        datePaiementActivation: raw.datePaiementActivation,
        sourceId: raw.sourceId,
        statutActivation,
        typeAdhesionOriginal: raw.typeAdhesion,
        typeAdhesionNormalise: normalizeTypeAdhesion(raw.typeAdhesion),
        codeMembre: raw.codeMembre,
        datePaiementComptabilite: raw.datePaiementComptabilite,
        statutPaiement,
        montantPaye: statutPaiement === 'Payé' ? raw.montant : 0,
        montantARecouvrer: statutPaiement !== 'Payé' ? raw.montant : 0,
        delaiInscriptionPaiementJours: delaiIP,
        delaiPaiementComptabiliteJours: delaiPC,
        ageCreanceJours: ageCreance,
        trancheAgeCreance: tranche,
        flagDoublonEmail: doublonEmail, flagDoublonCodeMembre: doublonCode, flagDoublonFacture: doublonFacture,
        flagPayeSansDatePaiement: payeSansDate, flagPayeSansDateCompta: payeSansCompta, flagPayeSansCodeMembre: payeSansCode,
        flagPayeNonActif: payeNonActif, flagActifNonPaye: actifNonPaye,
        scoreQualiteLigne: score,
      });
    }

    // Bulk insert clean records
    for (let i = 0; i < cleanBatch.length; i += batchSize) {
      await db.adhesionRecordClean.createMany({ data: cleanBatch.slice(i, i + batchSize) });
    }

    // Save errors (limit 500)
    if (errorsBatch.length > 0) {
      await db.importError.createMany({ data: errorsBatch.slice(0, 500) });
    }

    // Activate dataset
    await db.uploadedFile.updateMany({ where: { isActiveDataset: true }, data: { isActiveDataset: false } });
    await db.uploadedFile.update({
      where: { id: uploadId },
      data: { importStatus: 'success', isActiveDataset: true, validRows, invalidRows },
    });

    return NextResponse.json({ success: true, totalRows: rawBatch.length, validRows, invalidRows, errors: errorsBatch.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Import error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
