'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import { AFRICAN_REGIONS } from '@/lib/constants';
import { RotateCcw, Search } from 'lucide-react';

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

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-muted/40 rounded-lg border">
      {/* Date Début */}
      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground font-medium">
          Date début
          {minDate && (
            <span className="ml-1 text-[10px] text-muted-foreground/60">
              (min: {new Date(minDate).toLocaleDateString('fr-FR')})
            </span>
          )}
        </Label>
        <Input
          type="date"
          value={filters.dateDebut}
          min={minDate}
          max={maxDate}
          onChange={(e) => onFilterChange('dateDebut', e.target.value)}
          className="w-[175px] h-9 text-xs"
        />
      </div>

      {/* Date Fin */}
      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground font-medium">
          Date fin
          {maxDate && (
            <span className="ml-1 text-[10px] text-muted-foreground/60">
              (max: {new Date(maxDate).toLocaleDateString('fr-FR')})
            </span>
          )}
        </Label>
        <Input
          type="date"
          value={filters.dateFin}
          min={minDate}
          max={maxDate}
          onChange={(e) => onFilterChange('dateFin', e.target.value)}
          className="w-[175px] h-9 text-xs"
        />
      </div>

      {/* Type de date */}
      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground font-medium">Type de date</Label>
        <Select value={filters.typeDate} onValueChange={handleTypeDateChange}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inscription">Date inscription</SelectItem>
            <SelectItem value="paiement">Date paiement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Continent */}
      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground font-medium">Continent</Label>
        <Select value={filters.continent} onValueChange={(v) => onFilterChange('continent', v)}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="afrique">Afrique</SelectItem>
            <SelectItem value="hors-afrique">Hors Afrique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Région Afrique */}
      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground font-medium">Région Afrique</Label>
        <Select value={filters.regionAfrique} onValueChange={(v) => onFilterChange('regionAfrique', v)}>
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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
      <div className="flex flex-col gap-1">
        <Label className="text-[11px] text-muted-foreground font-medium">Plan d&apos;adhésion</Label>
        <Select value={filters.planAdhesion} onValueChange={(v) => onFilterChange('planAdhesion', v)}>
          <SelectTrigger className="w-[200px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les plans</SelectItem>
            {plans.map((plan) => (
              <SelectItem key={plan} value={plan}>
                {plan}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Boutons OK + Réinitialiser */}
      <div className="flex items-end gap-2 ml-auto">
        <Button
          size="sm"
          onClick={onApply}
          className="h-9 text-xs gap-1.5 bg-[#009446] hover:bg-[#009446]/90 text-white"
        >
          <Search className="w-3.5 h-3.5" />
          OK
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}