'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './data-table';
import { StatusBadge } from './status-badge';
import { cn } from '@/lib/utils';

interface RiskData {
  riskMatrix: { categorie: string; niveau: string; score: number; tendance: string }[];
  criticalAlerts: {
    id: string;
    titre: string;
    description: string;
    severite: string;
    date: string;
    categorie: string;
  }[];
  membersAtRisk: {
    id: string;
    societe: string;
    pays: string;
    risk: string;
    motif: string;
  }[];
  countriesAtRisk: {
    pays: string;
    risque: string;
    tauxPaiement: number;
    membreCount: number;
    motif: string;
  }[];
  recommendations: {
    id: string;
    priorite: string;
    titre: string;
    description: string;
    categorie: string;
  }[];
}

function getRiskBg(niveau: string): string {
  switch (niveau) {
    case 'élevé': return 'bg-red-100 border-red-300';
    case 'moyen': return 'bg-amber-100 border-amber-300';
    case 'faible': return 'bg-emerald-100 border-emerald-300';
    default: return 'bg-gray-100 border-gray-300';
  }
}

function getRiskText(niveau: string): string {
  switch (niveau) {
    case 'élevé': return 'text-red-700';
    case 'moyen': return 'text-amber-700';
    case 'faible': return 'text-emerald-700';
    default: return 'text-gray-700';
  }
}

function getPriorityColor(priorite: string): string {
  switch (priorite) {
    case 'haute': return 'bg-red-100 text-red-700 border-red-200';
    case 'moyenne': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'basse': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getTendanceIcon(tendance: string): string {
  switch (tendance) {
    case 'en hausse': return '↑';
    case 'en baisse': return '↓';
    default: return '→';
  }
}

export function RisksView() {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/risks')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Risk Matrix */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Matrice des Risques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
              ))
            ) : (
              data?.riskMatrix.map((item) => (
                <div
                  key={item.categorie}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2',
                    getRiskBg(item.niveau)
                  )}
                >
                  <span className="text-xs font-medium text-center">{item.categorie}</span>
                  <div className="flex items-baseline gap-1">
                    <span className={cn('text-2xl font-bold', getRiskText(item.niveau))}>
                      {item.score}
                    </span>
                    <span className={cn('text-lg', getRiskText(item.niveau))}>
                      {getTendanceIcon(item.tendance)}
                    </span>
                  </div>
                  <span className={cn('text-[10px] font-medium uppercase', getRiskText(item.niveau))}>
                    {item.niveau}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Alertes Critiques</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'titre', header: 'Titre', className: 'font-medium' },
              { key: 'description', header: 'Description', className: 'text-xs' },
              {
                key: 'severite',
                header: 'Sévérité',
                render: (item) => <StatusBadge status={item.severite as string} />,
                className: 'w-24',
              },
              {
                key: 'categorie',
                header: 'Catégorie',
                className: 'w-28',
              },
              {
                key: 'date',
                header: 'Date',
                className: 'w-24',
              },
            ]}
            data={(data?.criticalAlerts || []) as unknown as Record<string, unknown>[]}
            pageSize={6}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Members at Risk + Countries at Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Membres à Risque</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'id', header: 'Code', className: 'w-24 font-medium' },
                { key: 'societe', header: 'Société' },
                { key: 'pays', header: 'Pays' },
                {
                  key: 'risk',
                  header: 'Risque',
                  render: (item) => <StatusBadge status={item.risk as string} />,
                  className: 'w-20',
                },
                { key: 'motif', header: 'Motif', className: 'text-xs' },
              ]}
              data={(data?.membersAtRisk || []) as unknown as Record<string, unknown>[]}
              pageSize={6}
              loading={loading}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Pays à Risque</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'pays', header: 'Pays', className: 'font-medium' },
                {
                  key: 'risque',
                  header: 'Risque',
                  render: (item) => <StatusBadge status={item.risque as string} />,
                  className: 'w-20',
                },
                {
                  key: 'tauxPaiement',
                  header: 'Taux Paiement',
                  className: 'text-right',
                  render: (item) => `${(item.tauxPaiement as number).toFixed(1)}%`,
                },
                { key: 'membreCount', header: 'Membres', className: 'text-right' },
                { key: 'motif', header: 'Motif', className: 'text-xs' },
              ]}
              data={(data?.countriesAtRisk || []) as unknown as Record<string, unknown>[]}
              pageSize={6}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
              ))
            ) : (
              data?.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-gray-50/50"
                >
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0 mt-0.5',
                      getPriorityColor(rec.priorite)
                    )}
                  >
                    {rec.priorite}
                  </span>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground">{rec.titre}</span>
                    <span className="text-xs text-muted-foreground">{rec.description}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{rec.categorie}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
