'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { useDashboardStore } from '@/stores/auth-store';
import { toFcfa, formatFcfa, formatNumber, formatPercent } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';
import { Users, Wallet } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';

interface PlanRow { plan: string; groupe: string; total: number; payes: number; nonPayes: number; montantPaye: number }

function PlanKpi({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
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

const GROUP_COLORS: Record<string, string> = {
  ACTIF: CHART_COLORS.blue,
  AFFILIE: CHART_COLORS.green,
  INDIVIDUEL: CHART_COLORS.purple,
};

export function PlansView() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const [data, setData] = useState<{
    groupes: { actifsPayes: number; actifsNonPayes: number; affiliesPayes: number; affiliesNonPayes: number; individuelsPayes: number; individuelsNonPayes: number; montantActifsPayes: number; montantAffiliesPayes: number; montantIndividuelsPayes: number; actifs: { sousCategorie: string; total: number; payes: number; nonPayes: number }[]; affilies: { sousCategorie: string; total: number; payes: number; nonPayes: number }[]; individuels: { sousCategorie: string; total: number; payes: number; nonPayes: number }[] };
    plans: PlanRow[];
    plansList: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const g = data?.groupes;
  const totalPaye = (g?.montantActifsPayes || 0) + (g?.montantAffiliesPayes || 0) + (g?.montantIndividuelsPayes || 0);

  const actifsData = useMemo(() => (g?.actifs || []).map(s => ({ name: s.sousCategorie, payes: s.payes, nonPayes: s.nonPayes })), [g]);
  const affiliesData = useMemo(() => (g?.affilies || []).map(s => ({ name: s.sousCategorie, payes: s.payes, nonPayes: s.nonPayes })), [g]);
  const individuelsData = useMemo(() => (g?.individuels || []).map(s => ({ name: s.sousCategorie, payes: s.payes, nonPayes: s.nonPayes })), [g]);

  const stackedData = useMemo(() => (data?.plans || []).map(p => ({
    plan: p.plan,
    payes: p.payes,
    nonPayes: p.nonPayes,
    total: p.total,
  })), [data]);

  if (loading) {
    return <div className="space-y-6"><div className="h-10 animate-pulse bg-muted rounded" /><div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted rounded" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilter(k, v as never)} plans={data?.plansList || []} />

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <PlanKpi label="Membres actifs payés" value={formatNumber(g?.actifsPayes)} icon={Users} color="bg-[#029CB1]" />
        <PlanKpi label="Membres actifs non payés" value={formatNumber(g?.actifsNonPayes)} icon={Users} color="bg-amber-500" />
        <PlanKpi label="Membres affiliés payés" value={formatNumber(g?.affiliesPayes)} icon={Users} color="bg-[#009446]" />
        <PlanKpi label="Membres affiliés non payés" value={formatNumber(g?.affiliesNonPayes)} icon={Users} color="bg-amber-500" />
        <PlanKpi label="Membres individuels payés" value={formatNumber(g?.individuelsPayes)} icon={Users} color="bg-[#8B5CF6]" />
        <PlanKpi label="Membres individuels non payés" value={formatNumber(g?.individuelsNonPayes)} icon={Users} color="bg-amber-500" />
      </div>

      {/* KPI Row 2 — Montants */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PlanKpi label="Montant payé total" value={formatFcfa(toFcfa(totalPaye))} icon={Wallet} color="bg-[#009446]" />
        <PlanKpi label="Montant payé actifs" value={formatFcfa(toFcfa(g?.montantActifsPayes || 0))} icon={Wallet} color="bg-[#009446]" />
        <PlanKpi label="Montant payé affiliés" value={formatFcfa(toFcfa(g?.montantAffiliesPayes || 0))} icon={Wallet} color="bg-[#029CB1]" />
        <PlanKpi label="Montant payé individuels" value={formatFcfa(toFcfa(g?.montantIndividuelsPayes || 0))} icon={Wallet} color="bg-[#8B5CF6]" />
      </div>

      {/* 3 Horizontal bar charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-[11px] font-semibold text-center text-muted-foreground">Répartition — Membres actifs</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={Math.max(150, actifsData.length * 40)}><BarChart data={actifsData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} /><Tooltip /><Legend /><Bar dataKey="payes" name="Payés" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} /><Bar dataKey="nonPayes" name="Non payés" fill={CHART_COLORS.orange} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-[11px] font-semibold text-center text-muted-foreground">Répartition — Membres affiliés</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={Math.max(150, affiliesData.length * 40)}><BarChart data={affiliesData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} /><Tooltip /><Legend /><Bar dataKey="payes" name="Payés" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} /><Bar dataKey="nonPayes" name="Non payés" fill={CHART_COLORS.orange} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-[11px] font-semibold text-center text-muted-foreground">Répartition — Membres individuels</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={Math.max(150, individuelsData.length * 40)}><BarChart data={individuelsData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" tick={{ fontSize: 10 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={100} /><Tooltip /><Legend /><Bar dataKey="payes" name="Payés" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} /><Bar dataKey="nonPayes" name="Non payés" fill={CHART_COLORS.orange} radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent>
        </Card>
      </div>

      {/* Stacked bar — Payés / non payés par plan */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Payés / Non payés par plan d'adhésion</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(200, stackedData.length * 35)}>
            <BarChart data={stackedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="plan" tick={{ fontSize: 9 }} width={140} />
              <Tooltip />
              <Legend />
              <Bar dataKey="payes" name="Payés" stackId="a" fill={CHART_COLORS.green} />
              <Bar dataKey="nonPayes" name="Non payés" stackId="a" fill={CHART_COLORS.orange} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table: Détail des plans */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Détail des plans d'adhésion</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] h-8">Plan</TableHead>
                  <TableHead className="text-[11px] h-8">Groupe</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Payés</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Non payés</TableHead>
                  <TableHead className="text-[11px] h-8 text-right">Montant payé (FCFA)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.plans || []).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs py-2 font-medium">{row.plan}</TableCell>
                    <TableCell className="text-xs py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${row.groupe === 'ACTIF' ? 'bg-[#029CB1]/10 text-[#029CB1]' : row.groupe === 'AFFILIE' ? 'bg-[#009446]/10 text-[#009446]' : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'}`}>{row.groupe}</span></TableCell>
                    <TableCell className="text-xs py-2 text-right text-[#009446]">{row.payes}</TableCell>
                    <TableCell className="text-xs py-2 text-right text-red-500">{row.nonPayes}</TableCell>
                    <TableCell className="text-xs py-2 text-right font-medium">{formatFcfa(toFcfa(row.montantPaye))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Sous-catégories dominantes */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Sous-catégories dominantes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Membres actifs', data: g?.actifs || [], color: CHART_COLORS.blue },
            { label: 'Membres affiliés', data: g?.affilies || [], color: CHART_COLORS.green },
            { label: 'Membres individuels', data: g?.individuels || [], color: CHART_COLORS.purple },
          ].map(group => {
            const top = [...group.data].sort((a, b) => b.total - a.total)[0];
            if (!top) return null;
            return (
              <div key={group.label} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: group.color }} />
                <span className="text-xs text-muted-foreground w-36">{group.label}</span>
                <span className="text-xs font-semibold">{top.sousCategorie}</span>
                <span className="text-xs text-muted-foreground">({top.total} membres)</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}