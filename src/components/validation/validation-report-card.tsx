'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ValidationReport } from '@/contracts/scientific-integrity';
import { CheckList } from './check-list';
import { DiscrepancyList } from './discrepancy-list';
import { cn } from '@/lib/utils';

interface ValidationReportCardProps {
  report: ValidationReport;
  className?: string;
}

export function ValidationReportCard({ report, className }: ValidationReportCardProps) {
  const isPass = report.status === 'PASS';
  const isWarning = report.status === 'WARNING';
  const isFail = report.status === 'FAIL';

  return (
    <div
      className={cn(
        'p-6 rounded-2xl border shadow-subtle bg-white space-y-6',
        isPass && 'border-emerald-200',
        isWarning && 'border-amber-200',
        isFail && 'border-red-200',
        className
      )}
    >
      {/* Header & Overall Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-accent" aria-hidden="true" />
            <h3 className="text-base font-bold text-brand-navyPrimary">
              Scientific Integrity Validation Report
            </h3>
          </div>
          <p className="mt-1 text-xs text-neutral-gray">
            Generated at {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-gray">Verdict:</span>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
              isPass && 'bg-emerald-100 text-emerald-900 border border-emerald-300',
              isWarning && 'bg-amber-100 text-amber-900 border border-amber-300',
              isFail && 'bg-red-100 text-red-900 border border-red-300'
            )}
          >
            {report.status}
          </span>
        </div>
      </div>

      {/* Discrepancies Section */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-textSecondary mb-2 flex items-center justify-between">
          <span>Detected Discrepancies ({report.discrepancies.length})</span>
          {report.discrepancies.length > 0 && (
            <span className="text-[11px] font-normal text-amber-700">Review required before final approval</span>
          )}
        </h4>
        <DiscrepancyList discrepancies={report.discrepancies} />
      </div>

      {/* Categorical Checks Section */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-textSecondary mb-2">
          Automated Integrity Verification Checks ({report.checks.length})
        </h4>
        <CheckList checks={report.checks} />
      </div>

      {/* Footnote Warning */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-neutral-textSecondary">
        <Info className="w-4 h-4 text-teal-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span className="italic leading-relaxed">
          A <strong>PASS</strong> status certifies mechanical preservation against the extracted inventory; it does not guarantee scientific correctness or constitute formal peer review. Mechanical preservation checks are not semantic scientific review.
        </span>
      </div>
    </div>
  );
}
