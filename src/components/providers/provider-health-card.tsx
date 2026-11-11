'use client';

import React from 'react';
import { Cpu, ExternalLink, Activity, Clock, ShieldAlert, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AIProviderName, ProviderHealth } from '@/contracts/ai-provider';
import { CircuitState } from '@/modules/ai-orchestrator/circuit-breaker';
import { cn } from '@/lib/utils';

export interface ProviderItemData {
  name: AIProviderName;
  displayName: string;
  defaultModel: string;
  configured: boolean;
  health: ProviderHealth | null;
  circuitState: CircuitState;
  dataRetentionPolicyUrl?: string;
}

interface ProviderHealthCardProps {
  provider: ProviderItemData;
  isPrimary?: boolean;
}

export function ProviderHealthCard({ provider, isPrimary }: ProviderHealthCardProps) {
  const isHealthy = provider.health?.status === 'healthy';
  const isDegraded = provider.health?.status === 'degraded';
  const isUnavailable = provider.health?.status === 'unavailable' || !provider.health;
  const isCircuitOpen = provider.circuitState === 'OPEN';

  return (
    <div className="p-5 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-brand-navyLight flex-shrink-0">
              <Cpu className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-navyPrimary flex items-center gap-2">
                <span>{provider.displayName}</span>
                {isPrimary && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    PRIMARY
                  </span>
                )}
              </h4>
              <p className="text-xs font-mono text-neutral-gray">
                Model: {provider.defaultModel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isCircuitOpen ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                Circuit Open
              </span>
            ) : provider.configured ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                Configured
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                Not Configured
              </span>
            )}
          </div>
        </div>

        {/* Configuration Notice if Missing Key */}
        {!provider.configured && (
          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-neutral-gray">
            No API key configured — add credentials to <code className="text-[11px] font-mono bg-white px-1 py-0.5 rounded border border-slate-200">.env.local</code> to enable.
          </div>
        )}

        {isCircuitOpen && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>Circuit open — temporarily skipped in failover chain.</span>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] text-neutral-gray block">Health Status</span>
            <div className="flex items-center gap-1.5 font-medium">
              {isHealthy ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" aria-hidden="true" />
                  <span className="text-emerald-700 font-semibold">Healthy</span>
                </>
              ) : isDegraded ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" aria-hidden="true" />
                  <span className="text-amber-700 font-semibold">Degraded</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" aria-hidden="true" />
                  <span className="text-slate-600">Unavailable</span>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] text-neutral-gray block">Roundtrip Latency</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Activity className="w-3.5 h-3.5 text-teal-accent" aria-hidden="true" />
              <span>{provider.health?.latencyMs !== undefined ? `${provider.health.latencyMs} ms` : '-- ms'}</span>
            </div>
          </div>
        </div>

        {provider.health?.notes && (
          <p className="mt-2 text-[11px] text-neutral-gray font-mono truncate" title={provider.health.notes}>
            {provider.health.notes}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-neutral-gray">
        {provider.dataRetentionPolicyUrl ? (
          <a
            href={provider.dataRetentionPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-teal-accent hover:text-teal-hover underline underline-offset-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-accent"
          >
            <span>Data Retention Policy</span>
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" aria-hidden="true" />
          <span>
            {provider.health?.lastCheckedAt
              ? new Date(provider.health.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : 'Not probed'}
          </span>
        </div>
      </div>
    </div>
  );
}
