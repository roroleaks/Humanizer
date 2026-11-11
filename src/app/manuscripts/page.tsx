'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, Files, FileText, Globe, File, ArrowRight, Clock, BookOpen } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/shared';

interface ManuscriptItem {
  id: string;
  title: string;
  status: string;
  sourceType: 'docx' | 'pdf' | 'url' | 'text';
  pageCount: number;
  pageCountConfidence: 'verified' | 'estimated';
  wordCount: number;
  ocrUsed: boolean;
  styleProfile: string;
  createdAt: string;
  updatedAt: string;
}

export default function ManuscriptsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');
  const [manuscripts, setManuscripts] = useState<ManuscriptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadManuscripts() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (searchTerm.trim()) params.set('search', searchTerm.trim());
        if (sortOrder) params.set('sort', sortOrder);

        const res = await fetch(`/api/manuscripts?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setManuscripts(data.manuscripts || []);
        }
      } catch (err) {
        console.error('Failed to load manuscripts', err);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(loadManuscripts, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, sortOrder]);

  function renderSourceIcon(sourceType: string) {
    switch (sourceType) {
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

  function renderRefinementStatusBadge(status: string) {
    switch (status) {
      case 'refined':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Refined
          </span>
        );
      case 'refining':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Refining...</span>
          </span>
        );
      case 'refinement_failed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
            Refinement failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Not refined
          </span>
        );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Manuscripts"
        subtitle="Manage ingested manuscripts, review active refinement drafts, and inspect validation reports."
        chips={[
          <span
            key="count"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-brand-navyPrimary border border-slate-200"
          >
            {manuscripts.length} {manuscripts.length === 1 ? 'manuscript' : 'manuscripts'}
          </span>,
        ]}
        actions={[
          <Link
            key="new"
            href="/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-teal-accent text-white hover:bg-teal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-accent transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>New Manuscript</span>
          </Link>,
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-surface-borderSubtle shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-gray">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or source..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-surface-borderDefault rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary placeholder:text-neutral-gray"
            aria-label="Search manuscripts"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-neutral-gray" aria-hidden="true" />
            <label htmlFor="manuscript-status-filter" className="text-xs text-neutral-gray font-medium">Status:</label>
            <select
              id="manuscript-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-surface-borderDefault rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary"
            >
              <option value="all">All Statuses</option>
              <option value="parsed">Parsed</option>
              <option value="refining">Refining</option>
              <option value="ready">Ready</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="manuscript-sort-select" className="text-xs text-neutral-gray font-medium">Sort:</label>
            <select
              id="manuscript-sort-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-surface-borderDefault rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary"
            >
              <option value="recent">Most Recent</option>
              <option value="title">Manuscript Title</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Manuscript Content Listing */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-neutral-gray bg-white rounded-xl border border-slate-200">
          Loading manuscripts...
        </div>
      ) : manuscripts.length === 0 ? (
        <EmptyState
          icon={<Files className="w-6 h-6" aria-hidden="true" />}
          title="No manuscripts found"
          description={searchTerm || statusFilter !== 'all' ? 'Try adjusting your search filters.' : 'Ingest an academic paper via Word DOCX, PDF, URL, or direct text paste to populate your workspace.'}
          action={
            <Link
              href="/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-teal-accent text-white hover:bg-teal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent shadow-sm"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Ingest First Manuscript</span>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {manuscripts.map((item) => (
            <Link
              key={item.id}
              href={`/manuscripts/${item.id}`}
              className="block p-5 bg-white rounded-xl border border-surface-borderSubtle hover:border-teal-accent/50 hover:shadow-subtle transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-100 border border-slate-200" title={item.sourceType.toUpperCase()}>
                      {renderSourceIcon(item.sourceType)}
                    </span>
                    <h3 className="text-sm font-bold text-brand-navyPrimary group-hover:text-teal-accent transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-textSecondary">
                    <span className="flex items-center gap-1">
                      <strong>{item.pageCount}</strong> {item.pageCount === 1 ? 'page' : 'pages'}
                      <span className="text-[10px] text-neutral-gray">({item.pageCountConfidence})</span>
                    </span>
                    <span>•</span>
                    <span><strong>{item.wordCount.toLocaleString()}</strong> words</span>
                    <span>•</span>
                    <span className="capitalize">{item.styleProfile.replace('_', ' ')}</span>
                    {item.ocrUsed && (
                      <>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          OCR Applied
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1 text-neutral-gray">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {renderRefinementStatusBadge(item.status)}
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-teal-accent group-hover:bg-teal-50 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
