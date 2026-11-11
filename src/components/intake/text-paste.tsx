'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, ShieldCheck } from 'lucide-react';

export interface TextPasteInfo {
  text: string;
  charCount: number;
  wordCount: number;
  estimatedPages: number;
}

interface TextPasteProps {
  onTextChange: (info: TextPasteInfo | null) => void;
  wordDensity?: number;
}

export function TextPaste({ onTextChange, wordDensity = 500 }: TextPasteProps) {
  const [content, setContent] = useState('');

  function handleContentChange(newText: string) {
    setContent(newText);
    const trimmed = newText.trim();

    if (!trimmed) {
      onTextChange(null);
      return;
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const estimatedPages = Math.max(1, Math.ceil(wordCount / wordDensity));

    onTextChange({
      text: newText,
      charCount: newText.length,
      wordCount,
      estimatedPages,
    });
  }

  function handleClear() {
    setContent('');
    onTextChange(null);
  }

  const trimmed = content.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const estimatedPages = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / wordDensity)) : 0;
  const isOversized = estimatedPages > 15;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="manuscript-text-paste" className="block text-sm font-semibold text-brand-navyPrimary">
          Paste Scientific Manuscript Text
        </label>
        {content && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-scientific-fail focus:outline-none focus-visible:ring-1 focus-visible:ring-scientific-fail"
            aria-label="Clear all pasted text"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear Text</span>
          </button>
        )}
      </div>

      <textarea
        id="manuscript-text-paste"
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        rows={14}
        placeholder="Paste complete manuscript sections, including Title, Abstract, Introduction, Methods, Results, Discussion, and References..."
        className="w-full p-4 text-sm font-mono leading-relaxed bg-white border border-surface-borderDefault rounded-xl shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary placeholder:text-neutral-gray min-h-[320px] resize-y"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-gray px-1">
        <div className="flex items-center gap-3">
          <span>Characters: {content.length.toLocaleString()}</span>
          <span>•</span>
          <span>Words: {wordCount.toLocaleString()}</span>
          <span>•</span>
          <span className="font-medium text-brand-navyPrimary">
            Estimated Pages: {estimatedPages} {estimatedPages === 1 ? 'page' : 'pages'} (based on {wordDensity} words/page)
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Max limit: 15 pages
        </div>
      </div>

      {isOversized && (
        <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-amber-50 border border-amber-200 text-scientific-warning" role="alert">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <strong>Manuscript limit warning:</strong> The pasted text contains approximately {estimatedPages} pages, exceeding the 15-page platform maximum. Please trim non-essential supplementary material or split sections.
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 p-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-neutral-textSecondary">
        <ShieldCheck className="w-4 h-4 text-teal-accent flex-shrink-0" aria-hidden="true" />
        <span>Client-side sandbox: Pasted text remains in your local browser runtime until you click Begin Processing.</span>
      </div>
    </div>
  );
}
