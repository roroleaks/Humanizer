/**
 * Refinement Flag Detector.
 * Conforms to Section 6 of Prompt 4:
 * Detects:
 * - ambiguous_meaning: Explicit markers ([AMBIGUOUS], [FLAG]) or unchanged text under high intensity.
 * - unsupported_claim: New strong causal terms not present in the original.
 * - style_deviation: Sentence change ratio diverging from the target intensity bounds.
 * - protected_item_touched: Missing numbers reported by the NumberGuard.
 */

import { DocumentLocation } from '@/contracts/document-section';
import { RefinementFlag, RefinementIntensity } from '@/contracts/refinement';
import { extractSentences } from './adjacent-summarizer';
import { NumberGuardResult, RegexNumberGuard } from './number-guard';

export interface DetectFlagsParams {
  originalText: string;
  refinedText: string;
  chunkId: string;
  sectionId: string;
  intensity: RefinementIntensity;
  numberGuardResult?: NumberGuardResult;
}

const CAUSAL_TERMS = [
  'proves that',
  'proves',
  'undeniably causes',
  'causes',
  'demonstrates unequivocally',
  'establishes beyond doubt',
  'guarantees',
];

export function calculateSentenceChangeRatio(originalText: string, refinedText: string): number {
  const origSentences = extractSentences(originalText);
  const refSentences = new Set(extractSentences(refinedText));

  if (origSentences.length === 0) return 0;

  let changedCount = 0;
  for (const s of origSentences) {
    if (!refSentences.has(s)) {
      changedCount++;
    }
  }

  return changedCount / origSentences.length;
}

export function detectRefinementFlags(params: DetectFlagsParams): RefinementFlag[] {
  const flags: RefinementFlag[] = [];
  const { originalText, refinedText, sectionId, intensity } = params;

  const defaultLocation: DocumentLocation = {
    sectionId,
    paragraphIndex: 0,
    charStart: 0,
    charEnd: refinedText ? refinedText.length : 0,
  };

  // 1. Ambiguous Meaning check
  const ambiguousMarkers = ['[AMBIGUOUS]', '[FLAG]', '[UNCERTAIN]', '[NEEDS_CLARIFICATION]'];
  const hasAmbiguousMarker = ambiguousMarkers.some((marker) =>
    refinedText.toUpperCase().includes(marker)
  );

  if (hasAmbiguousMarker) {
    flags.push({
      type: 'ambiguous_meaning',
      message: 'The model flagged an ambiguous phrasing or uncertain clinical interpretation in this chunk.',
      location: defaultLocation,
    });
  }

  // 2. Unsupported Claim Heuristic (new causal language not in original)
  const origLower = originalText.toLowerCase();
  const refLower = refinedText.toLowerCase();

  for (const term of CAUSAL_TERMS) {
    if (refLower.includes(term) && !origLower.includes(term)) {
      const charStart = refLower.indexOf(term);
      flags.push({
        type: 'unsupported_claim',
        message: `Introduced potentially unsupported definitive causal language: "${term}".`,
        location: {
          sectionId,
          paragraphIndex: 0,
          charStart: Math.max(0, charStart),
          charEnd: charStart + term.length,
        },
      });
      break; // One warning is sufficient per chunk
    }
  }

  // 3. Style Deviation Check
  const changeRatio = calculateSentenceChangeRatio(originalText, refinedText);
  if (intensity === 'conservative' && changeRatio > 0.5) {
    flags.push({
      type: 'style_deviation',
      message: `Conservative intensity requested (target 10-20% sentences modified), but ${(changeRatio * 100).toFixed(0)}% of sentences were modified.`,
      location: defaultLocation,
    });
  } else if (intensity === 'high_impact' && changeRatio < 0.2 && originalText.trim() !== refinedText.trim()) {
    flags.push({
      type: 'style_deviation',
      message: `High-impact intensity requested (target 70-90% sentences modified), but only ${(changeRatio * 100).toFixed(0)}% of sentences were modified.`,
      location: defaultLocation,
    });
  }

  // 4. Protected Item Touched (Number Guard)
  const guard = params.numberGuardResult || new RegexNumberGuard().check(originalText, refinedText);
  if (!guard.passed && guard.missingNumbers.length > 0) {
    flags.push({
      type: 'protected_item_touched',
      message: `One or more numerical or statistical values from the original chunk were missing or altered in the refined output: ${guard.missingNumbers.join(', ')}.`,
      location: defaultLocation,
    });
  }

  return flags;
}
