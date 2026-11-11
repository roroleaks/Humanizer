'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ParagraphItem } from './original-panel';

interface RevisedPanelProps {
  sectionTitle?: string;
  paragraphs?: ParagraphItem[];
}

export function RevisedPanel({
  sectionTitle = 'Introduction',
  paragraphs = [
    {
      id: 'p1-rev',
      text: 'Over the past decade, extensive randomized clinical investigations have established that sodium-glucose cotransporter 2 (SGLT2) inhibitors confer substantial cardioprotective effects in patients diagnosed with type 2 diabetes [1, 2].',
    },
  ],
}: RevisedPanelProps) {
  return (
    <div className="flex-1 flex flex-col bg-surface-cardBackground border border-surface-borderSubtle rounded-xl overflow-hidden shadow-subtle">
      <div className="px-4 py-3 bg-teal-50/60 border-b border-teal-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-accent" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navyPrimary">
            Revised Manuscript
          </span>
        </div>
        <span className="text-[11px] font-medium text-teal-800">
          Section: {sectionTitle}
        </span>
      </div>

      <div className="p-5 space-y-4 flex-1 overflow-y-auto font-sans leading-relaxed text-sm text-neutral-textPrimary">
        {paragraphs.map((p) => (
          <div key={p.id} className="p-3 rounded-lg bg-teal-50/30 border border-teal-100">
            <p className="italic text-slate-600">{p.text}</p>
            <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1 text-scientific-pass font-medium">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                Citations [1, 2] Verified
              </span>
              <span>[Placeholder Revised Text — Phase 6 will display LLM output]</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
