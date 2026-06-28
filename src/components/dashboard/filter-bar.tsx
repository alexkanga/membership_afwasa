'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AFRICAN_REGIONS } from '@/lib/constants';
import { RotateCcw, Search, Filter, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

interface DateBounds {
  inscription: { min: string | null; max: string | null };
  paiement: { min: string | null; max: string | null };
}

interface FilterBarProps {
  filters: {
    dateDebut: string;
    dateFin: string;
    typeDate: string;
    continent: string;
    regionAfrique: string;
    planAdhesion: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  plans: string[];
}

export function FilterBar({ filters, onFilterChange, onApply, onReset, plans }: FilterBarProps) {
  const regionKeys = Object.keys(AFRICAN_REGIONS);
  const [dateBounds, setDateBounds] = useState<DateBounds | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Fetch date bounds from the active dataset once on mount
  useEffect(() => {
    fetch('/api/dashboard/date-range')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setDateBounds(d))
      .catch(() => {});
  }, []);

  // Get current min/max based on typeDate selection
  const currentBounds = dateBounds
    ? dateBounds[filters.typeDate as keyof DateBounds]
    : null;

  // When typeDate changes, clear date fields if they're out of the new range
  const handleTypeDateChange = useCallback((value: string) => {
    onFilterChange('typeDate', value);
    const newBounds = dateBounds?.[value as keyof DateBounds];
    if (newBounds) {
      if (filters.dateDebut && newBounds.max && filters.dateDebut > newBounds.max) {
        onFilterChange('dateDebut', '');
      }
      if (filters.dateFin && newBounds.min && filters.dateFin < newBounds.min) {
        onFilterChange('dateFin', '');
      }
    }
  }, [dateBounds, filters.dateDebut, filters.dateFin, onFilterChange]);

  const minDate = currentBounds?.min || undefined;
  const maxDate = currentBounds?.max || undefined;

  // Count active filters (non-default values)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateDebut) count++;
    if (filters.dateFin) count++;
    if (filters.continent) count++;
    if (filters.regionAfrique) count++;
    if (filters.planAdhesion) count++;
    return count;
  }, [filters]);

  const hasDateRange = filters.dateDebut || filters.dateFin;

  // Type date label for display
  const typeDateLabel = filters.typeDate === 'inscription' ? 'Inscription' : 'Paiement';

  return (
    <div className="bg-white border border-border/60 rounded-xl shadow-sm overflow-hidden">
      {/* ── Header row ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#362981]/[0.04] to-transparent">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#362981]/10">
            <Filter className="w-3.5 h-3.5 text-[#362981]" />
          </div>
          <span className="text-sm font-semibold text-foreground">Filtres</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-[#009446] text-white border-0 rounded-full"
            >
              {activeFilterCount}
            </Badge>
          )}
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onApply}
            className="h-8 px-4 text-xs font-semibold gap-1.5 bg-[#009446] hover:bg-[#007a39] active:bg-[#006b30] text-white rounded-lg transition-colors shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            OK
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* ── Filter body ── */}
      {!collapsed && (
        <div className="px-4 py-3.5 space-y-3">
          {/* ── Row 1: Date group ── */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#029CB1]" />
              <span className="text-[11px] font-semibold text-[#029CB1] uppercase tracking-wider">Période</span>
              {hasDateRange && (
                <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-medium text-[#029CB1] border-[#029CB1]/30 bg-[#029CB1]/5 rounded">
                  Active
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Type de date — FIRST */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">Type de date</Label>
                <Select value={filters.typeDate} onValueChange={handleTypeDateChange}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/50 focus:bg-background focus:border-[#362981]/40 transition-colors rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inscription">Date inscription</SelectItem>
                    <SelectItem value="paiement">Date paiement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Début */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">
                  Date début
                  {minDate && (
                    <span className="ml-1.5 text-[10px] text-[#029CB1]/70 font-normal">
                      min: {new Date(minDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={filters.dateDebut}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => onFilterChange('dateDebut', e.target.value)}
                  className="h-9 text-xs bg-muted/30 border-border/50 focus:bg-background focus:border-[#362981]/40 transition-colors rounded-lg"
                  placeholder=""
                />
              </div>

              {/* Date Fin */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">
                  Date fin
                  {maxDate && (
                    <span className="ml-1.5 text-[10px] text-[#029CB1]/70 font-normal">
                      max: {new Date(maxDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={filters.dateFin}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => onFilterChange('dateFin', e.target.value)}
                  className="h-9 text-xs bg-muted/30 border-border/50 focus:bg-background focus:border-[#362981]/40 transition-colors rounded-lg"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          {/* ── Row 2: Dimension filters ── */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Filter className="w-3.5 h-3.5 text-[#362981]" />
              <span className="text-[11px] font-semibold text-[#362981] uppercase tracking-wider">Dimensions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Continent */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">Continent</Label>
                <Select value={filters.continent} onValueChange={(v) => onFilterChange('continent', v)}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/50 focus:bg-background focus:border-[#362981]/40 transition-colors rounded-lg">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="afrique">Afrique</SelectItem>
                    <SelectItem value="hors-afrique">Hors Afrique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Région Afrique */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">Région Afrique</Label>
                <Select value={filters.regionAfrique} onValueChange={(v) => onFilterChange('regionAfrique', v)}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/50 focus:bg-background focus:border-[#362981]/40 transition-colors rounded-lg">
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {regionKeys.map((key) => (
                      <SelectItem key={key} value={key}>
                        {AFRICAN_REGIONS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plan d'adhésion */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground font-medium">Plan d&apos;adhésion</Label>
                <Select value={filters.planAdhesion} onValueChange={(v) => onFilterChange('planAdhesion', v)}>
                  <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/50 focus:bg-background focus:border-[#362981]/40 transition-colors rounded-lg">
                    <SelectValue placeholder="Tous les plans" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Tous les plans</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan} value={plan}>
                        {plan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Footer hint ── */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-muted-foreground/70">
              Date de référence : <span className="font-medium text-muted-foreground">{typeDateLabel}</span>
              {minDate && maxDate && (
                <span className="ml-1">
                  — Du {new Date(minDate).toLocaleDateString('fr-FR')} au {new Date(maxDate).toLocaleDateString('fr-FR')}
                </span>
              )}
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              Cliquez sur <span className="font-semibold text-[#009446]">OK</span> pour appliquer les filtres
            </p>
          </div>
        </div>
      )}
    </div>
  );
}