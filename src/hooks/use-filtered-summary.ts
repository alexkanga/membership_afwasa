'use client';

import { useEffect, useState } from 'react';
import { useDashboardStore, type DashboardFilters } from '@/stores/auth-store';

export function buildFilterQuery(filters: DashboardFilters): string {
  const params = new URLSearchParams();
  if (filters.dateDebut) params.set('dateDebut', filters.dateDebut);
  if (filters.dateFin) params.set('dateFin', filters.dateFin);
  if (filters.typeDate) params.set('typeDate', filters.typeDate);
  if (filters.continent) params.set('continent', filters.continent);
  if (filters.regionAfrique) params.set('regionAfrique', filters.regionAfrique);
  if (filters.planAdhesion) params.set('planAdhesion', filters.planAdhesion);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useFilteredSummary<T>(): { data: T | null; loading: boolean } {
  const appliedFilters = useDashboardStore((s) => s.appliedFilters);
  const [data, setData] = useState<T | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const qs = buildFilterQuery(appliedFilters);
    fetch(`/api/dashboard/summary${qs}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { if (d.error) throw new Error(d.error); if (!cancelled) { setData(d as T); setErrored(false); } })
      .catch(() => { if (!cancelled) setErrored(true); });
    return () => { cancelled = true; };
  }, [
    appliedFilters.dateDebut, appliedFilters.dateFin, appliedFilters.typeDate,
    appliedFilters.continent, appliedFilters.regionAfrique, appliedFilters.planAdhesion,
  ]);

  return { data, loading: data === null && !errored };
}