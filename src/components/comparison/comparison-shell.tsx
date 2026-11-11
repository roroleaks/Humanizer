'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import { OriginalPanel } from './original-panel';
import { RevisedPanel } from './revised-panel';
import { FeatureStatus } from '@/components/workspace/feature-status';

export function ComparisonShell() {
  const [showDiffs, setShowDiffs] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);

  return (
    <div className="space-y-4">
      {/* Top Banner with Feature Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-brand-navyPrimary">
              Dual-Panel Comparison & Export Reviewer
            </h3>
            <FeatureStatus phase={6} label="Comparison Engine — Phase 6" />
          </div>
          <p className="mt-1 text-xs text-neutral-gray">
            Side-by-side synchronized paragraph diff viewer with inline integrity discrepancy markers.
          </p>
        </div>

        <div className="text-xs text-neutral-gray italic self-start sm:self-center">
          Previewing UI shell architecture
        </div>
      </div>

      {/* Synchronized Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-surface-borderSubtle rounded-xl shadow-subtle">
        {/* Left: Section Navigator */}
        <div className="flex items-center gap-2">
          <label htmlFor="section-select-stub" className="text-xs font-semibold text-neutral-gray">
            Section:
          </label>
          <select
            id="section-select-stub"
            disabled
            className="px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
          >
            <option>Introduction (1 paragraph)</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="p-1.5 rounded text-slate-300 cursor-not-allowed hover:bg-slate-50"
              aria-label="Previous section"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled
              className="p-1.5 rounded text-slate-300 cursor-not-allowed hover:bg-slate-50"
              aria-label="Next section"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Right: View Toggles */}
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showDiffs}
              onChange={(e) => setShowDiffs(e.target.checked)}
              className="rounded text-teal-accent focus:ring-teal-accent w-3.5 h-3.5"
            />
            <Eye className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span className="text-neutral-textSecondary">Show Differences</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showWarnings}
              onChange={(e) => setShowWarnings(e.target.checked)}
              className="rounded text-teal-accent focus:ring-teal-accent w-3.5 h-3.5"
            />
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span className="text-neutral-textSecondary">Show Integrity Flags</span>
          </label>
        </div>
      </div>

      {/* Dual Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[380px]">
        <OriginalPanel />
        <RevisedPanel />
      </div>
    </div>
  );
}
