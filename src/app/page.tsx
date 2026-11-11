'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  File,
  Globe,
  Edit3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FolderOpen,
  Sparkles,
  Layers,
  Search,
  Scale,
  Download,
} from 'lucide-react';
import { EmptyState } from '@/components/shared';
import { FeatureStatus } from '@/components/workspace/feature-status';

const INTAKE_SHORTCUTS = [
  {
    method: 'docx',
    title: 'Word Document (.docx)',
    desc: 'Extract and format headings, tables, references, and OpenXML paragraph styles.',
    icon: FileText,
  },
  {
    method: 'pdf',
    title: 'PDF Manuscript',
    desc: 'Support for digital preprints and scanned papers with automated OCR detection.',
    icon: File,
  },
  {
    method: 'url',
    title: 'Web Article / Preprint URL',
    desc: 'SSRF-protected retrieval for bioRxiv, medRxiv, arXiv, and open-access papers.',
    icon: Globe,
  },
  {
    method: 'paste',
    title: 'Direct Text Paste',
    desc: 'Immediate browser-side drafting with live word counting and page-density estimation.',
    icon: Edit3,
  },
];

const WORKFLOW_STEPS = [
  { step: '01', title: 'Intake & Parse', desc: 'Decomposes structure, checks 15-page limit', icon: Layers },
  { step: '02', title: 'Protected Inventory', desc: 'Catalogs numbers, dosages, citations', icon: ShieldCheck },
  { step: '03', title: 'Academic Refinement', desc: 'Polishes sentence cadence & academic prose', icon: Sparkles },
  { step: '04', title: 'Integrity Validation', desc: 'Independent verification, zero silent drift', icon: Scale },
  { step: '05', title: 'Dual Diff & DOCX', desc: 'Synchronized review & publication export', icon: Download },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      {/* 1. Hero Section */}
      <section className="p-8 md:p-10 rounded-3xl bg-brand-navyDark text-white border border-brand-navyLight/50 shadow-elevated relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-accent/20 text-teal-light border border-teal-accent/40">
            <span className="w-2 h-2 rounded-full bg-teal-accent animate-pulse" aria-hidden="true" />
            <span>Academic Writing Intelligence Platform</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Scientific Clarity. Natural Expression. Research Integrity.
          </h1>

          <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
            Refine scientific manuscripts into fluent, publication-quality English while preserving every numerical value, clinical finding, statistical qualifier, and citation.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4">
            <Link
              href="/new"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-xl bg-teal-accent text-white hover:bg-teal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-accent transition-all shadow-md"
            >
              <span>Start a New Manuscript</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>

            <Link
              href="/help"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-brand-navyLight/60 text-slate-200 hover:text-white hover:bg-brand-navyLight border border-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent transition-all"
            >
              <span>Explore Documentation</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Intake Shortcuts (Four Channels) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-navyPrimary">
              Four Ingestion Channels
            </h2>
            <p className="text-xs text-neutral-gray mt-0.5">
              Select your preferred submission modality (up to 15 pages).
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-neutral-textSecondary">
            Max 15 Pages
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INTAKE_SHORTCUTS.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <div
                key={shortcut.method}
                className="p-5 rounded-2xl bg-white border border-surface-borderSubtle hover:border-teal-accent shadow-subtle hover:shadow-card transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-accent flex items-center justify-center mb-4 group-hover:bg-teal-accent group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-brand-navyPrimary">
                    {shortcut.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-gray leading-relaxed">
                    {shortcut.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <Link
                    href={`/new?method=${shortcut.method}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-accent group-hover:text-teal-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-accent"
                  >
                    <span>Start with this method</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Workflow Diagram */}
      <section className="p-6 md:p-8 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle space-y-6">
        <div>
          <h2 className="text-lg font-bold text-brand-navyPrimary">
            End-to-End Scientific Humanization Pipeline
          </h2>
          <p className="text-xs text-neutral-gray mt-0.5">
            Deterministic five-stage architecture safeguarding scholarly integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {WORKFLOW_STEPS.map((s, idx) => {
            const StepIcon = s.icon;
            return (
              <div
                key={s.step}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-teal-50/40 hover:border-teal-200 transition-colors relative"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
                  <span>STEP {s.step}</span>
                  <StepIcon className="w-4 h-4 text-teal-accent" aria-hidden="true" />
                </div>
                <h3 className="text-xs font-bold text-brand-navyPrimary">
                  {s.title}
                </h3>
                <p className="mt-1 text-[11px] text-neutral-gray leading-normal">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Recent Manuscripts & 5. Scientific Integrity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Manuscripts (Empty State in Phase 1) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-navyPrimary">
              Recent Manuscripts
            </h2>
            <Link
              href="/manuscripts"
              className="text-xs font-semibold text-teal-accent hover:text-teal-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-accent"
            >
              View all
            </Link>
          </div>

          <EmptyState
            icon={<FolderOpen className="w-6 h-6" aria-hidden="true" />}
            title="No manuscripts yet"
            description="You have not uploaded any manuscripts. Ingest your first academic paper to initiate structural analysis and style profiling."
            featureStatus={<FeatureStatus phase={2} label="Manuscript Persistence — Phase 2" />}
            action={
              <Link
                href="/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-teal-accent text-white hover:bg-teal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent shadow-sm"
              >
                <span>Upload First Manuscript</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            }
          />
        </div>

        {/* Scientific Integrity Summary Card */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-bold text-brand-navyPrimary">
            Scientific Integrity Guarantee
          </h2>

          <div className="p-6 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle space-y-4">
            <div className="flex items-center gap-2 text-teal-accent">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-navyPrimary">
                Protected Research Inventory
              </span>
            </div>

            <p className="text-xs text-neutral-textSecondary leading-relaxed">
              Before refinement begins, an immutable inventory catalogs all empirical findings. The system enforces a strict <strong>No Silent Approval</strong> rule:
            </p>

            <ul className="space-y-2 text-xs text-neutral-textSecondary">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-scientific-pass flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Numerical & Statistical Precision:</strong> P-values, 95% CIs, hazard ratios, and sample sizes ($N$) cannot be altered.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-scientific-pass flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Clinical Findings & Dosages:</strong> Medication names, administration units, and trial endpoints are locked.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-scientific-pass flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>Citations & DOIs:</strong> 100% preservation of Vancouver brackets and bibliographic references.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-scientific-pass flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span><strong>No AI Detector Evasion:</strong> Designed for responsible scholarship, never deceptive adversarial rewriting.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link
                href="/help#scientific-integrity"
                className="text-xs font-semibold text-teal-accent hover:text-teal-hover underline underline-offset-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-accent"
              >
                Read full integrity protocol
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
