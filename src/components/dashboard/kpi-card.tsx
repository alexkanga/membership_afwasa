'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumber, formatCurrency, formatPercent, getTrendColor, getTrendIcon } from '@/lib/format';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Globe,
  UserCheck,
  CreditCard,
  AlertTriangle,
  Activity,
} from 'lucide-react';

type KpiColor = 'green' | 'orange' | 'red' | 'violet' | 'teal';

interface KpiCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: number;
  color?: KpiColor;
  format?: 'number' | 'currency' | 'percent';
  icon?: React.ElementType;
  loading?: boolean;
}

const COLOR_MAP: Record<KpiColor, { bg: string; icon: string; border: string }> = {
  green: { bg: 'bg-emerald-50', icon: 'text-[#009446]', border: 'border-emerald-200' },
  orange: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-200' },
  violet: { bg: 'bg-[#EBF8F9]', icon: 'text-[#362981]', border: 'border-[#9AD2E2]' },
  teal: { bg: 'bg-[#EBF8F9]', icon: 'text-[#029CB1]', border: 'border-[#9AD2E2]' },
};

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  color = 'violet',
  format = 'number',
  icon: IconComp,
  loading = false,
}: KpiCardProps) {
  const colorScheme = COLOR_MAP[color];
  const trendDir = getTrendIcon(trend);
  const trendColor = getTrendColor(trend);

  const formattedValue = React.useMemo(() => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      default:
        return formatNumber(value);
    }
  }, [value, format]);

  if (loading) {
    return (
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border shadow-sm hover:shadow-md transition-shadow', colorScheme.border)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-xs text-muted-foreground font-medium truncate">{title}</span>
            <span className="text-xl font-bold text-foreground leading-tight">{formattedValue}</span>
            <div className="flex items-center gap-2">
              {subtitle && (
                <span className="text-[11px] text-muted-foreground truncate">{subtitle}</span>
              )}
              {trend !== undefined && trend !== null && (
                <span className={cn('flex items-center gap-0.5 text-[11px] font-medium', trendColor)}>
                  {trendDir === 'up' && <TrendingUp className="w-3 h-3" />}
                  {trendDir === 'down' && <TrendingDown className="w-3 h-3" />}
                  {trendDir === 'neutral' && <Minus className="w-3 h-3" />}
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          {IconComp && (
            <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg shrink-0', colorScheme.bg)}>
              <IconComp className={cn('w-4.5 h-4.5', colorScheme.icon)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Pre-configured KPI cards for common metrics
export function TotalInscriptionsKpi({ value, trend, loading }: { value: number; trend?: number; loading?: boolean }) {
  return <KpiCard title="Total Inscriptions" value={value} trend={trend} format="number" color="violet" icon={Users} loading={loading} />;
}

export function MembresUniquesKpi({ value, trend, loading }: { value: number; trend?: number; loading?: boolean }) {
  return <KpiCard title="Membres Uniques" value={value} trend={trend} format="number" color="teal" icon={Users} loading={loading} />;
}

export function MembresPayesKpi({ value, trend, loading }: { value: number; trend?: number; loading?: boolean }) {
  return <KpiCard title="Membres Payés" value={value} trend={trend} format="number" color="green" icon={UserCheck} loading={loading} />;
}

export function TauxPaiementKpi({ value, trend, loading }: { value: number; trend?: number; loading?: boolean }) {
  return <KpiCard title="Taux de Paiement" value={value} trend={trend} format="percent" color={value >= 80 ? 'green' : value >= 60 ? 'orange' : 'red'} icon={CreditCard} loading={loading} />;
}

export function MontantPayeKpi({ value, trend, loading }: { value: number; trend?: number; loading?: boolean }) {
  return <KpiCard title="Montant Payé" value={value} trend={trend} format="currency" color="green" icon={DollarSign} loading={loading} />;
}

export function MontantARecouvrerKpi({ value, trend, loading }: { value: number; trend?: number; loading?: boolean }) {
  return <KpiCard title="Montant à Recouvrer" value={value} trend={trend} format="currency" color="orange" icon={AlertTriangle} loading={loading} />;
}

export function TauxRecouvrementKpi({ value, trend, loading }: { value: number; trend?: number; loading?: boolean }) {
  return <KpiCard title="Taux de Recouvrement" value={value} trend={trend} format="percent" color={value >= 85 ? 'green' : value >= 65 ? 'orange' : 'red'} icon={Activity} loading={loading} />;
}

export function MembresActifsKpi({ value, trend, loading }: { value: number; trend?: number; loading?: boolean }) {
  return <KpiCard title="Membres Actifs" value={value} trend={trend} format="number" color="teal" icon={UserCheck} loading={loading} />;
}

export function PaysRepresentesKpi({ value, trend, loading }: { value: number; trend?: number; loading?: boolean }) {
  return <KpiCard title="Pays Représentés" value={value} trend={trend} format="number" color="violet" icon={Globe} loading={loading} />;
}
