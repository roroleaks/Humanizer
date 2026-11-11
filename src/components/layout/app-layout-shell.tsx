'use client';

import React, { useState } from 'react';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { AppFooter } from './app-footer';

interface AppLayoutShellProps {
  children: React.ReactNode;
}

export function AppLayoutShell({ children }: AppLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-neutral-textPrimary antialiased">
      <AppHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col md:pl-60">
        <main id="main-content" className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
