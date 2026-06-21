'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './data-table';
import { StatusBadge } from './status-badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

interface QualityData {
  scoreGlobal: number;
  completeness: { champ: string; taux: number; statut: string }[];
  doublons: { type: string; count: number }[];
  anomalies: { id: string; type: string; champ: string; description: string; severite: string; count: number }[];
}

function getQualityColor(statut: string): string {
  switch (statut) {
    case 'bon': return 'bg-emerald-500';
    case 'moyen': return 'bg-amber-500';
    case 'faible': return 'bg-red-500';
    default: return 'bg-gray-300';
  }
}

function getQualityLabel(statut: string): string {
  switch (statut) {
    case 'bon': return 'Bon';
    case 'moyen': return 'Moyen';
    case 'faible': return 'Faible';
    default: return '—';
  }
}

function getQualityTextColor(statut: string): string {
  switch (statut) {
    case 'bon': return 'text-emerald-700';
    case 'moyen': return 'text-amber-700';
    case 'faible': return 'text-red-700';
    default: return 'text-gray-700';
  }
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-[#009446]';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
}

function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-emerald-50';
  if (score >= 70) return 'bg-amber-50';
  return 'bg-red-50';
}

const BAR_COLORS = ['#362981', '#029CB1', '#009446', '#9AD2E2'];

export function QualityView() {
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/quality')
      .then((r) => r.json())
      .then((d) => {
        console.log('QUALITY_DATA:', JSON.stringify(d).substring(0, 200));
        setData(d);
      })
      .catch((e) => {
        console.error('QUALITY_FETCH_ERROR:', e);
      })
      .finally(() => setLoading(false));
  }, []);

  const score = data?.scoreGlobal ? Number(data.scoreGlobal) : 0;
  const scoreLabel = score >= 85 ? 'bon' : score >= 70 ? 'moyen' : 'faible';

  return (
    <div className="space-y-6">
      {/* Global Quality Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={cn('shadow-sm border-2', score >= 85 ? 'border-emerald-200' : score >= 70 ? 'border-amber-200' : 'border-red-200')}>
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
            <ShieldCheck className={cn('w-10 h-10', getScoreColor(score))} />
            <div className="text-center">
              <span className="text-xs text-muted-foreground font-medium">Score Global de Qualité</span>
              <div className={cn('text-4xl font-bold mt-1', getScoreColor(score))}>
                {loading ? '—' : String(score.toFixed(1))}
              </div>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            {!loading && (
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                getScoreBg(score),
                getQualityTextColor(scoreLabel)
              )}>
                {score >= 85 ? 'Excellent' : score >= 70 ? 'Acceptable' : 'À améliorer'}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Completeness Cards */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Taux de Complétude par Champ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
                ))
              ) : (
                (data?.completeness || []).map((item) => (
                  <div
                    key={String(item.champ)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-gray-50/50"
                  >
                    <div className="relative w-12 h-12 flex items-center justify-center">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={item.statut === 'bon' ? '#009446' : item.statut === 'moyen' ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${Number(item.taux)}, 100`}
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold">{Number(item.taux)}%</span>
                    </div>
                    <span className="text-[10px] text-center text-muted-foreground leading-tight">{String(item.champ)}</span>
                    <span className={cn('text-[9px] font-medium', getQualityTextColor(String(item.statut)))}>
                      {getQualityLabel(String(item.statut))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Duplicate Counts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Doublons Détectés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.doublons || []} layout="vertical" margin={{ left: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 9 }} stroke="#94a3b8" width={85} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="count" name="Occurrences" radius={[0, 4, 4, 0]}>
                      {(data?.doublons || []).map((_, index) => (
                        <Cell key={String(index)} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Anomalies Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Anomalies Détectées</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'type', header: 'Type', className: 'font-medium' },
                { key: 'champ', header: 'Champ' },
                { key: 'description', header: 'Description', className: 'text-xs' },
                {
                  key: 'severite',
                  header: 'Sévérité',
                  render: (item) => <StatusBadge status={String(item.severite)} />,
                  className: 'w-24',
                },
                { key: 'count', header: 'Nb', className: 'w-12 text-right' },
              ]}
              data={(data?.anomalies || []) as unknown as Record<string, unknown>[]}
              pageSize={8}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
