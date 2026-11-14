'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Plus, Settings, Menu } from 'lucide-react';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

/**
 * Route title mapping for desktop breadcrumbs.
 */
const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/new': 'New Manuscript',
  '/manuscripts': 'My Manuscripts',
  '/history': 'Processing History',
  '/providers': 'AI Providers',
  '/settings': 'Settings',
  '/help': 'Help & Documentation',
};

/**
 * Top application header providing branding, responsive navigation toggle,
 * breadcrumbs, primary CTA actions, and author profile signature.
 */
export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname();
  const currentTitle = ROUTE_TITLES[pathname] || 'Workspace';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-brand-navyDark border-b border-brand-navyLight/40 text-surface-pureWhite shadow-sm">
      {/* Left: Hamburger (mobile) + Brand Wordmark */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-300 rounded-lg md:hidden hover:text-white hover:bg-brand-navyLight focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>

        <Link
          href="/"
          className="flex flex-col group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent rounded p-0.5"
          aria-label="Scientific Humanizer Home"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-accent inline-block animate-pulse" aria-hidden="true" />
            <span className="text-base md:text-lg font-bold tracking-tight text-white group-hover:text-teal-light transition-colors">
              Scientific Humanizer
            </span>
          </div>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium tracking-wide">
            Scientific Clarity. Natural Expression. Research Integrity.
          </span>
        </Link>
      </div>

      {/* Center: Contextual Breadcrumbs (Desktop) */}
      <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-white transition-colors">
          Platform
        </Link>
        <span aria-hidden="true" className="text-slate-600">/</span>
        <span className="text-teal-light font-medium">{currentTitle}</span>
      </nav>

      {/* Right: Actions & Author Signature */}
      <div className="flex items-center gap-3">
        <Link
          href="/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-accent text-white hover:bg-teal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-accent transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">New Manuscript</span>
        </Link>

        <Link
          href="/settings"
          className="p-2 text-slate-300 rounded-lg hover:text-white hover:bg-brand-navyLight focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent transition-colors"
          title="Application Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
        </Link>

        {/* Dr. Raouf Roshdy Signature Avatar Block */}
        <a
          href="https://github.com/roroleaks"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 px-2.5 py-1 rounded-full shadow-inner transition-all group"
          title="Designed & Developed by Dr. Raouf Roshdy"
        >
          <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-teal-400/80 shrink-0 bg-teal-950">
            <Image
              src="/dr-raouf.jpg"
              alt="Dr Raouf Roshdy"
              fill
              sizes="28px"
              className="object-cover"
              priority
            />
          </div>
          <span className="text-xs font-medium text-slate-200 group-hover:text-white tracking-wide pr-1 hidden sm:inline">
            Dr Raouf Roshdy
          </span>
        </a>
      </div>
    </header>
  );
}
