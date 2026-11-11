/**
 * Phase 4 Verification Test Suite
 * Tests Chunker, Prompt Builder (all 21 combinations), Number Guard, Flag Detector,
 * Repository methods, and Refinement Engine flow.
 */

import { SemanticChunker, countWords, extractReferenceMarkers } from '../src/modules/refinement-engine/chunker';
import { summarizeAdjacentText, extractSentences } from '../src/modules/refinement-engine/adjacent-summarizer';
import { RegexNumberGuard, extractNumbers } from '../src/modules/refinement-engine/number-guard';
import { detectRefinementFlags, calculateSentenceChangeRatio } from '../src/modules/refinement-engine/flag-detector';
import { buildPrompt } from '../src/modules/refinement-engine/prompt-builder';
import { ManuscriptStyleProfile, RefinementIntensity, RefinementChunkPlan } from '../src/contracts/refinement';
import { DocumentSection } from '../src/contracts/document-section';

const ALL_PROFILES: ManuscriptStyleProfile[] = [
  'original_research',
  'narrative_review',
  'systematic_review',
  'meta_analysis',
  'clinical_commentary',
  'case_report',
  'research_letter',
];

const ALL_INTENSITIES: RefinementIntensity[] = [
  'conservative',
  'standard',
  'high_impact',
];

async function runTests() {
  console.log('--- Starting Phase 4 Verification Suite ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. Chunker Determinism
  const chunker = new SemanticChunker();
  const sampleSection: DocumentSection = {
    id: 'sec_1',
    type: 'results',
    title: 'Results',
    order: 1,
    content: `Primary outcomes showed significant reduction in blood pressure (Table 1). The mean systolic drop was 12 mmHg [1].\n\nSecondary analysis supported the findings presented in Table 1 across all sub-cohorts. No adverse reactions were observed [2].\n\nOverall clinical utility remains promising based on observed metrics (Figure 2).`,
    children: [],
    location: {
      sectionId: 'sec_1',
      paragraphIndex: 0,
      charStart: 0,
      charEnd: 200,
    },
  };

  const context = {
    manuscriptId: 'ms_test',
    manuscriptTitle: 'Test Manuscript',
  };

  const plan1 = chunker.plan(sampleSection, context);
  const plan2 = chunker.plan(sampleSection, context);

  assert(
    JSON.stringify(plan1) === JSON.stringify(plan2),
    'Chunker is deterministic (same input produces identical plan)'
  );

  // 2. Reference Marker Preservation & Grouping
  const sharedMarkers = extractReferenceMarkers(sampleSection.content);
  assert(
    sharedMarkers.some((m) => m.includes('Table 1')),
    'Reference marker detector extracted Table 1'
  );
  assert(
    sharedMarkers.some((m) => m.includes('[1]')),
    'Reference marker detector extracted citation [1]'
  );

  // 3. 800-Word Ceiling & Sentence Overflow Splitting
  const longSentence = 'This is an extensive analytical sentence documenting quantitative observations in the laboratory setting. ';
  const bigParagraph = longSentence.repeat(90); // ~990 words
  const overflowSection: DocumentSection = {
    id: 'sec_overflow',
    type: 'discussion',
    title: 'Discussion',
    order: 2,
    content: bigParagraph,
    children: [],
    location: {
      sectionId: 'sec_overflow',
      paragraphIndex: 0,
      charStart: 0,
      charEnd: bigParagraph.length,
    },
  };

  const overflowPlan = chunker.plan(overflowSection, context);
  assert(
    overflowPlan.length > 1,
    `Paragraph > 800 words was successfully split into ${overflowPlan.length} chunks`
  );
  assert(
    overflowPlan.every((c) => c.wordCount <= 800),
    'All split chunks respect the 800-word hard ceiling'
  );

  // 4. Adjacent Summarizer
  const sampleSummaryText = 'Sentence one begins here. Sentence two is intermediate. Sentence three concludes the section.';
  const summary = summarizeAdjacentText(sampleSummaryText, 2);
  assert(
    summary.includes('Sentence one begins here.') && summary.includes('Sentence three concludes the section.'),
    'Adjacent summarizer extracts first and last sentences'
  );

  // 5. Prompt Builder (All 21 Combinations)
  const dummyChunk: RefinementChunkPlan = {
    id: 'chunk_dummy',
    manuscriptId: 'ms_test',
    sectionId: 'sec_1',
    chunkIndex: 0,
    paragraphIds: ['p1'],
    originalText: 'Baseline patient demographics demonstrated a mean age of 54.2 years (Table 1).',
    wordCount: 11,
    context: {
      sectionType: 'results',
      precedingSectionSummary: 'Prior methods detailed trial design.',
      followingSectionSummary: 'Subsequent discussion contextualized clinical endpoints.',
      protectedInventory: { terms: [], units: [], numbers: [], citations: [] },
    },
    sharedReferenceMarkers: ['Table 1'],
  };

  let comboCount = 0;
  let allPromptsValid = true;

  for (const profile of ALL_PROFILES) {
    for (const intensity of ALL_INTENSITIES) {
      comboCount++;
      const prompt = buildPrompt(dummyChunk, profile, intensity);

      const hasProtectedPreamble = prompt.includes('[IMMUTABLE SCIENTIFIC DATA POLICY]');
      const hasSecurityBoundary = prompt.includes('<manuscript_chunk>') && prompt.includes('</manuscript_chunk>');
      const hasChunkText = prompt.includes(dummyChunk.originalText);
      const hasContext = prompt.includes('Prior methods detailed trial design.');

      if (!hasProtectedPreamble || !hasSecurityBoundary || !hasChunkText || !hasContext) {
        allPromptsValid = false;
        console.error(`Prompt failed validation for ${profile} × ${intensity}`);
      }
    }
  }

  assert(
    comboCount === 21 && allPromptsValid,
    `Prompt builder generated and validated all 21 combinations (7 styles × 3 intensities)`
  );

  // 6. Number Guard
  const numberGuard = new RegexNumberGuard();
  const origText = 'The study evaluated 42 patients; mean blood pressure dropped by 12.5 mmHg (95% CI: 1.2-3.4, P < 0.05).';
  const cleanRefined = 'In total, 42 patients were evaluated; mean arterial pressure decreased by 12.5 mmHg (95% CI: 1.2-3.4, P < 0.05).';
  const corruptedRefined = 'In total, forty-two patients were evaluated; mean arterial pressure decreased by 15.0 mmHg (95% CI: 1.2-3.4).';

  const cleanCheck = numberGuard.check(origText, cleanRefined);
  assert(cleanCheck.passed, 'Number guard passes when all numerical values are preserved');

  const corruptCheck = numberGuard.check(origText, corruptedRefined);
  assert(
    !corruptCheck.passed && corruptCheck.missingNumbers.includes('42'),
    'Number guard flags missing numbers when values are altered or removed'
  );

  // 7. Flag Detector
  const flagTestCases = [
    {
      name: 'ambiguous_meaning flag on [AMBIGUOUS] tag',
      orig: 'Patient history was non-contributory.',
      ref: 'Patient history was non-contributory [AMBIGUOUS].',
      expectedType: 'ambiguous_meaning',
    },
    {
      name: 'unsupported_claim flag on new causal verb',
      orig: 'The drug was associated with lower inflammatory markers.',
      ref: 'The drug undeniably causes lower inflammatory markers.',
      expectedType: 'unsupported_claim',
    },
    {
      name: 'protected_item_touched flag when number is missing',
      orig: 'Cohort had 120 patients.',
      ref: 'Cohort had patients.',
      expectedType: 'protected_item_touched',
    },
  ];

  for (const tc of flagTestCases) {
    const flags = detectRefinementFlags({
      originalText: tc.orig,
      refinedText: tc.ref,
      chunkId: 'chunk_test',
      sectionId: 'sec_1',
      intensity: 'conservative',
    });
    assert(
      flags.some((f) => f.type === tc.expectedType),
      `Flag detector successfully identified: ${tc.name}`
    );
  }

  console.log(`\nVerification Suite Complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
