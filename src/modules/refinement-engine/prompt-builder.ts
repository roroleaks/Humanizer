/**
 * Prompt Builder for Academic Refinement.
 * Conforms to Section 5.5 of Prompt 4:
 * Pure function assembling the canonical refinement instructions for all 21 combinations
 * (7 style profiles × 3 intensities).
 */

import { ManuscriptStyleProfile, RefinementChunkPlan, RefinementIntensity } from '@/contracts/refinement';
import { ProtectedInventory } from '@/contracts/scientific-integrity';
import { renderBaseTemplate } from './prompt-templates/base-template';
import { CONSERVATIVE_INTENSITY } from './prompt-templates/intensities/conservative';
import { HIGH_IMPACT_INTENSITY } from './prompt-templates/intensities/high-impact';
import { STANDARD_INTENSITY } from './prompt-templates/intensities/standard';
import { PROMPT_INJECTION_PREAMBLE } from './prompt-templates/prompt-injection-preamble';
import { PROTECTED_INVENTORY_PREAMBLE } from './prompt-templates/protected-inventory-preamble';
import { CASE_REPORT_STYLE } from './prompt-templates/style-profiles/case-report';
import { CLINICAL_COMMENTARY_STYLE } from './prompt-templates/style-profiles/clinical-commentary';
import { META_ANALYSIS_STYLE } from './prompt-templates/style-profiles/meta-analysis';
import { NARRATIVE_REVIEW_STYLE } from './prompt-templates/style-profiles/narrative-review';
import { ORIGINAL_RESEARCH_STYLE } from './prompt-templates/style-profiles/original-research';
import { RESEARCH_LETTER_STYLE } from './prompt-templates/style-profiles/research-letter';
import { SYSTEMATIC_REVIEW_STYLE } from './prompt-templates/style-profiles/systematic-review';

export function getStyleProfileText(profile: ManuscriptStyleProfile): string {
  switch (profile) {
    case 'original_research':
      return ORIGINAL_RESEARCH_STYLE;
    case 'narrative_review':
      return NARRATIVE_REVIEW_STYLE;
    case 'systematic_review':
      return SYSTEMATIC_REVIEW_STYLE;
    case 'meta_analysis':
      return META_ANALYSIS_STYLE;
    case 'clinical_commentary':
      return CLINICAL_COMMENTARY_STYLE;
    case 'case_report':
      return CASE_REPORT_STYLE;
    case 'research_letter':
      return RESEARCH_LETTER_STYLE;
    default:
      return ORIGINAL_RESEARCH_STYLE;
  }
}

export function getIntensityText(intensity: RefinementIntensity): string {
  switch (intensity) {
    case 'conservative':
      return CONSERVATIVE_INTENSITY;
    case 'high_impact':
      return HIGH_IMPACT_INTENSITY;
    case 'standard':
    default:
      return STANDARD_INTENSITY;
  }
}

export function buildPrompt(
  chunk: RefinementChunkPlan,
  styleProfile: ManuscriptStyleProfile,
  intensity: RefinementIntensity,
  _inventory?: ProtectedInventory
): string {
  const styleProfileText = getStyleProfileText(styleProfile);
  const intensityText = getIntensityText(intensity);

  return renderBaseTemplate({
    protectedInventoryPreamble: PROTECTED_INVENTORY_PREAMBLE,
    styleProfileText,
    intensityText,
    promptInjectionPreamble: PROMPT_INJECTION_PREAMBLE,
    chunkText: chunk.originalText,
    sectionType: chunk.context.sectionType || 'Section',
    styleProfileName: styleProfile.replace('_', ' '),
    adjacentSummaryBefore: chunk.context.precedingSectionSummary,
    adjacentSummaryAfter: chunk.context.followingSectionSummary,
  });
}
