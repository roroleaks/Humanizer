'use client';

import React, { useState } from 'react';
import { History, Calendar, Filter, ShieldCheck } from 'lucide-react';
import { PageHeader, EmptyState, PrivacyNotice } from '@/components/shared';
import { FeatureStatus } from '@/components/workspace/feature-status';

export default function HistoryPage() {
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Processing History"
        subtitle="Auditable timeline of completed academic refinement runs, model latency, and token consumption metrics."
        chips={[
          <span
            key="runs"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-brand-navyPrimary border border-slate-200"
          >
            0 execution runs
          </span>,
        ]}
      />

      {/* Privacy Guarantee Banner */}
      <PrivacyNotice message="Research Content Protection: Manuscript text and section contents are strictly excluded from audit logs. Only operational metadata (timestamps, provider IDs, model latencies, token counts, and integrity statuses) are recorded." />

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-surface-borderSubtle shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-gray" aria-hidden="true" />
            <label htmlFor="history-date-range-select" className="text-xs text-neutral-gray font-medium">Date Range:</label>
            <select
              id="history-date-range-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-surface-borderDefault rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Provider Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-neutral-gray" aria-hidden="true" />
            <label htmlFor="history-provider-filter" className="text-xs text-neutral-gray font-medium">Provider:</label>
            <select
              id="history-provider-filter"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-surface-borderDefault rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary"
            >
              <option value="all">All Providers</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="openai_compatible">OpenAI Compatible</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="history-status-filter" className="text-xs text-neutral-gray font-medium">Status:</label>
            <select
              id="history-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-surface-borderDefault rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary"
            >
              <option value="all">All Outcomes</option>
              <option value="completed">Completed (PASS)</option>
              <option value="warning">Completed (WARNING)</option>
              <option value="failed">Failed / Aborted</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-neutral-gray">
          Retention window: 30 days
        </div>
      </div>

      {/* Empty State */}
      <EmptyState
        icon={<History className="w-6 h-6" aria-hidden="true" />}
        title="No processing runs yet"
        description="Historical refinement sessions and token telemetry will appear here once manuscripts are processed."
        featureStatus={<FeatureStatus phase={4} label="Telemetry & Audit Logging — Phase 4" />}
      />
    </div>
  );
}
