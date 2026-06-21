'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from './data-table';
import { StatusBadge } from './status-badge';
import { formatDate } from '@/lib/format';
import {
  Check,
  Archive,
  Eye,
  Star,
} from 'lucide-react';

interface UploadRecord {
  id: string;
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  status: string;
  isActive: boolean;
}

export function UploadsView() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/uploads')
      .then((r) => r.json())
      .then((d) => setUploads(d.uploads || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleActivate = (id: string) => {
    setUploads((prev) =>
      prev.map((u) => ({
        ...u,
        isActive: u.id === id,
        status: u.id === id ? 'active' : u.status === 'active' ? 'archived' : u.status,
      }))
    );
  };

  const handleArchive = (id: string) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'archived', isActive: false } : u))
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Historique des Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                key: 'filename',
                header: 'Fichier',
                className: 'font-medium min-w-[200px]',
                render: (item) => (
                  <div className="flex items-center gap-2">
                    {(item as unknown as UploadRecord).isActive && (
                      <Star className="w-3.5 h-3.5 text-[#009446] fill-[#009446] shrink-0" />
                    )}
                    <span className="truncate">{(item as unknown as UploadRecord).filename}</span>
                  </div>
                ),
              },
              {
                key: 'uploadedAt',
                header: 'Date',
                render: (item) => formatDate(item.uploadedAt as string),
                className: 'w-28',
              },
              { key: 'uploadedBy', header: 'Utilisateur', className: 'w-36' },
              {
                key: 'totalRows',
                header: 'Total Lignes',
                className: 'text-right w-20',
              },
              {
                key: 'validRows',
                header: 'Valides',
                className: 'text-right w-16',
              },
              {
                key: 'invalidRows',
                header: 'Erreurs',
                className: 'text-right w-16',
              },
              {
                key: 'status',
                header: 'Statut',
                render: (item) => <StatusBadge status={item.status as string} />,
                className: 'w-24',
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'w-28',
                render: (item) => {
                  const upload = item as unknown as UploadRecord;
                  return (
                    <div className="flex items-center gap-1">
                      {upload.status !== 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#009446] hover:bg-emerald-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivate(upload.id);
                          }}
                          title="Activer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {upload.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-amber-600 hover:bg-amber-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(upload.id);
                          }}
                          title="Archiver"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#029CB1] hover:bg-[#EBF8F9]"
                        onClick={(e) => e.stopPropagation()}
                        title="Voir détails"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  );
                },
              },
            ]}
            data={uploads as unknown as Record<string, unknown>[]}
            pageSize={10}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
