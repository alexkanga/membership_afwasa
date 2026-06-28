'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { useDashboardStore } from '@/stores/auth-store';
import { useFilteredSummary } from '@/hooks/use-filtered-summary';
import { toFcfa, formatFcfa, formatNumber } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import {
  Users, UserCheck, UserX, Wallet,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface SummaryData {
  effectifs: {
    inscritsPayes: number; inscritsNonPayes: number;
    actifsPayes: number; actifsNonPayes: number;
    affiliesPayes: number; affiliesNonPayes: number;
    individuelsPayes: number; individuelsNonPayes: number;
  };
  montants: {
    inscritsPayes: number; inscritsNonPayes: number;
    actifsPayes: number; actifsNonPayes: number;
    affiliesPayes: number; affiliesNonPayes: number;
    individuelsPayes: number; individuelsNonPayes: number;
  };
  geographie: {
    afriquePayes: number; afriqueNonPayes: number;
    horsAfriquePayes: number; horsAfriqueNonPayes: number;
  };
  evolutionMensuelle: { mois: string; montantPaye: number; montantNonPaye: number }[];
  anomalies: { anomalie: string; description: string; nombre: number; impact: string; severite: string }[];
  qualityAlerts: { payesSansDateCompta: number; payesSansCodeMembre: number; creancesPlus90j: number; doublesEmails: number };
  plansList: string[];
}

const PIE_COLORS = [CHART_COLORS.green, CHART_COLORS.blue];

function MiniKpiCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground font-medium truncate leading-tight">{label}</span>
            <span className="text-lg font-bold text-foreground leading-tight">{value}</span>
          </div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonutChart({ title, data, dataKey, nameKey, colors }: {
  title: string;
  data: { name: string; value: number }[];
  dataKey: string;
  nameKey: string;
  colors: string[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-semibold text-center text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey={dataKey} nameKey={nameKey} stroke="none" paddingAngle={2}>
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatNumber(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-8px' }}>
            <div className="text-center">
              <div className="text-lg font-bold">{formatNumber(total)}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              <span className="text-[11px] text-muted-foreground">{d.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ExecutiveView() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const resetFilters = useDashboardStore((s) => s.resetFilters);
  const applyFilters = useDashboardStore((s) => s.applyFilters);
  const { data, loading } = useFilteredSummary<SummaryData>();

  const eff = data?.effectifs;
  const mon = data?.montants;
  const geo = data?.geographie;

  const piePayes = useMemo(() => geo ? [
    { name: 'Afrique', value: geo.afriquePayes },
    { name: 'Hors Afrique', value: geo.horsAfriquePayes },
  ] : [], [geo]);

  const pieNonPayes = useMemo(() => geo ? [
    { name: 'Afrique', value: geo.afriqueNonPayes },
    { name: 'Hors Afrique', value: geo.horsAfriqueNonPayes },
  ] : [], [geo]);

  const pieTous = useMemo(() => geo ? [
    { name: 'Afrique', value: geo.afriquePayes + geo.afriqueNonPayes },
    { name: 'Hors Afrique', value: geo.horsAfriquePayes + geo.horsAfriqueNonPayes },
  ] : [], [geo]);

  const evolutionData = useMemo(() =>
    (data?.evolutionMensuelle || []).map((e) => ({
      mois: e.mois,
      'Payés': toFcfa(e.montantPaye),
      'Non payés': toFcfa(e.montantNonPaye),
    })), [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 animate-pulse bg-muted rounded" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted rounded" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilter(k, v as never)} onApply={applyFilters} onReset={resetFilters} plans={data?.plansList || []} />

      {/* Groupe CARD 1 — Effectifs */}
      <div>
        <h2 className="text-sm font-semibold text-[#362981] mb-3">Effectifs</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniKpiCard label="Total inscrits payés" value={formatNumber(eff?.inscritsPayes)} icon={Users} color="bg-[#009446]" />
          <MiniKpiCard label="Total inscrits non payés" value={formatNumber(eff?.inscritsNonPayes)} icon={Users} color="bg-amber-500" />
          <MiniKpiCard label="Membres actifs payés" value={formatNumber(eff?.actifsPayes)} icon={UserCheck} color="bg-[#009446]" />
          <MiniKpiCard label="Membres actifs non payés" value={formatNumber(eff?.actifsNonPayes)} icon={UserX} color="bg-red-500" />
          <MiniKpiCard label="Membres affiliés payés" value={formatNumber(eff?.affiliesPayes)} icon={Users} color="bg-[#029CB1]" />
          <MiniKpiCard label="Membres affiliés non payés" value={formatNumber(eff?.affiliesNonPayes)} icon={Users} color="bg-[#8B5CF6]" />
          <MiniKpiCard label="Membres individuels payés" value={formatNumber(eff?.individuelsPayes)} icon={UserCheck} color="bg-teal-500" />
          <MiniKpiCard label="Membres individuels non payés" value={formatNumber(eff?.individuelsNonPayes)} icon={UserX} color="bg-red-500" />
        </div>
      </div>

      {/* Groupe CARD 2 — Montants FCFA */}
      <div>
        <h2 className="text-sm font-semibold text-[#362981] mb-3">Montants (FCFA)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniKpiCard label="MT inscrits payés" value={formatFcfa(toFcfa(mon?.inscritsPayes || 0))} icon={Wallet} color="bg-[#009446]" />
          <MiniKpiCard label="MT inscrits non payés" value={formatFcfa(toFcfa(mon?.inscritsNonPayes || 0))} icon={Wallet} color="bg-amber-500" />
          <MiniKpiCard label="MT actifs payés" value={formatFcfa(toFcfa(mon?.actifsPayes || 0))} icon={Wallet} color="bg-[#009446]" />
          <MiniKpiCard label="MT actifs non payés" value={formatFcfa(toFcfa(mon?.actifsNonPayes || 0))} icon={Wallet} color="bg-red-500" />
          <MiniKpiCard label="MT affiliés payés" value={formatFcfa(toFcfa(mon?.affiliesPayes || 0))} icon={Wallet} color="bg-[#029CB1]" />
          <MiniKpiCard label="MT affiliés non payés" value={formatFcfa(toFcfa(mon?.affiliesNonPayes || 0))} icon={Wallet} color="bg-[#8B5CF6]" />
          <MiniKpiCard label="MT individuels payés" value={formatFcfa(toFcfa(mon?.individuelsPayes || 0))} icon={Wallet} color="bg-teal-500" />
          <MiniKpiCard label="MT individuels non payés" value={formatFcfa(toFcfa(mon?.individuelsNonPayes || 0))} icon={Wallet} color="bg-red-500" />
        </div>
      </div>

      {/* 3 Donut charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutChart title="Afrique vs Hors Afrique — Inscrits payés" data={piePayes} dataKey="value" nameKey="name" colors={PIE_COLORS} />
        <DonutChart title="Afrique vs Hors Afrique — Inscrits non payés" data={pieNonPayes} dataKey="value" nameKey="name" colors={[CHART_COLORS.orange, CHART_COLORS.violet]} />
        <DonutChart title="Afrique vs Hors Afrique — Tous les inscrits" data={pieTous} dataKey="value" nameKey="name" colors={PIE_COLORS} />
      </div>

      {/* Line Chart — Évolution mensuelle */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Évolution mensuelle des montants (FCFA)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => formatFcfa(v)} />
              <Legend />
              <Line type="monotone" dataKey="Payés" stroke={CHART_COLORS.green} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Non payés" stroke={CHART_COLORS.red} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alertes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-600">Alertes clés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.qualityAlerts && (
              <>
                <AlertItem label="Payés sans date comptable" count={data.qualityAlerts.payesSansDateCompta} severity="critique" />
                <AlertItem label="Payés sans code membre" count={data.qualityAlerts.payesSansCodeMembre} severity="eleve" />
                <AlertItem label="Créances > 90 jours" count={data.qualityAlerts.creancesPlus90j} severity="critique" />
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-amber-600">Autres alertes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.anomalies.filter(a => a.severite === 'avertissement').map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] shrink-0 mt-0.5">
                  {a.impact}
                </Badge>
                <div>
                  <p className="text-xs font-medium">{a.anomalie} ({a.nombre})</p>
                  <p className="text-[11px] text-muted-foreground">{a.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AlertItem({ label, count, severity }: { label: string; count: number; severity: string }) {
  const color = severity === 'critique' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200';
  const severityLabel = severity === 'critique' ? 'Critique' : 'Élevé';
  return (
    <div className="flex items-start gap-3">
      <Badge variant="outline" className={`${color} text-[10px] shrink-0 mt-0.5`}>{severityLabel}</Badge>
      <div>
        <p className="text-xs font-medium">{label} ({count})</p>
        <p className="text-[11px] text-muted-foreground">
          {label === 'Payés sans date comptable' && 'Membres payés sans date de paiement en comptabilité'}
          {label === 'Payés sans code membre' && 'Membres payés sans code membre attribué'}
          {label === 'Créances > 90 jours' && 'Impayés avec un délai supérieur à 90 jours'}
        </p>
      </div>
    </div>
  );
}