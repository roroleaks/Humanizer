'use client';

import React from 'react';

export interface ParagraphItem {
  id: string;
  text: string;
}

interface OriginalPanelProps {
  sectionTitle?: string;
  paragraphs?: ParagraphItem[];
}

export function OriginalPanel({
  sectionTitle = 'Introduction',
  paragraphs = [
    {
      id: 'p1',
      text: 'In recent years, numerous clinical trials have demonstrated that SGLT2 inhibitors produce remarkable cardiovascular benefits in patients with type 2 diabetes [1, 2].',
    },
  ],
}: OriginalPanelProps) {
  return (
    <div className="flex-1 flex flex-col bg-surface-cardBackground border border-surface-borderSubtle rounded-xl overflow-hidden shadow-subtle">
      <div className="px-4 py-3 bg-slate-50 border-b border-surface-borderSubtle flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-navyPrimary">
          Original Manuscript
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          Section: {sectionTitle}
        </span>
      </div>

      <div className="p-5 space-y-4 flex-1 overflow-y-auto font-sans leading-relaxed text-sm text-neutral-textPrimary">
        {paragraphs.map((p) => (
          <div key={p.id} className="p-3 rounded-lg bg-slate-50/60 border border-slate-100">
            <p className="italic text-slate-500">{p.text}</p>
            <div className="mt-2 text-[10px] text-slate-400 uppercase tracking-wider">
              [Placeholder Original Text — Phase 6 will display ingested manuscript paragraphs]
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
