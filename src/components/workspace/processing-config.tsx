'use client';

import React, { useState } from 'react';
import { Lock, Shield, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { ManuscriptStyleProfile, RefinementIntensity } from '@/contracts/refinement';
import { AIProviderName } from '@/contracts/ai-provider';

export interface ProcessingConfigValues {
  styleProfile: ManuscriptStyleProfile;
  intensity: RefinementIntensity;
  primaryProvider: AIProviderName;
}

interface ProcessingConfigProps {
  defaultStyleProfile?: ManuscriptStyleProfile;
  defaultIntensity?: RefinementIntensity;
  defaultPrimaryProvider?: AIProviderName;
  isReadyToProcess: boolean;
  isProcessing?: boolean;
  estimatedPages?: number;
  onConfigChange?: (values: ProcessingConfigValues) => void;
  onProcess?: (values: ProcessingConfigValues) => void;
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

const INTENSITY_LEVELS: { value: RefinementIntensity; label: string; desc: string }[] = [
  { value: 'conservative', label: 'Conservative (Light Polish)', desc: 'Grammar and phrasing polish; preserves 80-90% sentence structure (~10-20% touched)' },
  { value: 'standard', label: 'Standard (Editorial Refinement)', desc: 'Improves flow, rhythm, and vocabulary precision (~40-60% touched)' },
  { value: 'high_impact', label: 'High-Impact (Natural Fluency)', desc: 'Substantial structural transformation for natural academic cadence (~70-90% touched)' },
];

const AI_PROVIDERS: { value: AIProviderName; label: string; defaultModel: string }[] = [
  { value: 'gemini', label: 'Google Gemini (1.5 Pro)', defaultModel: 'gemini-1.5-pro' },
  { value: 'openai', label: 'OpenAI Enterprise (GPT-4o)', defaultModel: 'gpt-4o' },
  { value: 'anthropic', label: 'Anthropic Claude (3.5 Sonnet)', defaultModel: 'claude-3-5-sonnet-latest' },
  { value: 'openai_compatible', label: 'Custom OpenAI-Compatible Endpoint', defaultModel: 'configurable' },
];

export function ProcessingConfig({
  defaultStyleProfile = 'original_research',
  defaultIntensity = 'standard',
  defaultPrimaryProvider = 'gemini',
  isReadyToProcess,
  isProcessing = false,
  estimatedPages = 0,
  onConfigChange,
  onProcess,
}: ProcessingConfigProps) {
  const [styleProfile, setStyleProfile] = useState<ManuscriptStyleProfile>(defaultStyleProfile);
  const [intensity, setIntensity] = useState<RefinementIntensity>(defaultIntensity);
  const [primaryProvider, setPrimaryProvider] = useState<AIProviderName>(defaultPrimaryProvider);

  function handleProfileChange(newProfile: ManuscriptStyleProfile) {
    setStyleProfile(newProfile);
    onConfigChange?.({ styleProfile: newProfile, intensity, primaryProvider });
  }

  function handleIntensityChange(newIntensity: RefinementIntensity) {
    setIntensity(newIntensity);
    onConfigChange?.({ styleProfile, intensity: newIntensity, primaryProvider });
  }

  function handleProviderChange(newProvider: AIProviderName) {
    setPrimaryProvider(newProvider);
    onConfigChange?.({ styleProfile, intensity, primaryProvider: newProvider });
  }

  function handleBeginProcessing() {
    if (isReadyToProcess && !isProcessing && onProcess) {
      onProcess({ styleProfile, intensity, primaryProvider });
    }
  }

  return (
    <aside aria-label="Processing Configuration" className="space-y-6 bg-surface-cardBackground p-6 rounded-xl border border-surface-borderSubtle shadow-subtle">
      <div>
        <h3 className="text-base font-bold text-brand-navyPrimary flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-accent" aria-hidden="true" />
          <span>Processing Configuration</span>
        </h3>
        <p className="mt-1 text-xs text-neutral-gray">
          Fine-tune academic refinement style and AI routing.
        </p>
      </div>

      <div className="space-y-4">
        {/* Style Profile Selection */}
        <div>
          <label htmlFor="style-profile-select" className="block text-xs font-semibold uppercase tracking-wider text-neutral-textSecondary mb-1.5">
            Manuscript Style Profile
          </label>
          <select
            id="style-profile-select"
            value={styleProfile}
            disabled={isProcessing}
            onChange={(e) => handleProfileChange(e.target.value as ManuscriptStyleProfile)}
            className="w-full px-3 py-2 text-sm bg-white border border-surface-borderDefault rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary disabled:bg-slate-50"
          >
            {STYLE_PROFILES.map((profile) => (
              <option key={profile.value} value={profile.value}>
                {profile.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-neutral-gray leading-normal">
            {STYLE_PROFILES.find((p) => p.value === styleProfile)?.desc}
          </p>
        </div>

        {/* Refinement Intensity Selection */}
        <div>
          <label htmlFor="intensity-select" className="block text-xs font-semibold uppercase tracking-wider text-neutral-textSecondary mb-1.5">
            Refinement Intensity
          </label>
          <select
            id="intensity-select"
            value={intensity}
            disabled={isProcessing}
            onChange={(e) => handleIntensityChange(e.target.value as RefinementIntensity)}
            className="w-full px-3 py-2 text-sm bg-white border border-surface-borderDefault rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary disabled:bg-slate-50"
          >
            {INTENSITY_LEVELS.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-neutral-gray leading-normal">
            {INTENSITY_LEVELS.find((lvl) => lvl.value === intensity)?.desc}
          </p>
        </div>

        {/* Primary AI Provider Selection */}
        <div>
          <label htmlFor="ai-provider-select" className="block text-xs font-semibold uppercase tracking-wider text-neutral-textSecondary mb-1.5">
            Primary AI Provider
          </label>
          <select
            id="ai-provider-select"
            value={primaryProvider}
            disabled={isProcessing}
            onChange={(e) => handleProviderChange(e.target.value as AIProviderName)}
            className="w-full px-3 py-2 text-sm bg-white border border-surface-borderDefault rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent text-neutral-textPrimary disabled:bg-slate-50"
          >
            {AI_PROVIDERS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-neutral-gray">
            Primary model used for refinement. Transparent failover active if unavailable.
          </p>
        </div>

        {/* Locked Feature Toggles */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          {/* Scientific English Toggle */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span className="font-medium text-neutral-textPrimary">Scientific English</span>
            </div>
            <div className="flex items-center gap-2" title="Scientific English is the primary language and cannot be disabled.">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                LOCKED ON
              </span>
            </div>
          </div>

          {/* Scientific Integrity Protection Toggle */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-scientific-pass" aria-hidden="true" />
              <span className="font-medium text-neutral-textPrimary">Integrity Safeguards</span>
            </div>
            <div className="flex items-center gap-2" title="Mandatory research protection. Preserves numbers, clinical endpoints, and citations without silent alteration.">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                MANDATORY
              </span>
            </div>
          </div>

          {/* Maximum Length Display */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-neutral-gray">Max Length</span>
            <span className="font-medium text-brand-navyPrimary">15 pages (server-enforced)</span>
          </div>
        </div>

        {/* Begin Processing Action Button */}
        <div className="pt-4">
          <button
            type="button"
            disabled={!isReadyToProcess || isProcessing}
            onClick={handleBeginProcessing}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all ${
              isReadyToProcess && !isProcessing
                ? 'bg-teal-accent hover:bg-teal-hover text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-accent'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Processing Document...</span>
              </>
            ) : (
              <>
                <span>Begin Processing</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
          {!isReadyToProcess && (
            <p className="mt-2 text-center text-[11px] text-neutral-gray">
              Select or paste a manuscript to enable processing.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
