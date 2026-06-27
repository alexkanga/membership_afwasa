'use client';

import React from 'react';
import { useAuthStore, useDashboardStore } from '@/stores/auth-store';
import { DASHBOARD_PAGES } from '@/lib/constants';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  Globe,
  FileText,
  ShieldCheck,
  Upload,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Globe,
  FileText,
  ShieldCheck,
  Upload,
};

export function AppSidebar() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const currentPage = useDashboardStore((s) => s.currentPage);
  const setCurrentPage = useDashboardStore((s) => s.setCurrentPage);

  const visiblePages = DASHBOARD_PAGES.filter((page) => {
    if ('adminOnly' in page && page.adminOnly) {
      return isAdmin;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col bg-white border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <Image src="/logo.jpg" alt="AAEA" width={36} height={36} className="rounded object-contain" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#362981] leading-tight">AAEA</span>
          <span className="text-[10px] text-muted-foreground leading-tight">AfWASA Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {visiblePages.map((page) => {
            const IconComp = ICON_MAP[page.icon] || LayoutDashboard;
            const isActive = currentPage === page.id;

            return (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all w-full text-left',
                  isActive
                    ? 'bg-[#362981] text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-[#EBF8F9] hover:text-[#362981]'
                )}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span className="truncate">{page.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User info */}
      <Separator />
      <div className="px-4 py-3">
        {user && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#362981] text-white text-xs font-bold shrink-0">
                {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{user.name || user.email}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}