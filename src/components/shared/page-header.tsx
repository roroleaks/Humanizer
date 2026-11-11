'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  chips?: React.ReactNode[];
  actions?: React.ReactNode[];
  className?: string;
}

/**
 * Standardized PageHeader component ensuring consistent hierarchy and accessibility.
 */
export function PageHeader({ title, subtitle, chips, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('pb-6 mb-6 border-b border-surface-borderSubtle', className)}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-navyPrimary">
              {title}
            </h1>
            {chips && chips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {chips.map((chip, idx) => (
                  <React.Fragment key={idx}>{chip}</React.Fragment>
                ))}
              </div>
            )}
          </div>
          {subtitle && (
            <p className="mt-1.5 text-sm text-neutral-gray max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-3 self-start md:self-center">
            {actions.map((action, idx) => (
              <React.Fragment key={idx}>{action}</React.Fragment>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
