'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrivacyNoticeProps {
  message: string;
  learnMoreHref?: string;
  className?: string;
}

/**
 * Reusable clinical privacy notice banner reassuring users about confidentiality.
 */
export function PrivacyNotice({
  message,
  learnMoreHref = '/help#privacy',
  className,
}: PrivacyNoticeProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-lg text-xs',
        'bg-slate-50 border border-slate-200 text-neutral-textSecondary',
        className
      )}
      role="note"
      aria-label="Privacy notice"
    >
      <ShieldCheck className="w-4 h-4 text-teal-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1 leading-relaxed">
        <span>{message}</span>
        {learnMoreHref && (
          <Link
            href={learnMoreHref}
            className="ml-1.5 font-medium text-teal-accent hover:text-teal-hover underline underline-offset-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-accent"
          >
            Learn more about data privacy
          </Link>
        )}
      </div>
    </div>
  );
}
