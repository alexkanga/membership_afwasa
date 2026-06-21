'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminPanel() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [thresholds, setThresholds] = useState({
    paymentRate: 80,
    recoveryRate: 85,
    activationRate: 80,
    duplicateEmails: 10,
    unaccountedPayments: 10,
    oldDebt90Days: 5,
  });

  const simulateUpload = (filename: string) => {
    setUploadedFile(filename);
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadStatus('success');
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 300);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.length > 0) {
      simulateUpload(files[0].name);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length > 0) {
      simulateUpload(files[0].name);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Import de Données</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer',
              dragActive
                ? 'border-[#362981] bg-[#EBF8F9]'
                : 'border-gray-300 bg-gray-50/50 hover:border-[#362981]/50 hover:bg-[#EBF8F9]/50'
            )}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploading ? (
              <>
                <Loader2 className="w-10 h-10 text-[#362981] animate-spin" />
                <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                  <span className="text-sm font-medium">Import en cours...</span>
                  <Progress value={Math.min(uploadProgress, 100)} className="w-full h-2" />
                  <span className="text-xs text-muted-foreground">{Math.min(Math.round(uploadProgress), 100)}%</span>
                </div>
              </>
            ) : uploadStatus === 'success' ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-[#009446]" />
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-sm font-medium text-[#009446]">Import réussi !</span>
                  <span className="text-xs text-muted-foreground">{uploadedFile}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadStatus('idle');
                    setUploadedFile(null);
                  }}
                >
                  Importer un autre fichier
                </Button>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-10 h-10 text-muted-foreground" />
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-sm font-medium">
                    Glissez-déposez votre fichier Excel ici
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ou cliquez pour sélectionner (.xlsx, .xls)
                  </span>
                </div>
                <Upload className="w-5 h-5 text-muted-foreground" />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last Import Status */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Dernier Import</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">Statut</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#009446]" />
                <span className="text-sm font-medium text-[#009446]">Terminé</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">Lignes traitées</span>
              <span className="text-sm font-bold">1 523</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">Erreurs</span>
              <span className="text-sm font-bold text-amber-600">25</span>
            </div>
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50">
              <span className="text-[10px] text-muted-foreground uppercase font-medium">Date</span>
              <span className="text-sm font-medium">15 Déc 2024</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Results */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Résultats de Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: 'Structure du fichier', status: 'ok', message: 'Onglet "INSCRIPTIONS ET ADHESIONS" trouvé' },
              { label: 'Colonnes requises', status: 'ok', message: '15/15 colonnes présentes' },
              { label: 'Formats de données', status: 'warning', message: '23 emails au format non standard' },
              { label: 'Doublons', status: 'warning', message: '15 enregistrements potentiellement dupliqués' },
              { label: 'Codes membres', status: 'ok', message: 'Tous les codes membres sont uniques' },
              { label: 'Montants', status: 'error', message: '3 montants négatifs détectés' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                {item.status === 'ok' && <CheckCircle2 className="w-4 h-4 text-[#009446] shrink-0" />}
                {item.status === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                {item.status === 'error' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-medium">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground">{item.message}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Thresholds */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#362981]" />
            <CardTitle className="text-sm font-semibold text-[#362981]">Seuils de Qualité</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(thresholds).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-2 p-3 rounded-lg border bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {key === 'paymentRate' ? 'Taux de Paiement' :
                     key === 'recoveryRate' ? 'Taux de Recouvrement' :
                     key === 'activationRate' ? "Taux d'Activation" :
                     key === 'duplicateEmails' ? 'Emails Doublons' :
                     key === 'unaccountedPayments' ? 'Paiements Non Comptabilisés' :
                     'Créances > 90j'}
                  </span>
                  <span className="text-xs font-bold text-[#362981]">{value}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => setThresholds((prev) => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full h-1.5 accent-[#362981]"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-end">
            <Button
              size="sm"
              className="bg-[#362981] hover:bg-[#372D72] text-white"
              onClick={() => {}}
            >
              Enregistrer les seuils
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
