'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  featureStatus?: React.ReactNode;
  className?: string;
}

/**
 * Centered accessible empty state card with clinical aesthetic.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  featureStatus,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl',
        'bg-surface-cardBackground border border-surface-borderSubtle shadow-subtle',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 text-brand-navyLight mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-brand-navyPrimary">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-neutral-gray max-w-md">
        {description}
      </p>

      {featureStatus && (
        <div className="mt-4">
          {featureStatus}
        </div>
      )}

      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
