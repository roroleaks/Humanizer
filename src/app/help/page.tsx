'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  BookOpen,
  HelpCircle,
  AlertTriangle,
  Lock,
  Layers,
  Scale,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/shared';

const TOC_LINKS = [
  { id: 'what-is-scientific-humanizer', label: '1. What is Scientific Humanizer?' },
  { id: 'how-it-works', label: '2. How the Pipeline Works' },
  { id: 'scientific-integrity', label: '3. Scientific Integrity & Protected Inventory' },
  { id: 'privacy', label: '4. Privacy, Telemetry & Provider Disclosure' },
  { id: 'citations-and-references', label: '5. Citations & Vancouver/APA Preservation' },
  { id: 'page-count', label: '6. Page-Count Estimation & The 15-Page Rule' },
  { id: 'supported-manuscript-types', label: '7. Supported Manuscript Style Profiles' },
  { id: 'faq', label: '8. Frequently Asked Questions (FAQ)' },
  { id: 'troubleshooting', label: '9. Troubleshooting & System Codes' },
];

export default function HelpPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        title="Help & Academic Documentation"
        subtitle="Comprehensive guide to scientific integrity protocols, research confidentiality, and the six-stage humanization pipeline."
        chips={[
          <span
            key="guide"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200"
          >
            Authoritative Guide
          </span>,
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Table of Contents Sticky Sidebar */}
        <aside aria-label="Table of contents" className="lg:col-span-4 sticky top-24 space-y-3 p-5 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-navyPrimary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-accent" aria-hidden="true" />
            <span>Table of Contents</span>
          </h2>
          <nav aria-label="Help document sections" className="space-y-1">
            {TOC_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="block px-2.5 py-1.5 text-xs text-neutral-textSecondary hover:text-brand-navyPrimary hover:bg-slate-50 rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Documentation Body */}
        <div className="lg:col-span-8 space-y-12">
          {/* 1. What is Scientific Humanizer? */}
          <section id="what-is-scientific-humanizer" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-brand-navyPrimary flex items-center gap-2">
              <span className="text-teal-accent">01.</span> What is Scientific Humanizer?
            </h2>
            <div className="text-sm text-neutral-textSecondary space-y-3 leading-relaxed">
              <p>
                <strong>Scientific Humanizer</strong> is an academic writing intelligence platform built exclusively for researchers, clinicians, peer reviewers, and scholarly authors. Unlike generic AI paraphrasing tools that generate robotic, formulaic sentences or introduce dangerous factual hallucinations, Scientific Humanizer elevates sentence rhythm, lexical diversity, and paragraph cohesion while strictly safeguarding empirical findings.
              </p>
              <p>
                The platform operates on a single core principle: <em>Scientific expression can be polished without altering the author&apos;s intended research meaning.</em>
              </p>
            </div>
          </section>

          {/* 2. How the Pipeline Works */}
          <section id="how-it-works" className="space-y-3 scroll-mt-24 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-brand-navyPrimary flex items-center gap-2">
              <span className="text-teal-accent">02.</span> How the Pipeline Works
            </h2>
            <div className="text-sm text-neutral-textSecondary space-y-3 leading-relaxed">
              <p>
                Every manuscript undergoes a deterministic six-stage lifecycle designed to eliminate model hallucination and preserve methodological fidelity:
              </p>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li><strong>Intake & Decomposition:</strong> Ingests DOCX, PDF, URL, or text, extracting headings, tables, and paragraph coordinates while enforcing the 15-page limit.</li>
                <li><strong>Protected Inventory Compilation:</strong> Prior to any rewriting, an immutable baseline catalogs numbers, dosages, P-values, populations, and citations.</li>
                <li><strong>Rhythm & Style Profiling:</strong> Evaluates sentence length variation, Academic Word List (AWL) density, and formulaic transition redundancy.</li>
                <li><strong>Contextual Refinement:</strong> Dispatches section chunks to decoupled AI provider adapters with explicit boundary instructions.</li>
                <li><strong>Independent Validation:</strong> An isolated integrity validator compares revisions against the protected inventory.</li>
                <li><strong>Dual Diff Review & DOCX Export:</strong> Authors inspect changes side-by-side before exporting a publication-ready Word manuscript.</li>
              </ol>
            </div>
          </section>

          {/* 3. Scientific Integrity & Protected Inventory */}
          <section id="scientific-integrity" className="space-y-3 scroll-mt-24 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-brand-navyPrimary flex items-center gap-2">
              <span className="text-teal-accent">03.</span> Scientific Integrity & Protected Inventory
            </h2>
            <div className="text-sm text-neutral-textSecondary space-y-3 leading-relaxed">
              <p>
                In biomedical research and clinical science, minor textual alterations can carry life-threatening or defamatory consequences. The platform extracts and defends 15 protected item categories:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="font-semibold text-brand-navyPrimary">Protected Item Categories:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>• Scientific & Medical Terminology</div>
                  <div>• Medication Names & Dosages</div>
                  <div>• Numerical Values & Laboratory Units</div>
                  <div>• Statistical Tests, P-values & 95% CIs</div>
                  <div>• Study Cohort Sizes & Demographics</div>
                  <div>• Clinical Outcomes & Adverse Events</div>
                  <div>• Vancouver & APA Citation Brackets</div>
                  <div>• Full Bibliographic Reference Entries</div>
                </div>
              </div>
              <p>
                <strong>The No Silent Approval Rule:</strong> When a revision introduces an unexplained numerical discrepancy or alters a clinical outcome, the system assigns a <code>FAIL</code> rating, halting automated one-click export and requiring explicit author confirmation.
              </p>
            </div>
          </section>

          {/* 4. Privacy, Telemetry & Provider Disclosure */}
          <section id="privacy" className="space-y-3 scroll-mt-24 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-brand-navyPrimary flex items-center gap-2">
              <span className="text-teal-accent">04.</span> Privacy, Telemetry & Provider Disclosure
            </h2>
            <div className="text-sm text-neutral-textSecondary space-y-3 leading-relaxed">
              <p>
                Scientific manuscripts contain sensitive, unpublished intellectual property. In Phase 3, we support four enterprise-grade model providers:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>• <strong>OpenAI Enterprise:</strong> GPT-4o</div>
                <div>• <strong>Google Gemini:</strong> Gemini 1.5 Pro</div>
                <div>• <strong>Anthropic Claude:</strong> Claude 3.5 Sonnet</div>
                <div>• <strong>OpenAI-Compatible:</strong> Self-hosted proxy / vLLM</div>
              </div>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li><strong>No Model Training:</strong> All provider adapters connect to enterprise endpoints governed by commercial terms prohibiting customer manuscript data from being utilized for model training.</li>
                <li><strong>Zero Manuscript Logging:</strong> Application logs, error drains, and telemetry platforms strictly record timestamps, model latency, and token volumes—manuscript text is never logged or reflected in operational logs.</li>
                <li><strong>Selective Transmission During Refinement:</strong> Manuscript text is transmitted strictly to the active selected provider during refinement (Phase 4 onward). Intake and parsing execute entirely locally.</li>
                <li><strong>Transparent Failover Disclosure:</strong> You are always informed which AI provider processed your manuscript. If a network failover occurs due to rate limits or timeouts, the secondary provider is visibly disclosed in the UI.</li>
              </ul>

              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navyPrimary">What happens during refinement</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-neutral-textSecondary pl-1">
                  <li>The full manuscript text is sent to the selected AI provider via secure API connections.</li>
                  <li>The provider&apos;s commercial data-retention policy applies to the text while it is processed by them.</li>
                  <li>Refined text is stored on this server alongside the original; the original manuscript remains strictly immutable and is never modified.</li>
                  <li>Numerical values, clinical endpoints, dosages, citations, and references are instructed to be preserved; Phase 5 automated validation verifies this.</li>
                  <li>Provider switching and failovers are visibly disclosed in real time.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. Citations & Vancouver/APA Preservation */}
          <section id="citations-and-references" className="space-y-3 scroll-mt-24 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-brand-navyPrimary flex items-center gap-2">
              <span className="text-teal-accent">05.</span> Citations & Vancouver/APA Preservation
            </h2>
            <div className="text-sm text-neutral-textSecondary space-y-3 leading-relaxed">
              <p>
                The platform recognizes and preserves standard citation mechanisms:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>Numeric brackets (e.g., <code>[1]</code>, <code>[1-3]</code>, <code>[4, 7]</code>)</li>
                <li>Superscript numeric markers (e.g., <sup>12</sup>, <sup>14-16</sup>)</li>
                <li>Author-date in-text markers (e.g., <code>(Smith et al., 2021)</code>)</li>
              </ul>
              <p>
                Under no circumstances will the platform invent or hallucinate citations. 100% of the author&apos;s original references are preserved in sequence with verified DOIs.
              </p>
            </div>
          </section>

          {/* 6. Page-Count Estimation & The 15-Page Rule */}
          <section id="page-count" className="space-y-3 scroll-mt-24 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-brand-navyPrimary flex items-center gap-2">
              <span className="text-teal-accent">06.</span> Page-Count Estimation & The 15-Page Rule
            </h2>
            <div className="text-sm text-neutral-textSecondary space-y-3 leading-relaxed">
              <p>
                To maintain high refinement precision and avoid token window exhaustion, manuscripts are strictly capped at <strong>15 pages</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>PDF:</strong> Evaluates physical page count (<code>numPages</code>). Scanned PDFs are flagged for OCR.</li>
                <li><strong>DOCX:</strong> Evaluates OpenXML page metadata, or divides word count by 500 words/page.</li>
                <li><strong>URL & Pasted Text:</strong> Evaluated client-side and server-side using the configurable density baseline (default 500 words/page).</li>
                <li><strong>Auto-Dense Mode:</strong> When section parsing detects heavy table structures, the density is automatically adjusted to 400 words/page.</li>
              </ul>
            </div>
          </section>

          {/* 7. Supported Manuscript Style Profiles */}
          <section id="supported-manuscript-types" className="space-y-3 scroll-mt-24 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-brand-navyPrimary flex items-center gap-2">
              <span className="text-teal-accent">07.</span> Supported Manuscript Style Profiles
            </h2>
            <div className="text-sm text-neutral-textSecondary space-y-2 leading-relaxed">
              <p>The platform supports 7 specialized academic writing genres:</p>
              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-brand-navyPrimary block">1. Original Research (IMRAD)</span>
                  <span className="text-xs text-neutral-gray">Standard clinical trials, prospective cohorts, and laboratory investigations.</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-brand-navyPrimary block">2. Systematic Review & PRISMA</span>
                  <span className="text-xs text-neutral-gray">Exhaustive literature reviews with systematic inclusion criteria and risk of bias matrices.</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-brand-navyPrimary block">3. Meta-Analysis</span>
                  <span className="text-xs text-neutral-gray">Quantitative pooled statistical syntheses, forest plots, and heterogeneity metrics.</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-brand-navyPrimary block">4. Narrative Review</span>
                  <span className="text-xs text-neutral-gray">Broad pedagogical reviews synthesizing pathophysiological mechanisms and therapeutic landscapes.</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-brand-navyPrimary block">5. Clinical Commentary & Editorial</span>
                  <span className="text-xs text-neutral-gray">Scholarly opinion pieces, guideline critiques, and expert perspectives.</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-brand-navyPrimary block">6. Clinical Case Report</span>
                  <span className="text-xs text-neutral-gray">Individual patient histories, rare diagnostic findings, and therapeutic challenges.</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-brand-navyPrimary block">7. Research Letter / Brief Communication</span>
                  <span className="text-xs text-neutral-gray">Concise, high-impact empirical announcements and pilot study data.</span>
                </div>
              </div>
            </div>
          </section>

          {/* 8. Frequently Asked Questions (FAQ) */}
          <section id="faq" className="space-y-3 scroll-mt-24 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-brand-navyPrimary flex items-center gap-2">
              <span className="text-teal-accent">08.</span> Frequently Asked Questions (FAQ)
            </h2>
            <div className="space-y-3 text-sm text-neutral-textSecondary">
              <div className="p-4 rounded-xl bg-white border border-surface-borderSubtle">
                <h3 className="font-bold text-brand-navyPrimary">Does Scientific Humanizer bypass AI detectors?</h3>
                <p className="mt-1 text-xs text-neutral-gray leading-relaxed">
                  No. Scientific Humanizer explicitly rejects adversarial evasion techniques. Its objective is authentic academic clarity, natural sentence construction, and impeccable research integrity.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-surface-borderSubtle">
                <h3 className="font-bold text-brand-navyPrimary">Can I process papers longer than 15 pages?</h3>
                <p className="mt-1 text-xs text-neutral-gray leading-relaxed">
                  The initial release enforces a strict 15-page limit per submission to guarantee deep context retention and prevent LLM attention drift. Longer monographs can be processed section-by-section.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-surface-borderSubtle">
                <h3 className="font-bold text-brand-navyPrimary">What output formats can I download?</h3>
                <p className="mt-1 text-xs text-neutral-gray leading-relaxed">
                  The primary export format is Microsoft Word (.docx), fully styled with preserved headings, reference lists, tables, and figure captions ready for journal submission.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Troubleshooting & System Codes */}
          <section id="troubleshooting" className="space-y-3 scroll-mt-24 pt-6 border-t border-slate-200">
            <h2 className="text-xl font-bold text-brand-navyPrimary flex items-center gap-2">
              <span className="text-teal-accent">09.</span> Troubleshooting & System Codes
            </h2>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-brand-navyPrimary font-mono">ERR_PAGE_LIMIT_EXCEEDED</span>
                <p className="text-neutral-gray mt-0.5">The uploaded document exceeds 15 physical pages or 7,500 words. Please trim supplementary tables or submit chapters individually.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-brand-navyPrimary font-mono">ERR_SSRF_BLOCKED_DESTINATION</span>
                <p className="text-neutral-gray mt-0.5">The specified URL resolves to an internal RFC 1918 private network or loopback address. Only public web destinations are accessible.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-brand-navyPrimary font-mono">ERR_SCANNED_PDF_OCR_REQUIRED</span>
                <p className="text-neutral-gray mt-0.5">The uploaded PDF contains rasterized scanned images with negligible extractable text. Enable OCR preprocessing to continue.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
