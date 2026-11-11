'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

interface OrchestrationSummaryProps {
  primaryProvider?: string;
  fallbackProviders?: string;
}

export function OrchestrationSummary({
  primaryProvider = process.env.NEXT_PUBLIC_SH_AI_PRIMARY_PROVIDER || 'openai',
  fallbackProviders = process.env.NEXT_PUBLIC_SH_AI_FALLBACK_PROVIDERS || 'gemini,anthropic',
}: OrchestrationSummaryProps) {
  const fallbacks = fallbackProviders ? fallbackProviders.split(',').map((p) => p.trim()).filter(Boolean) : [];

  return (
    <div className="p-6 rounded-2xl bg-surface-cardBackground border border-surface-borderSubtle shadow-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-brand-navyPrimary flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-teal-accent" aria-hidden="true" />
            <span>AI Orchestration & Failover Pipeline</span>
          </h3>
          <p className="mt-1 text-xs text-neutral-gray">
            Automated resilience routing with timeout limits and exponential backoff retry.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-neutral-gray">
          <ShieldCheck className="w-4 h-4 text-teal-accent flex-shrink-0" aria-hidden="true" />
          <span>Strict zero-training & sanitized telemetry</span>
        </div>
      </div>

      {/* Orchestration Pipeline Flow Visual */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto">
        <div className="flex items-center gap-3 min-w-max text-xs">
          {/* Primary */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 border border-teal-200">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-accent" aria-hidden="true" />
            <div>
              <span className="text-[10px] font-bold text-teal-800 uppercase block">Primary Endpoint</span>
              <span className="font-semibold text-brand-navyPrimary capitalize">{primaryProvider}</span>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />

          {/* Fallbacks */}
          {fallbacks.map((fb, idx) => (
            <React.Fragment key={fb}>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" aria-hidden="true" />
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Fallback {idx + 1}</span>
                  <span className="font-semibold text-brand-navyPrimary capitalize">{fb}</span>
                </div>
              </div>
              {idx < fallbacks.length - 1 && (
                <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-neutral-gray leading-relaxed">
        If the primary provider fails, times out (60,000 ms), or encounters HTTP 429 rate limits after 3 retries, requests automatically cascade to the configured fallback providers without altering instructions or context.
      </div>
    </div>
  );
}
