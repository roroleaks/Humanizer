'use client';

import React from 'react';
import Link from 'next/link';

export function AppFooter() {
  return (
    <footer className="mt-auto py-6 px-4 md:px-8 border-t border-surface-borderSubtle bg-surface-cardBackground text-xs text-neutral-gray">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <span className="font-semibold text-brand-navyPrimary">Scientific Humanizer</span>
          <span className="hidden sm:inline"> — </span>
          <span className="italic text-neutral-textSecondary">Scientific Clarity. Natural Expression. Research Integrity.</span>
        </div>
        <div>
          <span>Manuscripts are processed privately. </span>
          <Link
            href="/help#privacy"
            className="text-teal-accent hover:text-teal-hover underline underline-offset-2 font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-accent"
          >
            See Privacy Guarantee
          </Link>
        </div>
      </div>
    </footer>
  );
}
