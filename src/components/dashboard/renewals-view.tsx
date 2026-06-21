'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from './data-table';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency, formatNumber } from '@/lib/format';
import { KpiCard } from './kpi-card';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface RenewalsData {
  nouveauVsRenouvellement: {
    nouveau: { count: number; pourcentage: number };
    renouvellement: { count: number; pourcentage: number };
  };
  revenuNouveauVsRenouvellement: {
    nouveau: { montant: number; pourcentage: number };
    renouvellement: { montant: number; pourcentage: number };
  };
  tauxRenouvellement: number;
  tendanceRenouvellement: number;
  byCountry: { pays: string; nouveau: number; renouvellement: number; total: number }[];
  byCategory: { categorie: string; nouveau: number; renouvellement: number; total: number }[];
}

const DONUT_COLORS = ['#029CB1', '#362981'];

export function RenewalsView() {
  const [data, setData] = useState<RenewalsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/renewals')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const donutData = data
    ? [
        { name: 'Nouveau', value: data.nouveauVsRenouvellement.nouveau.count },
        { name: 'Renouvellement', value: data.nouveauVsRenouvellement.renouvellement.count },
      ]
    : [];

  const revenueData = data
    ? [
        { name: 'Nouveau', value: data.revenuNouveauVsRenouvellement.nouveau.montant },
        { name: 'Renouvellement', value: data.revenuNouveauVsRenouvellement.renouvellement.montant },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Taux de Renouvellement"
          value={data?.tauxRenouvellement || 0}
          trend={data?.tendanceRenouvellement}
          format="percent"
          color={data?.tauxRenouvellement >= 75 ? 'green' : data?.tauxRenouvellement >= 60 ? 'orange' : 'red'}
          icon={RefreshCw}
          loading={loading}
        />
        <KpiCard
          title="Nouvelles Inscriptions"
          value={data?.nouveauVsRenouvellement.nouveau.count || 0}
          subtitle={`${data?.nouveauVsRenouvellement.nouveau.pourcentage || 0}% du total`}
          format="number"
          color="teal"
          icon={TrendingUp}
          loading={loading}
        />
        <KpiCard
          title="Renouvellements"
          value={data?.nouveauVsRenouvellement.renouvellement.count || 0}
          subtitle={`${data?.nouveauVsRenouvellement.renouvellement.pourcentage || 0}% du total`}
          format="number"
          color="violet"
          icon={RefreshCw}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New vs Renewal Donut */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Nouveau vs Renouvellement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {loading ? (
                <div className="h-full w-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      fontSize={11}
                    >
                      {donutData.map((_, index) => (
                        <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by New vs Renewal */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Revenus : Nouveau vs Renouvellement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ ...revenueData[0], Nouveau: revenueData[0].value, Renouvellement: revenueData[1].value }]} margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: number) => [formatCurrency(value)]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Nouveau" fill="#029CB1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Renouvellement" fill="#362981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Country */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Renouvellements par Pays</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'pays', header: 'Pays', className: 'font-medium' },
                { key: 'nouveau', header: 'Nouveau', className: 'text-right' },
                { key: 'renouvellement', header: 'Renouvel.', className: 'text-right' },
                { key: 'total', header: 'Total', className: 'text-right font-medium' },
              ]}
              data={(data?.byCountry || []) as unknown as Record<string, unknown>[]}
              pageSize={8}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* By Category */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Renouvellements par Catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'categorie', header: 'Catégorie', className: 'font-medium' },
                { key: 'nouveau', header: 'Nouveau', className: 'text-right' },
                { key: 'renouvellement', header: 'Renouvel.', className: 'text-right' },
                { key: 'total', header: 'Total', className: 'text-right font-medium' },
              ]}
              data={(data?.byCategory || []) as unknown as Record<string, unknown>[]}
              pageSize={8}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
