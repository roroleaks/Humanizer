'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileText, File, Globe, Edit3, Info, AlertTriangle, XCircle } from 'lucide-react';
import { DocxUpload, DocxFileInfo } from '@/components/intake/docx-upload';
import { PdfUpload, PdfFileInfo } from '@/components/intake/pdf-upload';
import { UrlImport } from '@/components/intake/url-import';
import { TextPaste, TextPasteInfo } from '@/components/intake/text-paste';
import { ProcessingConfig, ProcessingConfigValues } from './processing-config';
import { cn } from '@/lib/utils';
import { IntakeResponse } from '@/contracts/manuscript';

type IntakeMethod = 'docx' | 'pdf' | 'url' | 'paste';

interface IntakeWorkspaceContentProps {
  defaultWordDensity?: number;
}

function IntakeWorkspaceContent({ defaultWordDensity = 500 }: IntakeWorkspaceContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const methodParam = searchParams.get('method') as IntakeMethod | null;

  const [activeMethod, setActiveMethod] = useState<IntakeMethod>('docx');
  const [docxData, setDocxData] = useState<DocxFileInfo | null>(null);
  const [pdfData, setPdfData] = useState<PdfFileInfo | null>(null);
  const [urlData, setUrlData] = useState<string | null>(null);
  const [pasteData, setPasteData] = useState<TextPasteInfo | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<{ title: string; detail: string } | null>(null);

  useEffect(() => {
    if (methodParam && ['docx', 'pdf', 'url', 'paste'].includes(methodParam)) {
      setActiveMethod(methodParam);
    }
  }, [methodParam]);

  // Determine readiness to process
  const isReady =
    (activeMethod === 'docx' && !!docxData) ||
    (activeMethod === 'pdf' && !!pdfData) ||
    (activeMethod === 'url' && !!urlData) ||
    (activeMethod === 'paste' && !!pasteData);

  // Compute active estimated pages
  let currentEstimatedPages = 0;
  if (activeMethod === 'docx' && docxData) currentEstimatedPages = docxData.estimatedPages;
  else if (activeMethod === 'pdf' && pdfData) currentEstimatedPages = pdfData.estimatedPages;
  else if (activeMethod === 'paste' && pasteData) currentEstimatedPages = pasteData.estimatedPages;

  async function handleBeginProcessing(config: ProcessingConfigValues) {
    if (!isReady || isProcessing) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let res: Response;

      if (activeMethod === 'docx' && docxData) {
        const formData = new FormData();
        formData.append('file', docxData.file);
        formData.append('styleProfile', config.styleProfile);
        formData.append('primaryProvider', config.primaryProvider);
        res = await fetch('/api/intake/docx', {
          method: 'POST',
          body: formData,
        });
      } else if (activeMethod === 'pdf' && pdfData) {
        const formData = new FormData();
        formData.append('file', pdfData.file);
        formData.append('styleProfile', config.styleProfile);
        formData.append('primaryProvider', config.primaryProvider);
        res = await fetch('/api/intake/pdf', {
          method: 'POST',
          body: formData,
        });
      } else if (activeMethod === 'url' && urlData) {
        res = await fetch('/api/intake/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlData,
            styleProfile: config.styleProfile,
            primaryProvider: config.primaryProvider,
          }),
        });
      } else if (activeMethod === 'paste' && pasteData) {
        res = await fetch('/api/intake/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: pasteData.text,
            styleProfile: config.styleProfile,
            primaryProvider: config.primaryProvider,
          }),
        });
      } else {
        throw new Error('No input provided for processing.');
      }

      let data: IntakeResponse;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(
          res.status === 500
            ? 'Server error (500) during manuscript intake. Please check logs.'
            : `Unexpected response from server (${res.status}): ${rawText.slice(0, 100)}`
        );
      }

      if (!res.ok || data.status === 'failed') {
        const primaryError = data.errors?.[0];
        setErrorMessage({
          title: primaryError?.code === 'PAGE_LIMIT_EXCEEDED'
            ? 'Page Limit Exceeded'
            : primaryError?.code === 'SSRF_GUARD_VIOLATION'
            ? 'Restricted URL Security Violation'
            : 'Processing Failed',
          detail: primaryError?.message || 'An error occurred while parsing the manuscript.',
        });
        setIsProcessing(false);
        return;
      }

      // Success: navigate to manuscript view
      router.push(`/manuscripts/${data.manuscriptId}`);
    } catch (err: any) {
      setErrorMessage({
        title: 'Network or Server Error',
        detail: err?.message || 'Failed to communicate with document intake service.',
      });
      setIsProcessing(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Intake Methods & Work Area (8 columns on lg) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 animate-in fade-in duration-200"
          >
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-red-900">{errorMessage.title}</h4>
              <p className="mt-1 text-xs text-red-700 leading-relaxed">{errorMessage.detail}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-500 hover:text-red-700 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Method Selector Tabs */}
        <div className="flex p-1 space-x-1 bg-slate-100 rounded-xl border border-surface-borderSubtle">
          <button
            type="button"
            onClick={() => {
              setActiveMethod('docx');
              setErrorMessage(null);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent',
              activeMethod === 'docx'
                ? 'bg-white text-brand-navyPrimary shadow-sm'
                : 'text-neutral-gray hover:text-brand-navyPrimary'
            )}
            aria-selected={activeMethod === 'docx'}
            role="tab"
          >
            <FileText className="w-4 h-4 text-teal-accent" aria-hidden="true" />
            <span>Word DOCX</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMethod('pdf');
              setErrorMessage(null);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent',
              activeMethod === 'pdf'
                ? 'bg-white text-brand-navyPrimary shadow-sm'
                : 'text-neutral-gray hover:text-brand-navyPrimary'
            )}
            aria-selected={activeMethod === 'pdf'}
            role="tab"
          >
            <File className="w-4 h-4 text-teal-accent" aria-hidden="true" />
            <span>PDF (Digital & Scanned)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMethod('url');
              setErrorMessage(null);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent',
              activeMethod === 'url'
                ? 'bg-white text-brand-navyPrimary shadow-sm'
                : 'text-neutral-gray hover:text-brand-navyPrimary'
            )}
            aria-selected={activeMethod === 'url'}
            role="tab"
          >
            <Globe className="w-4 h-4 text-teal-accent" aria-hidden="true" />
            <span>Public URL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMethod('paste');
              setErrorMessage(null);
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent',
              activeMethod === 'paste'
                ? 'bg-white text-brand-navyPrimary shadow-sm'
                : 'text-neutral-gray hover:text-brand-navyPrimary'
            )}
            aria-selected={activeMethod === 'paste'}
            role="tab"
          >
            <Edit3 className="w-4 h-4 text-teal-accent" aria-hidden="true" />
            <span>Paste Text</span>
          </button>
        </div>

        {/* Tab Panel Content */}
        <div className="bg-surface-cardBackground p-6 rounded-2xl border border-surface-borderSubtle shadow-subtle min-h-[380px]">
          {activeMethod === 'docx' && (
            <DocxUpload onFileChange={setDocxData} wordDensity={defaultWordDensity} />
          )}
          {activeMethod === 'pdf' && (
            <PdfUpload onFileChange={setPdfData} wordDensity={defaultWordDensity} />
          )}
          {activeMethod === 'url' && (
            <UrlImport onUrlChange={setUrlData} />
          )}
          {activeMethod === 'paste' && (
            <TextPaste onTextChange={setPasteData} wordDensity={defaultWordDensity} />
          )}
        </div>

        {/* Live Page-Count Preview Bar */}
        {currentEstimatedPages > 0 && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-neutral-textSecondary">
            <Info className="w-4 h-4 text-teal-accent flex-shrink-0" aria-hidden="true" />
            <span>
              <strong>Estimated length:</strong> {currentEstimatedPages} {currentEstimatedPages === 1 ? 'page' : 'pages'} (computed from {defaultWordDensity} words/page baseline; server strictly enforces 15-page limit).
            </span>
          </div>
        )}
      </div>

      {/* Right Column: Processing Configuration Panel (4 columns on lg) */}
      <div className="lg:col-span-4">
        <ProcessingConfig
          isReadyToProcess={isReady}
          isProcessing={isProcessing}
          estimatedPages={currentEstimatedPages}
          onProcess={handleBeginProcessing}
        />
      </div>
    </div>
  );
}

export function IntakeWorkspace(props: IntakeWorkspaceContentProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-gray">Loading intake workspace...</div>}>
      <IntakeWorkspaceContent {...props} />
    </Suspense>
  );
}
