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
import { formatPercent, formatNumber } from '@/lib/format';
import { KpiCard } from './kpi-card';
import { Globe } from 'lucide-react';

interface GeographyData {
  africaVsOther: {
    afrique: { count: number; pourcentage: number };
    horsAfrique: { count: number; pourcentage: number };
  };
  paysRepartition: { pays: string; count: number; tauxPaiement: number }[];
  regions: { region: string; count: number; pourcentage: number }[];
  totalPays: number;
}

const DONUT_COLORS = ['#362981', '#9AD2E2'];

export function GeographyView() {
  const [data, setData] = useState<GeographyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/geography')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const donutData = data
    ? [
        { name: 'Afrique', value: data.africaVsOther.afrique.count },
        { name: 'Hors Afrique', value: data.africaVsOther.horsAfrique.count },
      ]
    : [];

  const regionsData = data?.regions || [];

  return (
    <div className="space-y-6">
      {/* KPI + Donut Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Afrique vs Hors Afrique</CardTitle>
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
                      innerRadius={55}
                      outerRadius={90}
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

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Répartition Régionale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionsData} layout="vertical" margin={{ left: 90 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="region" tick={{ fontSize: 9 }} stroke="#94a3b8" width={85} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Bar dataKey="count" name="Membres" fill="#029CB1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <KpiCard
            title="Total Pays Représentés"
            value={data?.totalPays || 0}
            format="number"
            color="violet"
            icon={Globe}
            loading={loading}
          />
          <KpiCard
            title="Membres en Afrique"
            value={data?.africaVsOther.afrique.count || 0}
            subtitle={`${data?.africaVsOther.afrique.pourcentage || 0}% du total`}
            format="number"
            color="green"
            icon={Globe}
            loading={loading}
          />
          <KpiCard
            title="Membres Hors Afrique"
            value={data?.africaVsOther.horsAfrique.count || 0}
            subtitle={`${data?.africaVsOther.horsAfrique.pourcentage || 0}% du total`}
            format="number"
            color="teal"
            icon={Globe}
            loading={loading}
          />
        </div>
      </div>

      {/* Members per Country */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-[#362981]">Membres par Pays (Top 15)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {loading ? (
              <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data?.paysRepartition || []).slice(0, 15)} margin={{ left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis type="category" dataKey="pays" tick={{ fontSize: 9 }} stroke="#94a3b8" width={65} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Membres" fill="#362981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment rate by Country + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Taux de Paiement par Pays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(data?.paysRepartition || []).slice(0, 10).reverse()}
                    layout="vertical"
                    margin={{ left: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="pays" tick={{ fontSize: 9 }} stroke="#94a3b8" width={65} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Taux']}
                    />
                    <Bar dataKey="tauxPaiement" name="Taux %" fill="#009446" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Détail par Pays</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'pays', header: 'Pays', className: 'font-medium' },
                { key: 'count', header: 'Membres', className: 'text-right' },
                {
                  key: 'tauxPaiement',
                  header: 'Taux Paiement',
                  className: 'text-right',
                  render: (item) => formatPercent(item.tauxPaiement as number),
                },
              ]}
              data={(data?.paysRepartition || []) as unknown as Record<string, unknown>[]}
              pageSize={8}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
