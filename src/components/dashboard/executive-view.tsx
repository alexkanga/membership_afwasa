'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TotalInscriptionsKpi,
  MembresUniquesKpi,
  MembresPayesKpi,
  TauxPaiementKpi,
  MontantPayeKpi,
  MontantARecouvrerKpi,
  TauxRecouvrementKpi,
  MembresActifsKpi,
  PaysRepresentesKpi,
} from './kpi-card';
import { DataTable } from './data-table';
import { StatusBadge } from './status-badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface SummaryData {
  kpis: {
    totalInscriptions: number;
    membresUniques: number;
    membresPayes: number;
    tauxPaiement: number;
    montantPaye: number;
    montantARecouvrer: number;
    tauxRecouvrement: number;
    membresActifs: number;
    paysRepresentes: number;
  };
  trends: Record<string, number>;
  monthlyEvolution: { mois: string; inscriptions: number; paiements: number }[];
  topCountries: { pays: string; count: number }[];
  topCategories: { categorie: string; count: number }[];
  alerts: { id: string; type: string; description: string; severite: string; count: number }[];
}

export function ExecutiveView() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { kpis, trends } = data || {
    kpis: {
      totalInscriptions: 0, membresUniques: 0, membresPayes: 0,
      tauxPaiement: 0, montantPaye: 0, montantARecouvrer: 0,
      tauxRecouvrement: 0, membresActifs: 0, paysRepresentes: 0,
    },
    trends: {},
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <TotalInscriptionsKpi value={kpis.totalInscriptions} trend={trends.totalInscriptions} loading={loading} />
        <MembresUniquesKpi value={kpis.membresUniques} trend={trends.membresUniques} loading={loading} />
        <MembresPayesKpi value={kpis.membresPayes} trend={trends.membresPayes} loading={loading} />
        <TauxPaiementKpi value={kpis.tauxPaiement} trend={trends.tauxPaiement} loading={loading} />
        <MontantPayeKpi value={kpis.montantPaye} trend={trends.montantPaye} loading={loading} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MontantARecouvrerKpi value={kpis.montantARecouvrer} trend={trends.montantARecouvrer} loading={loading} />
        <TauxRecouvrementKpi value={kpis.tauxRecouvrement} trend={trends.tauxRecouvrement} loading={loading} />
        <MembresActifsKpi value={kpis.membresActifs} trend={trends.membresActifs} loading={loading} />
        <PaysRepresentesKpi value={kpis.paysRepresentes} trend={trends.paysRepresentes} loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Evolution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Évolution Mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.monthlyEvolution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line
                      type="monotone"
                      dataKey="inscriptions"
                      name="Inscriptions"
                      stroke="#362981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="paiements"
                      name="Paiements"
                      stroke="#009446"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 10 Countries */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Top 10 Pays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(data?.topCountries || []).reverse()}
                    layout="vertical"
                    margin={{ left: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      type="category"
                      dataKey="pays"
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      width={75}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" name="Membres" fill="#029CB1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Categories */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Top 5 Catégories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-100 animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.topCategories || []}
                    layout="vertical"
                    margin={{ left: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis
                      type="category"
                      dataKey="categorie"
                      tick={{ fontSize: 10 }}
                      stroke="#94a3b8"
                      width={65}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" name="Membres" fill="#362981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts Summary */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[#362981]">Alertes Critiques</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: 'type', header: 'Type', className: 'font-medium' },
                { key: 'description', header: 'Description' },
                {
                  key: 'severite',
                  header: 'Sévérité',
                  render: (item) => <StatusBadge status={item.severite as string} />,
                  className: 'w-28',
                },
                { key: 'count', header: 'Nb', className: 'w-16 text-center' },
              ]}
              data={(data?.alerts || []).map((a) => ({
                ...a,
                id: a.id,
              }))}
              pageSize={5}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
