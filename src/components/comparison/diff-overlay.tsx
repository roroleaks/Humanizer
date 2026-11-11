'use client';

import React from 'react';

interface DiffOverlayProps {
  originalText?: string;
  revisedText?: string;
}

/**
 * Placeholder DiffOverlay component. Real word-level diffing will be delivered in Phase 6.
 */
export function DiffOverlay({
  originalText = 'Original source text block placeholder.',
  revisedText = 'Revised improved academic prose text block placeholder.',
}: DiffOverlayProps) {
  return (
    <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs text-neutral-textSecondary space-y-3">
      <div className="text-[10px] uppercase font-bold text-slate-400">
        Inline Word-Level Diff Overlay (Placeholder — Phase 6)
      </div>
      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="p-2 rounded bg-red-50 text-red-700 line-through">
          - {originalText}
        </div>
        <div className="p-2 rounded bg-green-50 text-green-700">
          + {revisedText}
        </div>
      </div>
    </div>
  );
}
