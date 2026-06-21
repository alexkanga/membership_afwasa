// Formatting utilities for AAEA Dashboard

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return '—';
  return `${value.toFixed(1)} %`;
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateShort(date: string | Date | undefined | null): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    year: '2-digit',
  }).format(d);
}

export function getTrendColor(trend: number | undefined | null): string {
  if (trend === undefined || trend === null || trend === 0) return 'text-muted-foreground';
  return trend > 0 ? 'text-[#009446]' : 'text-red-500';
}

export function getTrendIcon(trend: number | undefined | null): 'up' | 'down' | 'neutral' {
  if (trend === undefined || trend === null || trend === 0) return 'neutral';
  return trend > 0 ? 'up' : 'down';
}
