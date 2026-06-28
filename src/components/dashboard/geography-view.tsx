'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { useDashboardStore } from '@/stores/auth-store';
import { useFilteredSummary } from '@/hooks/use-filtered-summary';
import { toFcfa, formatFcfa, formatNumber, formatPercent } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';
import { Globe, Wallet } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface SummaryData {
  geographie: {
    afriquePayes: number; afriqueNonPayes: number;
    horsAfriquePayes: number; horsAfriqueNonPayes: number;
    montantAfriquePaye: number; montantHorsAfriquePaye: number;
    montantAfriqueRecouvrer: number; montantHorsAfriqueRecouvrer: number;
    paysPayesUniques: number; paysTousUniques: number;
  };
  pays: { pays: string; inscritsPayes: number; inscritsNonPayes: number; total: number; pctTotal: number }[];
  regions: { region: string; payes: number; nonPayes: number; total: number }[];
  plansList: string[];
}

const PIE_COLORS = [CHART_COLORS.green, CHART_COLORS.blue];

function GeoKpi({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground font-medium truncate leading-tight">{label}</span>
            <span className="text-lg font-bold leading-tight">{value}</span>
          </div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonutSmall({ title, afrique, horsAfrique, colors }: {
  title: string; afrique: number; horsAfrique: number; colors: string[];
}) {
  const total = afrique + horsAfrique;
  const pieData = [{ name: 'Afrique', value: afrique }, { name: 'Hors Afrique', value: horsAfrique }];
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-[11px] font-semibold text-center text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" nameKey="name" stroke="none" paddingAngle={2}>
              {pieData.map((_, i) => (<Cell key={i} fill={colors[i % colors.length]} />))}
            </Pie>
            <Tooltip formatter={(v: number) => formatNumber(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-3">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[0] }} /><span className="text-[10px] text-muted-foreground">Afrique ({formatNumber(afrique)})</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[1] }} /><span className="text-[10px] text-muted-foreground">Hors Afrique ({formatNumber(horsAfrique)})</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GeographyView() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const resetFilters = useDashboardStore((s) => s.resetFilters);
  const applyFilters = useDashboardStore((s) => s.applyFilters);
  const { data, loading } = useFilteredSummary<SummaryData>();

  const geo = data?.geographie;

  const regionPayesData = useMemo(() => (data?.regions || []).map(r => ({ region: r.region, payes: r.payes, nonPayes: r.nonPayes, total: r.total })), [data]);
  const regionPayesOnly = useMemo(() => regionPayesData.map(r => ({ region: r.region, Membres: r.payes })), [regionPayesData]);
  const regionNonPayesOnly = useMemo(() => regionPayesData.map(r => ({ region: r.region, Membres: r.nonPayes })), [regionPayesData]);
  const regionTous = useMemo(() => regionPayesData.map(r => ({ region: r.region, Membres: r.total })), [regionPayesData]);

  if (loading) {
    return <div className="space-y-6"><div className="h-10 animate-pulse bg-muted rounded" /><div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted rounded" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilter(k, v as never)} onApply={applyFilters} onReset={resetFilters} plans={data?.plansList || []} />

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <GeoKpi label="Inscrits Afrique payés" value={formatNumber(geo?.afriquePayes)} icon={Globe} color="bg-[#009446]" />
        <GeoKpi label="Inscrits Hors Afrique payés" value={formatNumber(geo?.horsAfriquePayes)} icon={Globe} color="bg-[#029CB1]" />
        <GeoKpi label="Inscrits Afrique non payés" value={formatNumber(geo?.afriqueNonPayes)} icon={Globe} color="bg-amber-500" />
        <GeoKpi label="Inscrits Hors Afrique non payés" value={formatNumber(geo?.horsAfriqueNonPayes)} icon={Globe} color="bg-[#8B5CF6]" />
        <GeoKpi label="Pays représentés (payés)" value={formatNumber(geo?.paysPayesUniques)} icon={Globe} color="bg-[#009446]" />
        <GeoKpi label="Pays représentés (tous)" value={formatNumber(geo?.paysTousUniques)} icon={Globe} color="bg-[#362981]" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GeoKpi label="Montant payé Afrique" value={formatFcfa(toFcfa(geo?.montantAfriquePaye || 0))} icon={Wallet} color="bg-[#009446]" />
        <GeoKpi label="Montant payé Hors Afrique" value={formatFcfa(toFcfa(geo?.montantHorsAfriquePaye || 0))} icon={Wallet} color="bg-[#029CB1]" />
        <GeoKpi label="À recouvrer Afrique" value={formatFcfa(toFcfa(geo?.montantAfriqueRecouvrer || 0))} icon={Wallet} color="bg-amber-500" />
        <GeoKpi label="À recouvrer Hors Afrique" value={formatFcfa(toFcfa(geo?.montantHorsAfriqueRecouvrer || 0))} icon={Wallet} color="bg-red-500" />
      </div>

      {/* 3 Donut charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutSmall title="Afrique vs Hors Afrique — Payés" afrique={geo?.afriquePayes || 0} horsAfrique={geo?.horsAfriquePayes || 0} colors={PIE_COLORS} />
        <DonutSmall title="Afrique vs Hors Afrique — Non payés" afrique={geo?.afriqueNonPayes || 0} horsAfrique={geo?.horsAfriqueNonPayes || 0} colors={[CHART_COLORS.orange, CHART_COLORS.violet]} />
        <DonutSmall title="Afrique vs Hors Afrique — Tous" afrique={(geo?.afriquePayes || 0) + (geo?.afriqueNonPayes || 0)} horsAfrique={(geo?.horsAfriquePayes || 0) + (geo?.horsAfriqueNonPayes || 0)} colors={PIE_COLORS} />
      </div>

      {/* 3 Bar charts — Régions africaines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-[11px] font-semibold text-center text-muted-foreground">Membres par région — Payés</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={regionPayesOnly} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="region" tick={{ fontSize: 9 }} width={110} /><Tooltip formatter={(v: number) => formatNumber(v)} /><Bar dataKey="Membres" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-[11px] font-semibold text-center text-muted-foreground">Membres par région — Non payés</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={regionNonPayesOnly} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="region" tick={{ fontSize: 9 }} width={110} /><Tooltip formatter={(v: number) => formatNumber(v)} /><Bar dataKey="Membres" fill={CHART_COLORS.orange} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-[11px] font-semibold text-center text-muted-foreground">Membres par région — Tous</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={regionTous} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="region" tick={{ fontSize: 9 }} width={110} /><Tooltip formatter={(v: number) => formatNumber(v)} /><Bar dataKey="Membres" fill={CHART_COLORS.violet} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent>
        </Card>
      </div>

      {/* Top 10 pays */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top 10 pays</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] h-8 w-10">#</TableHead>
                  <TableHead className="text-[11px] h-8">Pays</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Inscrits payés</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Inscrits non payés</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Total inscrits</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">% du total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.pays || []).slice(0, 10).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs py-2 text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-xs py-2 font-medium">{row.pays}</TableCell>
                    <TableCell className="text-xs py-2 text-right text-[#009446]">{row.inscritsPayes}</TableCell>
                    <TableCell className="text-xs py-2 text-right text-red-500">{row.inscritsNonPayes}</TableCell>
                    <TableCell className="text-xs py-2 text-right font-medium">{row.total}</TableCell>
                    <TableCell className="text-xs py-2 text-right">{formatPercent(row.pctTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}