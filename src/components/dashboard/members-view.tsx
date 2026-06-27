'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { useDashboardStore } from '@/stores/auth-store';
import { toFcfa, formatFcfa, formatNumber, formatPercent } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

interface SousCat { sousCategorie: string; total: number; payes: number; nonPayes: number; groupe?: string }
interface SummaryData {
  groupes: {
    actifs: SousCat[]; affilies: SousCat[]; individuels: SousCat[];
    actifsPayes: number; actifsNonPayes: number;
    affiliesPayes: number; affiliesNonPayes: number;
    individuelsPayes: number; individuelsNonPayes: number;
    montantActifsPayes: number; montantAffiliesPayes: number; montantIndividuelsPayes: number;
  };
  geographie: { afriquePayes: number; afriqueNonPayes: number; horsAfriquePayes: number; horsAfriqueNonPayes: number };
  sousCategories: (SousCat & { groupe: string })[];
  plansList: string[];
}

const PIE_COLORS = [CHART_COLORS.green, CHART_COLORS.blue];

function GroupCard({ title, payes, nonPayes, montantPaye, color, colorBg }: {
  title: string; payes: number; nonPayes: number; montantPaye: number; color: string; colorBg: string;
}) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className={`text-sm font-semibold ${color}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Payés</span>
          <span className="font-semibold text-[#009446]">{formatNumber(payes)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Non payés</span>
          <span className="font-semibold text-red-500">{formatNumber(nonPayes)}</span>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Montant payé</span>
            <span className={`font-bold ${color}`}>{formatFcfa(toFcfa(montantPaye))}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SousCatTable({ title, data }: { title: string; data: SousCat[] }) {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-muted-foreground">Sous-catégories — {title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="max-h-64 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] h-8">Sous-catégorie</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Total</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Payés</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Non payés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs py-2 font-medium">{row.sousCategorie}</TableCell>
                  <TableCell className="text-xs py-2 text-right">{row.total}</TableCell>
                  <TableCell className="text-xs py-2 text-right text-[#009446]">{row.payes}</TableCell>
                  <TableCell className="text-xs py-2 text-right text-red-500">{row.nonPayes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function DonutSmall({ title, afrique, horsAfrique, colors }: {
  title: string; afrique: number; horsAfrique: number; colors: string[];
}) {
  const total = afrique + horsAfrique;
  const pieData = [
    { name: 'Afrique', value: afrique },
    { name: 'Hors Afrique', value: horsAfrique },
  ];
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-[11px] font-semibold text-center text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" nameKey="name" stroke="none" paddingAngle={2}>
              {pieData.map((_, i) => (<Cell key={i} fill={colors[i % colors.length]} />))}
            </Pie>
            <Tooltip formatter={(v: number) => formatNumber(v)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-3">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[0] }} /><span className="text-[10px] text-muted-foreground">Afrique</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[1] }} /><span className="text-[10px] text-muted-foreground">Hors Afrique</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MembersView() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-6"><div className="h-10 animate-pulse bg-muted rounded" /><div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse bg-muted rounded" />)}</div></div>;
  }

  const g = data?.groupes;
  const geo = data?.geographie;

  return (
    <div className="space-y-6">
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilter(k, v as never)} plans={data?.plansList || []} />

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GroupCard title="Membres actifs" payes={g?.actifsPayes || 0} nonPayes={g?.actifsNonPayes || 0} montantPaye={g?.montantActifsPayes || 0} color="text-[#029CB1]" colorBg="bg-[#029CB1]/10" />
        <GroupCard title="Membres affiliés" payes={g?.affiliesPayes || 0} nonPayes={g?.affiliesNonPayes || 0} montantPaye={g?.montantAffiliesPayes || 0} color="text-[#009446]" colorBg="bg-[#009446]/10" />
        <GroupCard title="Membres individuels" payes={g?.individuelsPayes || 0} nonPayes={g?.individuelsNonPayes || 0} montantPaye={g?.montantIndividuelsPayes || 0} color="text-[#8B5CF6]" colorBg="bg-[#8B5CF6]/10" />
      </div>

      {/* 3 Sous-cat tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SousCatTable title="Actifs" data={g?.actifs || []} />
        <SousCatTable title="Affiliés" data={g?.affilies || []} />
        <SousCatTable title="Individuels" data={g?.individuels || []} />
      </div>

      {/* 3 Donut charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutSmall title="Répartition — Inscrits payés" afrique={geo?.afriquePayes || 0} horsAfrique={geo?.horsAfriquePayes || 0} colors={PIE_COLORS} />
        <DonutSmall title="Répartition — Inscrits non payés" afrique={geo?.afriqueNonPayes || 0} horsAfrique={geo?.horsAfriqueNonPayes || 0} colors={[CHART_COLORS.orange, CHART_COLORS.violet]} />
        <DonutSmall title="Répartition — Tous les inscrits" afrique={(geo?.afriquePayes || 0) + (geo?.afriqueNonPayes || 0)} horsAfrique={(geo?.horsAfriquePayes || 0) + (geo?.horsAfriqueNonPayes || 0)} colors={PIE_COLORS} />
      </div>

      {/* Top 10 sous-catégories */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Top 10 sous-catégories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] h-8 w-12">Rang</TableHead>
                  <TableHead className="text-[11px] h-8">Sous-catégorie</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Total</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Payés</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Non payés</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">% payés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.sousCategories.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs py-2 text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="text-xs py-2 font-medium">{row.sousCategorie}</TableCell>
                    <TableCell className="text-xs py-2 text-right">{row.total}</TableCell>
                    <TableCell className="text-xs py-2 text-right text-[#009446]">{row.payes}</TableCell>
                    <TableCell className="text-xs py-2 text-right text-red-500">{row.nonPayes}</TableCell>
                    <TableCell className="text-xs py-2 text-right">{formatPercent(row.total > 0 ? (row.payes / row.total) * 100 : 0)}</TableCell>
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