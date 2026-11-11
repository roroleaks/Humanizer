'use client';

import React, { useState, useEffect } from 'react';
import { Save, Trash2, Sliders, Database, Bell, Shield, AlertTriangle, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { FeatureStatus } from '@/components/workspace/feature-status';
import { ManuscriptStyleProfile } from '@/contracts/refinement';
import { AIProviderName } from '@/contracts/ai-provider';

interface LocalSettings {
  defaultStyleProfile: ManuscriptStyleProfile;
  defaultPrimaryProvider: AIProviderName;
  wordDensity: number;
  autoDenseMode: boolean;
  retentionDays: number;
  notifyOnProviderSwitch: boolean;
  showIntegrityWarningsInline: boolean;
}

const DEFAULT_SETTINGS: LocalSettings = {
  defaultStyleProfile: 'original_research',
  defaultPrimaryProvider: 'openai',
  wordDensity: 500,
  autoDenseMode: true,
  retentionDays: 30,
  notifyOnProviderSwitch: true,
  showIntegrityWarningsInline: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS);
  const [savedNotification, setSavedNotification] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sh_user_settings');
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // Fallback to defaults
    }
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem('sh_user_settings', JSON.stringify(settings));
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 3000);
    } catch {
      // Ignore
    }
  }

  function handleDeleteAllManuscripts() {
    try {
      localStorage.removeItem('sh_user_settings');
      localStorage.removeItem('sh_recent_manuscripts');
      setSettings(DEFAULT_SETTINGS);
      setShowDeleteModal(false);
      setDeleteConfirmation('');
      alert('All locally stored manuscript session records and cached preferences have been permanently cleared.');
    } catch {
      // Ignore
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Settings & Preferences"
        subtitle="Configure manuscript defaults, word-density estimation algorithms, retention periods, and disclosure notifications."
        chips={[
          <span
            key="storage"
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-brand-navyPrimary border border-slate-200"
          >
            Client Storage (localStorage)
          </span>,
        ]}
      />

      {savedNotification && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-scientific-pass flex-shrink-0" aria-hidden="true" />
          <span>Preferences successfully saved to local browser storage.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Group 1: Manuscript Defaults */}
        <section className="p-6 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-brand-navyPrimary flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-accent" aria-hidden="true" />
                <span>Manuscript Processing Defaults</span>
              </h2>
              <p className="text-xs text-neutral-gray mt-0.5">
                Default style profile and primary AI adapter applied to newly ingested manuscripts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="settings-default-profile" className="block text-xs font-semibold text-neutral-textSecondary mb-1.5">
                Default Style Profile
              </label>
              <select
                id="settings-default-profile"
                value={settings.defaultStyleProfile}
                onChange={(e) => setSettings({ ...settings, defaultStyleProfile: e.target.value as ManuscriptStyleProfile })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-surface-borderDefault rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary"
              >
                <option value="original_research">Original Research (IMRAD)</option>
                <option value="systematic_review">Systematic Review / PRISMA</option>
                <option value="meta_analysis">Meta-Analysis</option>
                <option value="narrative_review">Narrative Review</option>
                <option value="clinical_commentary">Clinical Commentary</option>
                <option value="case_report">Clinical Case Report</option>
                <option value="research_letter">Research Letter</option>
              </select>
            </div>

            <div>
              <label htmlFor="settings-default-provider" className="block text-xs font-semibold text-neutral-textSecondary mb-1.5">
                Default Primary Provider
              </label>
              <select
                id="settings-default-provider"
                value={settings.defaultPrimaryProvider}
                onChange={(e) => setSettings({ ...settings, defaultPrimaryProvider: e.target.value as AIProviderName })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-surface-borderDefault rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary"
              >
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="gemini">Google Gemini (1.5 Pro)</option>
                <option value="anthropic">Anthropic Claude (3.5 Sonnet)</option>
                <option value="openai_compatible">OpenAI-Compatible Custom Endpoint</option>
              </select>
              <p className="mt-1 text-[11px] text-neutral-gray">
                Runtime provider failover order is configured server-side via environment variables until Phase 9.
              </p>
            </div>
          </div>
        </section>

        {/* Group 1b: AI Provider Credentials (Read-Only Status) */}
        <section className="p-6 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-brand-navyPrimary flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-accent" aria-hidden="true" />
                <span>AI Provider Credentials (Server-Managed)</span>
              </h2>
              <p className="text-xs text-neutral-gray mt-0.5">
                Credentials are read from server-side environment variables. Bring-your-own-key (BYOK) arrives in Phase 9.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              ENV MANAGED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-navyPrimary">OpenAI Enterprise</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                  SH_AI_OPENAI_API_KEY
                </span>
              </div>
              <p className="text-[11px] text-neutral-gray">Default Model: gpt-4o</p>
              <a href="https://openai.com/enterprise-privacy" target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal-accent hover:underline block pt-1">
                Data Retention Policy &rarr;
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-navyPrimary">Google Gemini</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                  SH_AI_GEMINI_API_KEY
                </span>
              </div>
              <p className="text-[11px] text-neutral-gray">Default Model: gemini-1.5-pro</p>
              <a href="https://cloud.google.com/terms/data-retention" target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal-accent hover:underline block pt-1">
                Data Retention Policy &rarr;
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-navyPrimary">Anthropic Claude</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                  SH_AI_ANTHROPIC_API_KEY
                </span>
              </div>
              <p className="text-[11px] text-neutral-gray">Default Model: claude-3-5-sonnet-latest</p>
              <a href="https://www.anthropic.com/prioritizing-privacy" target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal-accent hover:underline block pt-1">
                Data Retention Policy &rarr;
              </a>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-navyPrimary">OpenAI-Compatible</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                  SH_AI_OPENAI_COMPATIBLE_BASE_URL
                </span>
              </div>
              <p className="text-[11px] text-neutral-gray">Custom self-hosted / proxy model</p>
              <span className="text-[11px] text-neutral-gray block pt-1">Custom self-hosted policy</span>
            </div>
          </div>
        </section>

        {/* Group 2: Page-Count Estimation & Word Density */}
        <section className="p-6 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-brand-navyPrimary flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-accent" aria-hidden="true" />
                <span>Page-Count Density Calibration</span>
              </h2>
              <p className="text-xs text-neutral-gray mt-0.5">
                Control the baseline word density used to calculate estimated page counts for URL articles and pasted text.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
              Resolved in Prompt 1
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="settings-density-slider" className="font-semibold text-neutral-textSecondary">
                  Standard Word Density Baseline: <span className="text-teal-accent font-bold">{settings.wordDensity} words/page</span>
                </label>
                <span className="text-neutral-gray text-[11px]">(Allowed range: 350 - 600)</span>
              </div>
              <input
                type="range"
                id="settings-density-slider"
                min={350}
                max={600}
                step={25}
                value={settings.wordDensity}
                onChange={(e) => setSettings({ ...settings, wordDensity: parseInt(e.target.value, 10) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-accent"
              />
              <div className="flex justify-between text-[10px] text-neutral-gray mt-1">
                <span>350 (Dense tabular / math)</span>
                <span>500 (Standard Academic Default)</span>
                <span>600 (Loose commentary)</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoDenseMode}
                  onChange={(e) => setSettings({ ...settings, autoDenseMode: e.target.checked })}
                  className="rounded text-teal-accent focus:ring-teal-accent w-4 h-4 mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-semibold text-neutral-textPrimary block">
                    Auto-Dense Table Adjustment (Recommended)
                  </span>
                  <span className="text-neutral-gray text-[11px] leading-relaxed block mt-0.5">
                    Automatically reduces effective density to <strong>400 words per page</strong> when section parsing detects high tabular cell counts or dense mathematical formulas.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* Group 3: Data Retention & Purge Policy */}
        <section className="p-6 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-brand-navyPrimary flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-accent" aria-hidden="true" />
                <span>Retention & Storage Governance</span>
              </h2>
              <p className="text-xs text-neutral-gray mt-0.5">
                Configure automatic purge schedules for inactive manuscripts and review artifacts.
              </p>
            </div>
            <FeatureStatus phase={3} label="Database Retention Daemon — Phase 3" />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="settings-retention-input" className="block text-xs font-semibold text-neutral-textSecondary mb-1.5">
                Manuscript Retention Window (Days)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  id="settings-retention-input"
                  min={1}
                  max={365}
                  value={settings.retentionDays}
                  onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value, 10) || 30 })}
                  className="w-32 px-3 py-2 text-xs bg-slate-50 border border-surface-borderDefault rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary"
                />
                <span className="text-xs text-neutral-gray">
                  Days after ingestion before drafts and inventories are automatically purged.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-scientific-fail block">
                  Hard Purge Local Data
                </span>
                <span className="text-[11px] text-neutral-gray">
                  Immediately unlinks and deletes all locally cached manuscript sessions and preferences.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-scientific-fail hover:bg-red-100 border border-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-scientific-fail transition-colors"
              >
                Delete All Manuscripts
              </button>
            </div>
          </div>
        </section>

        {/* Group 4: Transparency & Inline Integrity Warnings */}
        <section className="p-6 rounded-2xl bg-white border border-surface-borderSubtle shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-brand-navyPrimary flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-accent" aria-hidden="true" />
                <span>Transparency & Disclosure Notifications</span>
              </h2>
              <p className="text-xs text-neutral-gray mt-0.5">
                Configure notifications regarding provider switches and validation discrepancy banners.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyOnProviderSwitch}
                onChange={(e) => setSettings({ ...settings, notifyOnProviderSwitch: e.target.checked })}
                className="rounded text-teal-accent focus:ring-teal-accent w-4 h-4 mt-0.5"
              />
              <div className="text-xs">
                <span className="font-semibold text-neutral-textPrimary block">
                  Notify me when a fallback AI provider is utilized
                </span>
                <span className="text-neutral-gray text-[11px] leading-relaxed block mt-0.5">
                  Displays an explicit alert in the review panel indicating which secondary provider processed your manuscript chunk during a network failover.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showIntegrityWarningsInline}
                onChange={(e) => setSettings({ ...settings, showIntegrityWarningsInline: e.target.checked })}
                className="rounded text-teal-accent focus:ring-teal-accent w-4 h-4 mt-0.5"
              />
              <div className="text-xs">
                <span className="font-semibold text-neutral-textPrimary block">
                  Show scientific integrity warnings inline in dual-panel diff view
                </span>
                <span className="text-neutral-gray text-[11px] leading-relaxed block mt-0.5">
                  Highlights paragraphs containing detected numerical, statistical, or dosage discrepancies directly within the text editor.
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* Group 5: Experimental Features (Disabled) */}
        <section className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200 shadow-subtle space-y-4 opacity-75">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span>Experimental & Future Modules</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Advanced capabilities scheduled for subsequent delivery phases.
              </p>
            </div>
            <FeatureStatus phase={7} label="Future Phase Features" />
          </div>

          <div className="space-y-3 text-xs text-slate-500">
            <div className="flex items-center justify-between p-2 rounded bg-white/70 border border-slate-200">
              <span>Cloud OCR Adaptive Fallback (Google Cloud Vision)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                Phase 9 Stretch Goal
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/70 border border-slate-200">
              <span>Automated LaTeX Math Formula Normalization</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                Phase 7
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/70 border border-slate-200">
              <span>Multi-Tenant Lab Workspace Collaboration</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                Phase 8
              </span>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-teal-accent text-white hover:bg-teal-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-accent shadow-md transition-all"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            <span>Save Preferences (localStorage)</span>
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-red-200 animate-in fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-scientific-fail mb-3">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>

            <h4 id="delete-modal-title" className="text-lg font-bold text-brand-navyPrimary">
              Permanently Clear Local Manuscripts?
            </h4>

            <p className="mt-2 text-xs text-neutral-textSecondary leading-relaxed">
              This action will reset your browser localStorage and purge any cached manuscript sessions. This action is irreversible.
            </p>

            <div className="mt-4">
              <label htmlFor="delete-confirm-input" className="block text-xs font-semibold text-slate-600 mb-1">
                Type <strong>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                id="delete-confirm-input"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-scientific-fail"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmation !== 'DELETE'}
                onClick={handleDeleteAllManuscripts}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-scientific-fail text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
