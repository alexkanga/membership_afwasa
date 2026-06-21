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
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/format';
import { KpiCard } from './kpi-card';
import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

interface FinanceData {
  kpis: {
    montantAttendu: number;
    montantPaye: number;
    montantARecouvrer: number;
    tauxRecouvrement: number;
  };
  trends: Record<string, number>;
  waterfall: { etape: string; valeur: number }[];
  modePaiement: { mode: string; montant: number; pourcentage: number }[];
  monthlyRevenue: { mois: string; montant: number }[];
  ageCreance: { tranche: string; montant: number; count: number }[];
  toFollowUp: { id: string; societe: string; pays: string; montant: number; ageJours: number; tranche: string }[];
}

const PIE_COLORS = ['#362981', '#009446', '#029CB1', '#9AD2E2', '#C7FFEE'];

export function FinanceView() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/finance')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { kpis, trends } = data || {
    kpis: { montantAttendu: 0, montantPaye: 0, montantARecouvrer: 0, tauxRecouvrement: 0 },
    trends: {},
  };

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Montant Attendu"
          value={kpis.montantAttendu}
          trend={trends.montantAttendu}
          format="currency"
          color="violet"
          icon={DollarSign}
          loading={loading}
        />
        <KpiCard
          title="Montant Payé"
          value={kpis.montantPaye}
          trend={trends.montantPaye}
          format="currency"
          color="green"
          icon={TrendingUp}
          loading={loading}
        />
        <KpiCard
          title="Montant à Recouvrer"
          value={kpis.montantARecouvrer}
          trend={trends.montantARecouvrer}
          format="currency"
          color="orange"
          icon={TrendingDown}
          loading={loading}
        />
        <KpiCard
          title="Taux de Recouvrement"
          value={kpis.tauxRecouvrement}
          trend={trends.tauxRecouvrement}
          format="percent"
          color={kpis.tauxRecouvrement >= 85 ? 'green' : kpis.tauxRecouvrement >= 65 ? 'orange' : 'red'}
          icon={CreditCard}
          loading={loading}
        />
      </div>

      {/* Waterfall + Payment Mode */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall-style Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Flux Financier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.waterfall || []} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="etape" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Montant']}
                    />
                    <Bar dataKey="valeur" name="Montant" radius={[6, 6, 0, 0]}>
                      {(data?.waterfall || []).map((_, index) => (
                        <Cell
                          key={index}
                          fill={['#362981', '#009446', '#ef4444'][index % 3]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Mode Pie */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Répartition par Mode de Paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.modePaiement || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      dataKey="pourcentage"
                      nameKey="mode"
                      label={({ mode, pourcentage }) => `${mode} ${pourcentage}%`}
                      labelLine={false}
                      fontSize={10}
                    >
                      {(data?.modePaiement || []).map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: number) => [`${value}%`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue + Age Creance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Area */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Revenus Mensuels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.monthlyRevenue || []}>
                    <defs>
                      <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#362981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#362981" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenu']}
                    />
                    <Area
                      type="monotone"
                      dataKey="montant"
                      name="Revenu"
                      stroke="#362981"
                      strokeWidth={2}
                      fill="url(#colorMontant)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Age Creance Bar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Créances par Tranche d&apos;Âge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.ageCreance || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="tranche" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Montant']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="montant" name="Montant (€)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Membres à Relancer</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              { key: 'id', header: 'Code', className: 'w-24 font-medium' },
              { key: 'societe', header: 'Société' },
              { key: 'pays', header: 'Pays' },
              {
                key: 'montant',
                header: 'Montant (€)',
                className: 'text-right',
                render: (item) => formatCurrency(item.montant as number),
              },
              { key: 'ageJours', header: 'Âge (j)', className: 'text-right' },
              {
                key: 'tranche',
                header: 'Tranche',
                render: (item) => <StatusBadge status={item.tranche as string} />,
                className: 'w-32',
              },
            ]}
            data={(data?.toFollowUp || []) as unknown as Record<string, unknown>[]}
            pageSize={8}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
