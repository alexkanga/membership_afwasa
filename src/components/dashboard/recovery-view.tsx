'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { useDashboardStore } from '@/stores/auth-store';
import { toFcfa, formatFcfa, formatNumber, formatPercent } from '@/lib/format';
import { CHART_COLORS } from '@/lib/constants';
import { Wallet, ShieldCheck, AlertTriangle, Mail, Globe, BadgeCheck, Clock, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface QualiteItem { label: string; value: number; color: string }

function RecoveryKpi({ label, value, icon: Icon, color, isPercent }: {
  label: string; value: string | number; icon: React.ElementType; color: string; isPercent?: boolean;
}) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-[11px] text-muted-foreground font-medium truncate leading-tight">{label}</span>
            <span className="text-lg font-bold leading-tight">{isPercent ? formatPercent(typeof value === 'number' ? value : 0) : value}</span>
          </div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getQualityColor(v: number): string {
  if (v >= 80) return CHART_COLORS.green;
  if (v >= 50) return CHART_COLORS.orange;
  return CHART_COLORS.red;
}

export function RecoveryView() {
  const filters = useDashboardStore((s) => s.filters);
  const setFilter = useDashboardStore((s) => s.setFilter);
  const [data, setData] = useState<{
    recouvrement: { montantTotalAPayer: number; montantPaye: number; montantARecouvrer: number; tauxRecouvrement: number };
    creancesParTranche: { tranche: string; montant: number }[];
    qualite: { completudeEmail: number; completudePays: number; completudeCodeMembre: number; completudeDates: number };
    anomalies: { anomalie: string; description: string; nombre: number; impact: string; severite: string }[];
    qualityAlerts: { payesSansDateCompta: number; payesSansCodeMembre: number; creancesPlus90j: number; doublesEmails: number };
    plansList: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const rec = data?.recouvrement;

  const recouvrementBarData = useMemo(() => [{
    name: 'Montant',
    'Attendu': toFcfa(rec?.montantTotalAPayer || 0),
    'Payé': toFcfa(rec?.montantPaye || 0),
    'À recouvrer': toFcfa(rec?.montantARecouvrer || 0),
  }], [rec]);

  const creanceBarData = useMemo(() => (data?.creancesParTranche || []).map(c => ({
    tranche: c.tranche,
    montant: toFcfa(c.montant),
  })), [data]);

  const qualiteData: QualiteItem[] = useMemo(() => {
    if (!data?.qualite) return [];
    const q = data.qualite;
    return [
      { label: 'Email', value: q.completudeEmail, color: getQualityColor(q.completudeEmail) },
      { label: 'Pays', value: q.completudePays, color: getQualityColor(q.completudePays) },
      { label: 'Code membre', value: q.completudeCodeMembre, color: getQualityColor(q.completudeCodeMembre) },
      { label: 'Dates', value: q.completudeDates, color: getQualityColor(q.completudeDates) },
    ];
  }, [data]);

  const actions = [
    { action: 'Relancer les créances > 90 jours', description: 'Contacter les membres avec impayés de plus de 90 jours pour accélérer le recouvrement' },
    { action: 'Compléter les dates comptables', description: 'Rapprocher les paiements avec la comptabilité pour mettre à jour les dates manquantes' },
    { action: 'Attribuer les codes membres', description: 'Générer et attribuer les codes membres manquants pour les membres payés' },
    { action: 'Résoudre les doublons email', description: 'Identifier et fusionner les enregistrements avec adresses email identiques' },
    { action: 'Activer les membres payés', description: 'Mettre à jour le statut d\'activation des membres ayant réglé leur cotisation' },
  ];

  if (loading) {
    return <div className="space-y-6"><div className="h-10 animate-pulse bg-muted rounded" /><div className="grid grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted rounded" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <FilterBar filters={filters} onFilterChange={(k, v) => setFilter(k, v as never)} plans={data?.plansList || []} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RecoveryKpi label="Montant total à payer" value={formatFcfa(toFcfa(rec?.montantTotalAPayer || 0))} icon={Wallet} color="bg-[#009446]" />
        <RecoveryKpi label="Montant payé" value={formatFcfa(toFcfa(rec?.montantPaye || 0))} icon={Wallet} color="bg-[#009446]" />
        <RecoveryKpi label="Montant à recouvrer" value={formatFcfa(toFcfa(rec?.montantARecouvrer || 0))} icon={AlertTriangle} color="bg-red-500" />
        <RecoveryKpi label="Taux de recouvrement" value={rec?.tauxRecouvrement || 0} icon={ShieldCheck} color="bg-[#029CB1]" isPercent />
        <RecoveryKpi label="Payés sans date comptable" value={data?.qualityAlerts?.payesSansDateCompta || 0} icon={Clock} color="bg-amber-500" />
        <RecoveryKpi label="Payés sans code membre" value={data?.qualityAlerts?.payesSansCodeMembre || 0} icon={BadgeCheck} color="bg-[#8B5CF6]" />
        <RecoveryKpi label="Créances > 90 jours" value={data?.qualityAlerts?.creancesPlus90j || 0} icon={AlertTriangle} color="bg-red-500" />
        <RecoveryKpi label="Doublons emails" value={data?.qualityAlerts?.doublesEmails || 0} icon={Copy} color="bg-red-500" />
      </div>

      {/* Bar chart — Recouvrement attendu vs payé vs à recouvrer */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Recouvrement attendu vs payé vs à recouvrer (FCFA)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={recouvrementBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => formatFcfa(v)} />
              <Bar dataKey="Attendu" fill={CHART_COLORS.violet} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Payé" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="À recouvrer" fill={CHART_COLORS.red} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar chart — Créances par tranches */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Créances par tranches d'âge (FCFA)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={creanceBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="tranche" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: number) => formatFcfa(v)} />
              <Bar dataKey="montant" name="Montant" radius={[4, 4, 0, 0]}>
                {creanceBarData.map((entry, i) => (
                  <Cell key={i} fill={i === 3 ? CHART_COLORS.red : i === 2 ? CHART_COLORS.orange : CHART_COLORS.green} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Horizontal bar — Qualité des données */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Qualité des données — Complétude</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={qualiteData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="value" name="Complétude" radius={[0, 4, 4, 0]} barSize={24}>
                {qualiteData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table — Anomalies critiques */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Anomalies critiques</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] h-8">Anomalie</TableHead>
                <TableHead className="text-[11px] h-8">Description</TableHead>
                <TableHead className="text-[11px] h-8 text-right">Nombre</TableHead>
                <TableHead className="text-[11px] h-8">Impact</TableHead>
                <TableHead className="text-[11px] h-8">Sévérité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.anomalies || []).map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs py-2 font-medium">{a.anomalie}</TableCell>
                  <TableCell className="text-xs py-2 text-muted-foreground max-w-xs">{a.description}</TableCell>
                  <TableCell className="text-xs py-2 text-right font-medium">{a.nombre}</TableCell>
                  <TableCell className="text-xs py-2"><Badge variant="outline" className="text-[10px]">{a.impact}</Badge></TableCell>
                  <TableCell className="text-xs py-2">
                    <Badge variant="outline" className={`text-[10px] ${a.severite === 'critique' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      {a.severite === 'critique' ? 'Critique' : 'Avertissement'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Actions prioritaires */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Actions prioritaires</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] h-8 w-12">#</TableHead>
                <TableHead className="text-[11px] h-8">Action</TableHead>
                <TableHead className="text-[11px] h-8">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs py-2 text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="text-xs py-2 font-medium">{a.action}</TableCell>
                  <TableCell className="text-xs py-2 text-muted-foreground max-w-md">{a.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}