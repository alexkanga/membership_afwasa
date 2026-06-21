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

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { currentPage } = useDashboardStore();

  // Seed admin user on mount
  useEffect(() => {
    fetch('/api/auth/seed').catch(() => {});
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#362981] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
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
        return <UploadsView />;
      case 'admin':
        return <AdminPanel />;
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
      </div>
    </div>
  );
}
