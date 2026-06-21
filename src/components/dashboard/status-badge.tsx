'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
}

const VARIANT_STYLES: Record<StatusVariant, string> = {
  success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-[#EBF8F9] text-[#029CB1] border-[#9AD2E2]',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
};

function inferVariant(status: string): StatusVariant {
  const s = status.toLowerCase();
  if (['payé', 'paid', 'actif', 'active', 'validé', 'valid', 'bon', 'success', 'terminé', 'completed', 'faible', 'low'].includes(s)) return 'success';
  if (['partiel', 'partial', 'en cours', 'pending', 'in progress', 'moyen', 'medium', 'avertissement', 'warning', 'à vérifier'].includes(s)) return 'warning';
  if (['non payé', 'unpaid', 'inactif', 'inactive', 'échoué', 'failed', 'critique', 'critical', 'élevé', 'high', 'danger', 'error', 'erreur'].includes(s)) return 'danger';
  if (['info', 'information', 'stable'].includes(s)) return 'info';
  return 'neutral';
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || inferVariant(status);

  return (
    <Badge
      variant="outline"
      className={cn('font-medium text-[11px] px-2 py-0.5', VARIANT_STYLES[resolvedVariant])}
    >
      {status}
    </Badge>
  );
}
