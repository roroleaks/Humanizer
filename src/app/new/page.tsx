'use client';

import React from 'react';
import { PageHeader } from '@/components/shared';
import { IntakeWorkspace } from '@/components/workspace';

export default function NewManuscriptPage() {
  const density = parseInt(process.env.NEXT_PUBLIC_SH_PAGE_WORD_DENSITY || '500', 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Manuscript"
        subtitle="Upload or import an academic paper to initiate section decomposition, style profiling, and integrity verification."
        chips={[
          <span
            key="limit"
            className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-brand-navyPrimary border border-slate-200"
          >
            Max 15 Pages
          </span>,
          <span
            key="lang"
            className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200"
          >
            Scientific English
          </span>,
        ]}
      />

      <IntakeWorkspace defaultWordDensity={density} />
    </div>
  );
}
