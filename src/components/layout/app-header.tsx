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
          className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent rounded p-0.5"
          aria-label="Humanizero Home"
        >
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-sm shrink-0 bg-slate-900 group-hover:scale-105 transition-transform">
            <Image
              src="/icon.png"
              alt="Humanizero Icon"
              fill
              sizes="32px"
              className="object-cover"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg font-bold tracking-tight text-white group-hover:text-teal-light transition-colors">
                Humanizero
              </span>
              <span className="hidden md:inline-block bg-teal-500/20 border border-teal-400/40 text-teal-300 rounded-full px-2 py-0.5 text-[10px] font-bold">
                v1.0
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium tracking-wide">
              Scientific Clarity. Natural Expression. Research Integrity.
            </span>
          </div>
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
