'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  File,
  Globe,
  BookOpen,
  Sparkles,
  Table as TableIcon,
  Layers,
  History,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { FeatureStatus } from '@/components/workspace/feature-status';
import { TableData } from '@/contracts/document-section';
import { ManuscriptStyleProfile, RefinementIntensity, RefinementFlag, RefinementResult } from '@/contracts/refinement';
import { AIProviderName } from '@/contracts/ai-provider';

interface SectionItem {
  id: string;
  manuscriptId: string;
  parentId: string | null;
  type: string;
  title: string;
  orderIndex: number;
  content: string;
  tableData: TableData | null;
  rawHtml: string | null;
  charCount: number;
  createdAt: string;
}

interface EventItem {
  id: string;
  eventType: string;
  eventSeverity: 'info' | 'warning' | 'error' | 'security';
  detail: string;
  createdAt: string;
}

interface ManuscriptDetail {
  id: string;
  title: string;
  status: string;
  sourceType: 'docx' | 'pdf' | 'url' | 'text';
  sourceUrl?: string;
  originalFilename?: string;
  pageCount: number;
  pageCountConfidence: 'verified' | 'estimated';
  wordCount: number;
  styleProfile: ManuscriptStyleProfile;
  primaryProvider: AIProviderName;
  ocrUsed: boolean;
  refinementConsentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STYLE_PROFILES: { value: ManuscriptStyleProfile; label: string; desc: string }[] = [
  { value: 'original_research', label: 'Original Research (IMRAD)', desc: 'Standard empirical studies, randomized controlled trials, cohort studies' },
  { value: 'systematic_review', label: 'Systematic Review / PRISMA', desc: 'Protocol-driven literature synthesis with risk-of-bias evaluation' },
  { value: 'meta_analysis', label: 'Meta-Analysis', desc: 'Quantitative synthesis, pooled effect size statistics and forest plots' },
  { value: 'narrative_review', label: 'Narrative Review', desc: 'Broad conceptual synthesis and clinical perspective overviews' },
  { value: 'clinical_commentary', label: 'Clinical Commentary', desc: 'Expert opinion, clinical controversies, guideline critiques' },
  { value: 'case_report', label: 'Clinical Case Report', desc: 'Patient presentation, diagnostic workup, therapeutic outcome' },
  { value: 'research_letter', label: 'Research Letter / Brief Comm.', desc: 'Concise high-impact research findings and preliminary communications' },
];

const INTENSITY_OPTIONS: { value: RefinementIntensity; label: string; desc: string }[] = [
  { value: 'conservative', label: 'Conservative (Light Polish)', desc: '10–20% touched. Fixes grammar & awkward phrasing while strictly preserving author voice.' },
  { value: 'standard', label: 'Standard (Editorial Refinement)', desc: '40–60% touched. Refines flow, rhythm, and vocabulary precision.' },
  { value: 'high_impact', label: 'High-Impact (Natural Fluency)', desc: '70–90% touched. Natural academic English phrasing and deep syntactic transformation.' },
];

const PROVIDER_OPTIONS: { value: AIProviderName; label: string; privacyUrl: string }[] = [
  { value: 'gemini', label: 'Google Gemini (1.5 Pro)', privacyUrl: 'https://policies.google.com/privacy' },
  { value: 'openai', label: 'OpenAI Enterprise (GPT-4o)', privacyUrl: 'https://openai.com/enterprise-privacy' },
  { value: 'anthropic', label: 'Anthropic Claude (3.5 Sonnet)', privacyUrl: 'https://www.anthropic.com/privacy' },
  { value: 'openai_compatible', label: 'Custom OpenAI-Compatible API', privacyUrl: '#' },
];

export default function ManuscriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [manuscript, setManuscript] = useState<ManuscriptDetail | null>(null);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'audit' | 'flags'>('content');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Refinement UI States
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [consentAcknowledged, setConsentAcknowledged] = useState(false);
  const [isGrantingConsent, setIsGrantingConsent] = useState(false);

  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [refineProfile, setRefineProfile] = useState<ManuscriptStyleProfile>('original_research');
  const [refineIntensity, setRefineIntensity] = useState<RefinementIntensity>('standard');
  const [refineProvider, setRefineProvider] = useState<AIProviderName>('gemini');

  // Refinement Execution States
  const [isRefining, setIsRefining] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<AIProviderName>('gemini');
  const [failoverNotice, setFailoverNotice] = useState<string | null>(null);
  const [totalChunks, setTotalChunks] = useState(0);
  const [completedChunks, setCompletedChunks] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [streamingDelta, setStreamingDelta] = useState('');
  const [currentChunkOriginal, setCurrentChunkOriginal] = useState('');
  const [completedChunksList, setCompletedChunksList] = useState<
    Array<{
      chunkId: string;
      refinedText: string;
      changeLevel: string;
      flags: RefinementFlag[];
      providerUsed?: string;
    }>
  >([]);
  const [refinementResult, setRefinementResult] = useState<RefinementResult | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/manuscripts/${id}`);
      if (!res.ok) {
        throw new Error('Manuscript could not be located in storage.');
      }
      const data = await res.json();
      setManuscript(data.manuscript);
      setSections(data.sections || []);
      setEvents(data.events || []);
      if (data.sections?.length > 0 && !selectedSectionId) {
        setSelectedSectionId(data.sections[0].id);
      }
      if (data.manuscript?.styleProfile) {
        setRefineProfile(data.manuscript.styleProfile);
      }
      if (data.manuscript?.primaryProvider) {
        setRefineProvider(data.manuscript.primaryProvider);
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load manuscript details.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [id]);

  const selectedSection = sections.find((s) => s.id === selectedSectionId) || sections[0];

  function handleBeginRefinementClick() {
    if (!manuscript?.refinementConsentAt) {
      setConsentAcknowledged(false);
      setIsConsentModalOpen(true);
    } else {
      setIsConfigDrawerOpen(true);
    }
  }

  async function handleGrantConsent() {
    if (!consentAcknowledged || isGrantingConsent) return;
    setIsGrantingConsent(true);
    try {
      const res = await fetch(`/api/manuscripts/${id}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryProvider: refineProvider,
          fallbacks: ['openai', 'anthropic'],
        }),
      });
      if (!res.ok) throw new Error('Failed to record consent');
      const data = await res.json();
      setManuscript((prev) => (prev ? { ...prev, refinementConsentAt: data.consentedAt } : null));
      setIsConsentModalOpen(false);
      setIsConfigDrawerOpen(true);
    } catch (err: any) {
      alert(`Could not record consent: ${err.message}`);
    } finally {
      setIsGrantingConsent(false);
    }
  }

  async function handleStartRefinement() {
    setIsConfigDrawerOpen(false);
    setIsRefining(true);
    setStreamingDelta('');
    setCompletedChunksList([]);
    setRefinementResult(null);
    setFailoverNotice(null);
    setCurrentProvider(refineProvider);

    try {
      const planRes = await fetch(`/api/manuscripts/${id}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleProfile: refineProfile,
          intensity: refineIntensity,
          primaryProvider: refineProvider,
        }),
      });

      if (!planRes.ok) {
        const errorData = await planRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to initialize refinement job.');
      }

      const { jobId, totalChunks: count } = await planRes.json();
      setActiveJobId(jobId);
      setTotalChunks(count);
      setCompletedChunks(0);

      // Connect to SSE stream
      const sse = new EventSource(`/api/manuscripts/${id}/refine/stream?jobId=${jobId}`);
      eventSourceRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'chunk_started') {
            setCurrentChunkIndex(data.chunkIndex);
            setCurrentProvider(data.providerName);
            setStreamingDelta('');
          } else if (data.type === 'provider_failover') {
            setFailoverNotice(
              `Provider failover: Switched from ${data.fromProvider} to ${data.toProvider} (${data.reason})`
            );
            setCurrentProvider(data.toProvider);
          } else if (data.type === 'chunk_delta') {
            setStreamingDelta((prev) => prev + data.delta);
          } else if (data.type === 'chunk_completed') {
            setCompletedChunks((prev) => prev + 1);
            setCompletedChunksList((prev) => [
              ...prev,
              {
                chunkId: data.chunkId,
                refinedText: data.refinedText,
                changeLevel: data.changeLevel,
                flags: data.flags || [],
                providerUsed: currentProvider,
              },
            ]);
            setStreamingDelta('');
          } else if (data.type === 'job_completed') {
            setRefinementResult(data.result);
            setIsRefining(false);
            sse.close();
            loadData();
          } else if (data.type === 'job_failed') {
            alert(`Refinement failed: ${data.reason}`);
            setIsRefining(false);
            sse.close();
          }
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };

      sse.onerror = () => {
        setIsRefining(false);
        sse.close();
      };
    } catch (err: any) {
      alert(`Refinement error: ${err.message}`);
      setIsRefining(false);
    }
  }

  function handleCancelRefinement() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsRefining(false);
  }

  function renderSourceIcon(type?: string) {
    switch (type) {
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />;
      case 'pdf':
        return <File className="w-4 h-4 text-red-600" aria-hidden="true" />;
      case 'url':
        return <Globe className="w-4 h-4 text-emerald-600" aria-hidden="true" />;
      default:
        return <BookOpen className="w-4 h-4 text-slate-600" aria-hidden="true" />;
    }
  }

  function renderTable(tableData: TableData) {
    if (!tableData.cells || tableData.cells.length === 0) {
      return <p className="text-xs text-neutral-gray italic">No table cells available.</p>;
    }

    const headerRows = tableData.cells.filter((row) => row.some((cell) => cell.headerScope !== null));
    const bodyRows = headerRows.length > 0 ? tableData.cells.slice(headerRows.length) : tableData.cells;

    return (
      <div className="overflow-x-auto my-4 border-t-2 border-b-2 border-slate-900 py-1">
        <table className="w-full text-left text-xs border-collapse">
          {headerRows.length > 0 && (
            <thead className="border-b border-slate-900 font-bold text-brand-navyPrimary">
              {headerRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <th
                      key={cIdx}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className="px-3 py-2 bg-slate-50 border-b border-slate-300 font-semibold text-slate-900"
                    >
                      {cell.text}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          )}
          <tbody className="divide-y divide-slate-200">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/50">
                {row.map((cell, cIdx) => {
                  const isRowHeader = cell.headerScope === 'row';
                  return isRowHeader ? (
                    <th
                      key={cIdx}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className="px-3 py-2 font-semibold text-slate-900 bg-slate-50/30"
                    >
                      {cell.text}
                    </th>
                  ) : (
                    <td
                      key={cIdx}
                      colSpan={cell.colSpan}
                      rowSpan={cell.rowSpan}
                      className="px-3 py-2 text-slate-800"
                    >
                      {cell.text}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-16 text-center text-sm text-neutral-gray flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-teal-accent" />
        <span>Loading manuscript details...</span>
      </div>
    );
  }

  if (loadError || !manuscript) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-brand-navyPrimary">Manuscript Not Found</h2>
        <p className="text-xs text-neutral-textSecondary">{loadError || 'The requested manuscript does not exist.'}</p>
        <Link
          href="/manuscripts"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-teal-accent text-white hover:bg-teal-hover"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Manuscripts</span>
        </Link>
      </div>
    );
  }

  const allFlags = refinementResult?.flags || completedChunksList.flatMap((c) => c.flags);

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/manuscripts"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-gray hover:text-brand-navyPrimary transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Manuscripts</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-white rounded-2xl border border-surface-borderSubtle shadow-subtle">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-slate-100 border border-slate-200" title={manuscript.sourceType.toUpperCase()}>
                {renderSourceIcon(manuscript.sourceType)}
              </span>
              <h1 className="text-xl font-bold text-brand-navyPrimary tracking-tight">
                {manuscript.title}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-textSecondary">
              <span className={`px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${
                refinementResult || manuscript.status === 'refined'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {refinementResult ? 'Refined' : manuscript.status}
              </span>
              <span>•</span>
              <span>
                <strong>{manuscript.pageCount}</strong> {manuscript.pageCount === 1 ? 'page' : 'pages'}
                <span className="text-[10px] text-neutral-gray ml-1">({manuscript.pageCountConfidence})</span>
              </span>
              <span>•</span>
              <span><strong>{manuscript.wordCount.toLocaleString()}</strong> words</span>
              <span>•</span>
              <span className="capitalize">{manuscript.styleProfile.replace('_', ' ')}</span>
              {manuscript.refinementConsentAt && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Consent Granted</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-wrap items-center gap-2">
            {!refinementResult && !isRefining && (
              <button
                type="button"
                onClick={handleBeginRefinementClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-accent hover:bg-teal-hover text-white shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Begin Refinement</span>
              </button>
            )}

            {refinementResult && (
              <>
                <button
                  type="button"
                  onClick={() => setIsConfigDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-xs transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-refine</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    title="Phase 5"
                  >
                    <span>Begin Validation</span>
                  </button>
                  <FeatureStatus phase={5} label="Scientific Integrity Validation — Phase 5" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    title="Phase 6"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Download DOCX</span>
                  </button>
                  <FeatureStatus phase={6} label="DOCX Export — Phase 6" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Failover Alert Banner */}
      {failoverNotice && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-semibold">{failoverNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFailoverNotice(null)}
            className="text-amber-700 hover:text-amber-900 text-xs font-bold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* LIVE REFINEMENT PROGRESS VIEW */}
      {isRefining && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-md p-6 space-y-6">
          {/* Provider Disclosure Banner */}
          <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-accent"></span>
              </span>
              <span className="text-teal-950">
                Refining via <strong>{currentProvider.toUpperCase()}</strong>. Transparent failover active if model limits are reached.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancelRefinement}
              className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Cancel Refinement
            </button>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-brand-navyPrimary mb-2">
              <span>
                Processing Chunk {currentChunkIndex + 1} of {totalChunks || sections.length}
              </span>
              <span>{Math.round(((completedChunks) / (totalChunks || 1)) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-teal-accent h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.round(((completedChunks) / (totalChunks || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Active Chunk Streaming Viewer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-gray">
                Original Manuscript Chunk #{currentChunkIndex + 1}
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-serif">
                {sections[currentChunkIndex]?.content || 'Parsing chunk text...'}
              </p>
            </div>
            <div className="p-4 bg-teal-50/30 border border-teal-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  AI Refinement Output (Streaming)
                </span>
                <span className="text-[10px] font-mono text-teal-600">Live</span>
              </div>
              <p className="text-xs text-slate-900 leading-relaxed font-serif">
                {streamingDelta ? (
                  <>
                    {streamingDelta}
                    <span className="inline-block w-1.5 h-3 bg-teal-accent ml-0.5 animate-pulse" />
                  </>
                ) : (
                  <span className="italic text-neutral-gray">Waiting for model first token...</span>
                )}
              </p>
            </div>
          </div>

          {/* Completed Chunks Feed */}
          {completedChunksList.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-neutral-textSecondary uppercase tracking-wider">
                Completed Chunks ({completedChunksList.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {completedChunksList.map((c, i) => (
                  <div key={c.chunkId} className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-800">Chunk #{i + 1}</span>
                      <span className="text-neutral-gray text-[11px] truncate max-w-md">
                        {c.refinedText.slice(0, 100)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                        {c.changeLevel} change
                      </span>
                      {c.flags.length > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          {c.flags.length} flag{c.flags.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Tabs & Viewers */}
      {!isRefining && (
        <>
          <div className="flex items-center gap-2 border-b border-surface-borderSubtle px-2">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'content'
                  ? 'border-teal-accent text-teal-accent'
                  : 'border-transparent text-neutral-gray hover:text-brand-navyPrimary'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Decomposed Sections ({sections.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'audit'
                  ? 'border-teal-accent text-teal-accent'
                  : 'border-transparent text-neutral-gray hover:text-brand-navyPrimary'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Operational Audit Trail ({events.length})</span>
            </button>
            {allFlags.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('flags')}
                className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'flags'
                    ? 'border-teal-accent text-teal-accent'
                    : 'border-transparent text-neutral-gray hover:text-brand-navyPrimary'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Refinement Flags ({allFlags.length})</span>
              </button>
            )}
          </div>

          {activeTab === 'content' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Section Hierarchy Tree (4 cols) */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-surface-borderSubtle p-4 shadow-subtle space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-textSecondary">
                    Section Tree
                  </span>
                  <span className="text-[11px] text-neutral-gray">
                    {sections.length} parsed
                  </span>
                </div>

                <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
                  {sections.map((section, idx) => {
                    const isSelected = selectedSection?.id === section.id;
                    const isTable = section.type === 'table' || !!section.tableData;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setSelectedSectionId(section.id)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-teal-50 border border-teal-200 text-teal-900 font-semibold shadow-xs'
                            : 'hover:bg-slate-50 text-neutral-textPrimary border border-transparent'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-neutral-gray mt-0.5">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate flex items-center gap-1.5">
                            {isTable && <TableIcon className="w-3 h-3 text-teal-accent flex-shrink-0" />}
                            <span className="truncate">{section.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-gray">
                            <span className="capitalize px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200">
                              {section.type}
                            </span>
                            <span>{section.charCount} chars</span>
                            {refinementResult && (
                              <span className="ml-auto px-1.5 py-0.2 rounded font-semibold text-[9px] bg-emerald-100 text-emerald-800">
                                Refined
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Section Detail Viewer (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-surface-borderSubtle p-6 shadow-subtle min-h-[500px]">
                {selectedSection ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {selectedSection.type}
                          </span>
                          <span className="text-xs text-neutral-gray font-mono">
                            Section #{selectedSection.orderIndex + 1}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-brand-navyPrimary mt-1">
                          {selectedSection.title}
                        </h2>
                      </div>
                      <span className="text-xs text-neutral-gray">
                        {selectedSection.charCount} characters
                      </span>
                    </div>

                    {/* Structured Table Render or Academic Typography Render */}
                    {selectedSection.tableData ? (
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-brand-navyPrimary">
                          <TableIcon className="w-4 h-4 text-teal-accent" />
                          <span>Structured Scientific Table Data ({selectedSection.tableData.rows} rows × {selectedSection.tableData.columns} cols)</span>
                        </div>
                        {renderTable(selectedSection.tableData)}
                        {selectedSection.content && selectedSection.content.length > 0 && (
                          <p className="mt-3 text-xs text-neutral-gray font-mono">
                            {selectedSection.content}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* If Refinement is completed, show refined output clearly distinguishing original and refined */}
                        {refinementResult ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-teal-50/30 border border-teal-200 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-xs pb-2 border-b border-teal-100">
                                <span className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">
                                  Refined Academic Text
                                </span>
                                <span className="text-[10px] text-teal-700">
                                  Generated via {refinementResult.providerName.toUpperCase()} ({refinementResult.modelUsed})
                                </span>
                              </div>
                              <div className="font-serif text-slate-900 text-sm leading-relaxed whitespace-pre-wrap">
                                {refinementResult.paragraphs.find((p) => p.id.includes(selectedSection.id))?.refinedText ||
                                  selectedSection.content}
                              </div>
                            </div>

                            <details className="text-xs text-neutral-gray border border-slate-200 rounded-xl p-3">
                              <summary className="cursor-pointer font-semibold text-slate-700">
                                View Original Manuscript Prose
                              </summary>
                              <div className="mt-3 pt-3 border-t border-slate-100 font-serif text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedSection.content}
                              </div>
                            </details>
                          </div>
                        ) : (
                          <div className="prose max-w-none">
                            <div className="font-serif text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                              {selectedSection.content}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-neutral-gray">
                    Select a section from the hierarchy tree to inspect its contents.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="bg-white rounded-2xl border border-surface-borderSubtle p-6 shadow-subtle space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Info className="w-4 h-4 text-teal-accent" />
                <h3 className="text-sm font-bold text-brand-navyPrimary">
                  Operational Processing Audit Log
                </h3>
                <span className="text-xs text-neutral-gray ml-auto">
                  Zero manuscript content is recorded in operational logs.
                </span>
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-neutral-gray italic py-4">No events logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((evt) => {
                    const isError = evt.eventSeverity === 'error' || evt.eventSeverity === 'security';
                    return (
                      <div
                        key={evt.id}
                        className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-4 ${
                          isError
                            ? 'bg-red-50/50 border-red-200 text-red-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isError
                                  ? 'bg-red-100 text-red-800 border border-red-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {evt.eventType}
                            </span>
                            <span className="font-mono text-[10px] text-neutral-gray">
                              {new Date(evt.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-mono text-xs">{evt.detail}</p>
                        </div>
                        <span className="text-[10px] font-semibold uppercase text-neutral-gray">
                          {evt.eventSeverity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'flags' && (
            <div className="bg-white rounded-2xl border border-surface-borderSubtle p-6 shadow-subtle space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-brand-navyPrimary">
                  Refinement Flags & Cautionary Notices ({allFlags.length})
                </h3>
              </div>

              <div className="space-y-3">
                {allFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-950 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900">
                        {flag.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-neutral-gray">
                        Section: {flag.location.sectionId}
                      </span>
                    </div>
                    <p className="font-medium">{flag.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* CONSENT MODAL (Section 7 of Prompt 4) */}
      {isConsentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-surface-borderSubtle shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scaleUp">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-accent" />
                <h3 className="text-base font-bold text-brand-navyPrimary">
                  Pre-Refinement Privacy & AI Processing Consent
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConsentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                You are about to initiate academic refinement for:
                <strong className="block mt-1 text-slate-900 font-semibold">{manuscript.title}</strong>
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <p>
                  • Refinement will transmit the full manuscript prose to <strong>{refineProvider.toUpperCase()}</strong> for AI evaluation.
                </p>
                <p>
                  • If {refineProvider.toUpperCase()} becomes unavailable, the system may transparently fail over to secondary providers (OpenAI / Anthropic). Real-time disclosure will be displayed.
                </p>
                <p>
                  • Refined text is saved in local storage. Your original manuscript is strictly immutable and will never be overwritten.
                </p>
                <p>
                  • All numerical measurements, dosages, statistical P-values, and citations are passed with strict preservation instructions.
                </p>
              </div>

              <a
                href={PROVIDER_OPTIONS.find((p) => p.value === refineProvider)?.privacyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-teal-accent hover:text-teal-hover font-semibold text-[11px]"
              >
                <span>Read {refineProvider} enterprise data-retention policy</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAcknowledged}
                  onChange={(e) => setConsentAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-accent focus:ring-teal-accent"
                />
                <span className="text-xs text-slate-800">
                  I understand that my manuscript text will be transmitted to {refineProvider.toUpperCase()} for academic refinement, and I give consent.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConsentModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!consentAcknowledged || isGrantingConsent}
                onClick={handleGrantConsent}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  consentAcknowledged && !isGrantingConsent
                    ? 'bg-teal-accent hover:bg-teal-hover text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                {isGrantingConsent ? 'Recording Consent...' : 'Grant Consent & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFINEMENT CONFIG DRAWER */}
      {isConfigDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 flex flex-col justify-between animate-slideLeft">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-accent" />
                  <h3 className="text-base font-bold text-brand-navyPrimary">
                    Refinement Configuration
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigDrawerOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Style Profile */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Manuscript Style Profile
                  </label>
                  <select
                    value={refineProfile}
                    onChange={(e) => setRefineProfile(e.target.value as ManuscriptStyleProfile)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-accent"
                  >
                    {STYLE_PROFILES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Refinement Intensity */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Transformation Intensity
                  </label>
                  <select
                    value={refineIntensity}
                    onChange={(e) => setRefineIntensity(e.target.value as RefinementIntensity)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-accent"
                  >
                    {INTENSITY_OPTIONS.map((lvl) => (
                      <option key={lvl.value} value={lvl.value}>
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-neutral-gray">
                    {INTENSITY_OPTIONS.find((lvl) => lvl.value === refineIntensity)?.desc}
                  </p>
                </div>

                {/* Primary AI Provider */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Primary AI Model Provider
                  </label>
                  <select
                    value={refineProvider}
                    onChange={(e) => setRefineProvider(e.target.value as AIProviderName)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-accent"
                  >
                    {PROVIDER_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Execution Summary */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">Execution Plan:</span>
                  <p>• Manuscript: {sections.length} parsed sections</p>
                  <p>• Estimated Chunks: ~{Math.max(1, Math.ceil(manuscript.wordCount / 500))}</p>
                  <p>• Word Count: {manuscript.wordCount.toLocaleString()} words</p>
                  <p>• Immutable Entities: Protected inventory instructed</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfigDrawerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartRefinement}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-accent hover:bg-teal-hover text-white shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Refinement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
