'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-8 px-4 md:px-8 border-t border-surface-borderSubtle bg-surface-cardBackground text-xs text-neutral-gray">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top: Brand info and author profile card */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-accent inline-block" />
              <span className="font-bold text-sm text-brand-navyPrimary">Scientific Humanizer</span>
              <span className="bg-teal-50 border border-teal-200 text-teal-800 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                v1.0 Academic Intelligence
              </span>
            </div>
            <p className="text-xs text-neutral-textSecondary italic">
              Scientific Clarity. Natural Expression. Research Integrity. Deterministic Vancouver Reference Guard.
            </p>
          </div>

          {/* Author Signature Block */}
          <a
            href="https://github.com/roroleaks"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 px-3.5 py-2 rounded-xl transition-all shadow-xs group"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-teal-600/50 shrink-0 bg-teal-900 shadow-xs">
              <Image
                src="/dr-raouf.jpg"
                alt="Dr Raouf Roshdy"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                Dr. Raouf Roshdy
              </div>
              <div className="text-[11px] text-teal-700 font-medium">
                Lead Investigator & Creator
              </div>
            </div>
          </a>
        </div>

        {/* Middle: Compliance, privacy and academic notes */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 text-center md:text-left">
          <p className="max-w-2xl leading-relaxed">
            Preserves numerical endpoints, statistical intervals (95% CI, p-values), dosages, and bibliographic citations with zero-hallucination integrity.
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <span>Private & Zero-Retention</span>
            <span>•</span>
            <Link
              href="/help#privacy"
              className="text-teal-accent hover:text-teal-hover underline underline-offset-2 font-medium"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <a
              href="https://github.com/roroleaks/Humanizer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-accent hover:text-teal-hover underline underline-offset-2 font-medium"
            >
              GitHub Source
            </a>
          </div>
        </div>

        {/* Bottom copyright line matching previous repos */}
        <div className="text-center pt-2 text-[10px] text-slate-400">
          Designed & Developed by Dr. Raouf Roshdy © 2024–{currentYear} • All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
