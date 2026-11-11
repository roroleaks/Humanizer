'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ValidationCheck } from '@/contracts/scientific-integrity';

interface CheckListProps {
  checks?: ValidationCheck[];
}

export function CheckList({ checks = [] }: CheckListProps) {
  if (!checks || checks.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-neutral-gray text-center">
        No checks run yet.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {checks.map((check, index) => {
        const isPass = check.status === 'PASS';
        const isWarning = check.status === 'WARNING';
        const isFail = check.status === 'FAIL';

        return (
          <div
            key={index}
            className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-white text-xs hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {isPass && <CheckCircle2 className="w-4 h-4 text-scientific-pass flex-shrink-0" aria-hidden="true" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-scientific-warning flex-shrink-0" aria-hidden="true" />}
              {isFail && <XCircle className="w-4 h-4 text-scientific-fail flex-shrink-0" aria-hidden="true" />}
              <span className="font-medium text-brand-navyPrimary capitalize">
                {check.category.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-gray truncate max-w-xs">{check.detail}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isPass
                    ? 'bg-emerald-50 text-emerald-800'
                    : isWarning
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-red-50 text-red-800'
                }`}
              >
                {check.status}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
