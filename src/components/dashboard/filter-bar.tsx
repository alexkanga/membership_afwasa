'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AFRICAN_REGIONS } from '@/lib/constants';

interface FilterBarProps {
  filters: {
    periode: string;
    typeDate: string;
    continent: string;
    regionAfrique: string;
    planAdhesion: string;
  };
  onFilterChange: (key: string, value: string) => void;
  plans: string[];
}

export function FilterBar({ filters, onFilterChange, plans }: FilterBarProps) {
  const regionKeys = Object.keys(AFRICAN_REGIONS);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <Select value={filters.periode} onValueChange={(v) => onFilterChange('periode', v)}>
        <SelectTrigger className="w-[180px] h-9 text-xs">
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les périodes</SelectItem>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2025">2025</SelectItem>
          <SelectItem value="2026">2026</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.typeDate} onValueChange={(v) => onFilterChange('typeDate', v)}>
        <SelectTrigger className="w-[180px] h-9 text-xs">
          <SelectValue placeholder="Type de date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inscription">Date inscription</SelectItem>
          <SelectItem value="paiement">Date paiement</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.continent} onValueChange={(v) => onFilterChange('continent', v)}>
        <SelectTrigger className="w-[180px] h-9 text-xs">
          <SelectValue placeholder="Continent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="afrique">Afrique</SelectItem>
          <SelectItem value="hors-afrique">Hors Afrique</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.regionAfrique} onValueChange={(v) => onFilterChange('regionAfrique', v)}>
        <SelectTrigger className="w-[200px] h-9 text-xs">
          <SelectValue placeholder="Région Afrique" />
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

      <Select value={filters.planAdhesion} onValueChange={(v) => onFilterChange('planAdhesion', v)}>
        <SelectTrigger className="w-[200px] h-9 text-xs">
          <SelectValue placeholder="Plan d'adhésion" />
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
  );
}