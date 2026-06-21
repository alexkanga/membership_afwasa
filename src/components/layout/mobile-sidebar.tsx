'use client';

import React from 'react';
import { useAuthStore, useDashboardStore } from '@/stores/auth-store';
import { DASHBOARD_PAGES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Menu,
  LayoutDashboard,
  Users,
  Globe,
  DollarSign,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Settings,
  LogOut,
  Droplets,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Globe,
  DollarSign,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Settings,
};

export function MobileSidebar() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const currentPage = useDashboardStore((s) => s.currentPage);
  const setCurrentPage = useDashboardStore((s) => s.setCurrentPage);
  const [open, setOpen] = React.useState(false);

  const visiblePages = DASHBOARD_PAGES.filter((page) => {
    if (page.id === 'uploads' || page.id === 'admin') {
      return isAdmin;
    }
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        {/* Logo */}
        <SheetHeader className="px-4 pt-5 pb-3">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#362981]">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-bold text-[#362981] leading-tight">AAEA</span>
              <span className="text-[10px] text-muted-foreground leading-tight">AfWASA Dashboard</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {visiblePages.map((page) => {
              const IconComp = ICON_MAP[page.icon] || LayoutDashboard;
              const isActive = currentPage === page.id;

              return (
                <button
                  key={page.id}
                  onClick={() => {
                    setCurrentPage(page.id);
                    setOpen(false);
                  }}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  useAuthStore.getState().logout();
                  setOpen(false);
                }}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 h-8 px-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-xs">Se déconnecter</span>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
