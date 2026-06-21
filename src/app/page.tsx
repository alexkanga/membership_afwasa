'use client';

import React, { useEffect } from 'react';
import { useAuthStore, useDashboardStore } from '@/stores/auth-store';
import { LoginForm } from '@/components/auth/login-form';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { ExecutiveView } from '@/components/dashboard/executive-view';
import { MembersView } from '@/components/dashboard/members-view';
import { GeographyView } from '@/components/dashboard/geography-view';
import { FinanceView } from '@/components/dashboard/finance-view';
import { RenewalsView } from '@/components/dashboard/renewals-view';
import { QualityView } from '@/components/dashboard/quality-view';
import { RisksView } from '@/components/dashboard/risks-view';
import { UploadsView } from '@/components/dashboard/uploads-view';
import { AdminPanel } from '@/components/dashboard/admin-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMounted } from '@/hooks/use-mounted';
import { Droplets, Loader2 } from 'lucide-react';

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const hydrated = useAuthStore((s) => s._hydrated);
  const currentPage = useDashboardStore((s) => s.currentPage);
  const mounted = useMounted();

  // Seed admin user on first client render
  useEffect(() => {
    fetch('/api/auth/seed').catch(() => {});
  }, []);

  // Server render or before zustand hydration: show loading
  if (!mounted || !hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#362981]">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-lg font-bold text-[#362981]">AAEA</h1>
            <span className="text-sm text-muted-foreground">AfWASA Dashboard</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  // After hydration but not authenticated: show login
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'executive':
        return <ExecutiveView />;
      case 'members':
        return <MembersView />;
      case 'geography':
        return <GeographyView />;
      case 'finance':
        return <FinanceView />;
      case 'renewals':
        return <RenewalsView />;
      case 'quality':
        return <QualityView />;
      case 'risks':
        return <RisksView />;
      case 'uploads':
        return isAdmin ? <UploadsView /> : <ExecutiveView />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <ExecutiveView />;
      default:
        return <ExecutiveView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <AppSidebar />
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <AppHeader />

        <main className="flex-1">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="p-4 lg:p-6 pb-12">
              {renderPage()}
            </div>
          </ScrollArea>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-white py-3 px-4 lg:pl-64">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>AAEA / AfWASA &copy; {new Date().getFullYear()}</span>
            <span>Membership Dashboard v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
