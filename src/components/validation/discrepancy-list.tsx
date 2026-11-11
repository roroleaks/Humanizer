'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Discrepancy, DiscrepancySeverity } from '@/contracts/scientific-integrity';
import { cn } from '@/lib/utils';

interface DiscrepancyListProps {
  discrepancies?: Discrepancy[];
}

export function DiscrepancyList({ discrepancies = [] }: DiscrepancyListProps) {
  if (!discrepancies || discrepancies.length === 0) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-800">
        <CheckCircle className="w-4 h-4 text-scientific-pass flex-shrink-0" aria-hidden="true" />
        <span>No discrepancies detected against the protected inventory.</span>
      </div>
    );
  }

  function getSeverityBadge(severity: DiscrepancySeverity) {
    switch (severity) {
      case 'FAIL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
            FAIL
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            WARNING
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            INFO
          </span>
        );
    }
  }

  return (
    <div className="space-y-2">
      {discrepancies.map((d) => (
        <div
          key={d.id}
          className="p-3 rounded-lg border border-slate-200 bg-white text-xs space-y-1.5 shadow-subtle"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {d.severity === 'FAIL' ? (
                <AlertCircle className="w-4 h-4 text-scientific-fail flex-shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-scientific-warning flex-shrink-0" aria-hidden="true" />
              )}
              <span className="font-semibold text-brand-navyPrimary">{d.reason}</span>
            </div>
            {getSeverityBadge(d.severity)}
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1 border-t border-slate-100">
            <div className="p-1.5 rounded bg-slate-50 text-slate-700">
              <span className="text-[10px] font-sans text-slate-400 block">Original</span>
              {d.originalValue}
            </div>
            <div className="p-1.5 rounded bg-slate-50 text-slate-700">
              <span className="text-[10px] font-sans text-slate-400 block">Revised</span>
              {d.revisedValue}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
