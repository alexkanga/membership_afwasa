'use client';

import React from 'react';
import { useDashboardStore } from '@/stores/auth-store';
import { DASHBOARD_PAGES } from '@/lib/constants';
import { MobileSidebar } from './mobile-sidebar';
import { Separator } from '@/components/ui/separator';

export function AppHeader() {
  const { currentPage } = useDashboardStore();

  const currentPageLabel = DASHBOARD_PAGES.find((p) => p.id === currentPage)?.label || 'Tableau de bord';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-border">
      <div className="flex items-center h-14 px-4 lg:px-6 gap-4">
        {/* Mobile menu button */}
        <MobileSidebar />

        {/* Page title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[#362981] truncate">
            {currentPageLabel}
          </h1>
        </div>

        {/* App name (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <Separator orientation="vertical" className="h-5" />
          <span className="text-xs text-muted-foreground font-medium">AAEA Membership Dashboard</span>
        </div>
      </div>
    </header>
  );
}
