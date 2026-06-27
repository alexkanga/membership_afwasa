'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatNumber, formatDate } from '@/lib/format';

interface UploadRecord {
  id: string;
  originalFilename: string;
  uploadedAt: string;
  totalRows: number | null;
  validRows: number | null;
  importStatus: string;
  isActiveDataset: boolean;
  errorMessage: string | null;
}

export function UploadView() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(() => {
    setLoadingHistory(true);
    fetch('/api/uploads')
      .then((r) => r.json())
      .then((d) => { setHistory(Array.isArray(d) ? d : d.files || []); setLoadingHistory(false); })
      .catch(() => setLoadingHistory(false));
  }, []);

  React.useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadResult({ success: false, message: 'Veuillez sélectionner un fichier Excel (.xlsx ou .xls)' });
      return;
    }
    setUploading(true);
    setUploadResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/uploads/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setUploadResult({ success: true, message: `Fichier importé avec succès — ${data.validRows || 0} enregistrements valides` });
        loadHistory();
      } else {
        setUploadResult({ success: false, message: data.error || data.message || "Erreur lors de l'import" });
      }
    } catch {
      setUploadResult({ success: false, message: "Erreur réseau lors de l'import" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Upload zone */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Importer un fichier Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragActive ? 'border-[#362981] bg-[#EBF8F9]' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleChange} />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-[#362981] animate-spin" />
                <p className="text-sm text-muted-foreground">Import en cours...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#EBF8F9]">
                  <Upload className="w-6 h-6 text-[#362981]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Glissez votre fichier Excel ici</p>
                  <p className="text-xs text-muted-foreground mt-1">ou cliquez pour sélectionner un fichier (.xlsx, .xls)</p>
                </div>
              </div>
            )}
          </div>

          {uploadResult && (
            <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${uploadResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {uploadResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              {uploadResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload history */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Historique des imports</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun import effectué</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[11px] h-8">Fichier</TableHead>
                    <TableHead className="text-[11px] h-8">Date</TableHead>
                    <TableHead className="text-[11px] h-8 text-right">Lignes</TableHead>
                    <TableHead className="text-[11px] h-8 text-right">Valides</TableHead>
                    <TableHead className="text-[11px] h-8">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="text-xs py-2">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-medium">{h.originalFilename}</span>
                          {h.isActiveDataset && <span className="text-[10px] bg-[#009446]/10 text-[#009446] px-1.5 py-0.5 rounded font-medium">Actif</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-2 text-muted-foreground">{formatDate(h.uploadedAt)}</TableCell>
                      <TableCell className="text-xs py-2 text-right">{formatNumber(h.totalRows)}</TableCell>
                      <TableCell className="text-xs py-2 text-right">{formatNumber(h.validRows)}</TableCell>
                      <TableCell className="text-xs py-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${h.importStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' : h.importStatus === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                          {h.importStatus === 'completed' ? 'Terminé' : h.importStatus === 'failed' ? 'Échoué' : 'En cours'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}