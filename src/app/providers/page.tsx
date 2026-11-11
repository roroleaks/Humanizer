'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, Loader2, Info } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { ProviderHealthCard, OrchestrationSummary, ProviderItemData } from '@/components/providers';
import { AIProviderName } from '@/contracts/ai-provider';

interface ProvidersApiResponse {
  providers: ProviderItemData[];
  orchestration: {
    primary: AIProviderName;
    fallbacks: AIProviderName[];
  };
}

export default function ProvidersPage() {
  const [data, setData] = useState<ProvidersApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  async function loadProvidersData() {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load AI providers telemetry', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProvidersData();
  }, []);

  async function handleRefreshHealth() {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch('/api/providers/health-check', { method: 'POST' });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Health check failed');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setRefreshError(err?.message || 'Rate limited or health check failed');
    } finally {
      setIsRefreshing(false);
    }
  }

  const primaryName = data?.orchestration.primary || process.env.NEXT_PUBLIC_SH_AI_PRIMARY_PROVIDER || 'openai';
  const fallbackStr = data?.orchestration.fallbacks?.join(',') || process.env.NEXT_PUBLIC_SH_AI_FALLBACK_PROVIDERS || 'gemini,anthropic';

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Providers"
        subtitle="Manage integrated language model adapters, latency monitoring, failover orchestration, and privacy governance."
        chips={[
          <span
            key="count"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-brand-navyPrimary border border-slate-200"
          >
            4 adapters integrated
          </span>,
          <span
            key="primary"
            className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200"
          >
            Primary: {primaryName}
          </span>,
        ]}
        actions={[
          <button
            key="refresh"
            type="button"
            disabled={isRefreshing}
            onClick={handleRefreshHealth}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-teal-accent text-white hover:bg-teal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-accent transition-all shadow-sm disabled:opacity-50"
          >
            {isRefreshing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>{isRefreshing ? 'Probing...' : 'Refresh Health'}</span>
          </button>,
        ]}
      />

      {/* Privacy Disclosure Banner */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-teal-accent flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Privacy Notice:</strong> During refinement (Phase 4 onward), your manuscript content will be transmitted exclusively to the active provider selected below. No customer manuscript content is ever logged in operational telemetry or used for model training. See <Link href="/help#privacy" className="underline font-bold">Privacy Policy</Link>.
        </div>
      </div>

      {refreshError && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          {refreshError}
        </div>
      )}

      {/* Orchestration Summary Banner */}
      <OrchestrationSummary
        primaryProvider={primaryName}
        fallbackProviders={fallbackStr}
      />

      {/* Provider Health Cards Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-brand-navyPrimary">
            Configured AI Model Adapters
          </h2>
          <p className="text-xs text-neutral-gray mt-0.5">
            Decoupled adapter interfaces adhering to the unified StreamingAIProviderAdapter specification.
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-neutral-gray bg-white rounded-xl border border-slate-200">
            Loading provider telemetry and probing endpoints...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.providers.map((provider) => (
              <ProviderHealthCard
                key={provider.name}
                provider={provider}
                isPrimary={provider.name === primaryName}
              />
            ))}
          </div>
        )}
      </section>

      {/* Privacy & Governance Notice Card */}
      <section className="p-6 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle space-y-3">
        <div className="flex items-center gap-2 text-brand-navyPrimary">
          <ShieldCheck className="w-5 h-5 text-teal-accent" aria-hidden="true" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Third-Party Data Governance & Model Training Prohibition
          </h3>
        </div>

        <p className="text-xs text-neutral-textSecondary leading-relaxed">
          Scientific manuscripts are transmitted strictly to the actively selected AI provider via encrypted server-side route handlers. Under no circumstances are customer manuscripts used to train or fine-tune public foundation models. If a network failover occurs, the platform discloses the switch to the author immediately.
        </p>

        <div className="pt-1">
          <Link
            href="/help#privacy"
            className="text-xs font-semibold text-teal-accent hover:text-teal-hover underline"
          >
            Review Full Scientific Integrity &amp; Privacy Architecture &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
