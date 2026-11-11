'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus,
  Files,
  History,
  Cpu,
  Settings,
  HelpCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'New Manuscript', href: '/new', icon: FilePlus },
  { label: 'My Manuscripts', href: '/manuscripts', icon: Files },
  { label: 'Processing History', href: '/history', icon: History },
  { label: 'AI Providers', href: '/providers', icon: Cpu },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help & Docs', href: '/help', icon: HelpCircle },
];

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-navyPrimary text-slate-200">
      {/* Top brand header for mobile drawer */}
      <div className="flex items-center justify-between p-4 md:hidden border-b border-brand-navyLight">
        <span className="font-bold text-white text-sm">Scientific Humanizer</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-brand-navyLight focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent"
          aria-label="Close navigation sidebar"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Main Navigation" className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent',
                isActive
                  ? 'bg-brand-navyLight/70 text-white border-l-[3px] border-teal-accent pl-3'
                  : 'text-slate-300 hover:bg-brand-navyLight/40 hover:text-white'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-teal-accent' : 'text-slate-400')}
                aria-hidden={true}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Integrity Assurance Badge */}
      <div className="p-4 m-3 rounded-lg bg-brand-navyDark/60 border border-brand-navyLight/50 text-xs">
        <div className="flex items-center gap-2 text-teal-light font-semibold mb-1">
          <ShieldCheck className="w-4 h-4 text-teal-accent flex-shrink-0" aria-hidden="true" />
          <span>Research Integrity</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Zero silent modifications to statistical results, clinical data, or citations.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (240px wide) */}
      <aside className="hidden md:flex flex-col w-60 fixed top-16 bottom-0 left-0 z-20 border-r border-brand-navyLight/40 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 md:hidden transform transition-transform duration-200 ease-in-out shadow-2xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
      >
        {sidebarContent}
      </div>
    </>
  );
}
