'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FeatureStatusProps {
  /** The target implementation phase number (e.g. 2, 4, 6) */
  phase?: number;
  /** Custom label override if not standard Phase N text */
  label?: string;
  /** Optional additional classes */
  className?: string;
}

/**
 * FeatureStatus
 * 
 * Standardized badge communicating that an interactive capability or data source
 * is stubbed in the current phase and will be delivered in a designated future phase.
 */
export function FeatureStatus({ phase, label, className }: FeatureStatusProps) {
  const text = label || (phase !== undefined ? `Not yet implemented — Phase ${phase}` : 'Not yet implemented');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full',
        'bg-teal-50 text-teal-800 border border-teal-200/80 shadow-subtle',
        className
      )}
      title="This feature is intentionally stubbed for this phase"
    >
      <Sparkles className="w-3 h-3 text-teal-accent" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}
