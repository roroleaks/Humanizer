/**
 * End-to-End Refinement Test
 * Tests database operations, consent flow, job planning, generator execution,
 * streaming events, and immutability of original manuscripts.
 */

import './setup-env';
import os from 'os';
import path from 'path';

import { manuscriptRepository } from '../src/lib/storage/repositories/manuscript-repository';
import { refinementRepository } from '../src/modules/refinement-engine/repositories/refinement-repository';
import { refinementEngine } from '../src/modules/refinement-engine';
import { orchestrator } from '../src/modules/ai-orchestrator';
import {
  AIProviderName,
  ProviderHealth,
  RefinementChunk,
  RefinementRequest,
  RefinementResponse,
  StreamingAIProviderAdapter,
} from '../src/contracts/ai-provider';

// Synthetic test adapter simulating a live AI provider
class SyntheticTestAdapter implements StreamingAIProviderAdapter {
  readonly name: AIProviderName = 'gemini';

  async health(): Promise<ProviderHealth> {
    return {
      name: 'gemini',
      status: 'healthy',
      lastCheckedAt: new Date().toISOString(),
    };
  }

  async refine(input: RefinementRequest): Promise<RefinementResponse> {
    return {
      refinedText: input.textToRefine,
      providerName: 'gemini',
      modelUsed: 'synthetic-gemini-pro',
      tokensUsed: 50,
      finishReason: 'stop',
      warnings: [],
    };
  }

  async *refineStream(input: RefinementRequest): AsyncIterable<RefinementChunk> {
    const half = Math.floor(input.textToRefine.length / 2);
    yield {
      delta: input.textToRefine.slice(0, half),
      done: false,
      tokensSoFar: 25,
      providerName: 'gemini',
      modelUsed: 'synthetic-gemini-pro',
      streaming: 'simulated',
    };
    yield {
      delta: input.textToRefine.slice(half),
      done: true,
      tokensSoFar: 50,
      providerName: 'gemini',
      modelUsed: 'synthetic-gemini-pro',
      streaming: 'simulated',
    };
  }
}

async function runE2ETest() {
  console.log('--- Starting Phase 4 End-to-End Test ---');

  // Register synthetic adapter for testing without live external keys
  orchestrator.registerAdapter(new SyntheticTestAdapter());

  const manuscriptId = `ms_e2e_${Date.now()}`;
  const originalProse = 'A total of 84 patients with stage 2 hypertension were randomized into two arms (Table 1). Blood pressure dropped by 14 mmHg (95% CI: 2.1-4.5, P = 0.002) [1].';

  // 1. Create manuscript & section
  await manuscriptRepository.createManuscript({
    id: manuscriptId,
    title: 'E2E Clinical Trial Study',
    sourceType: 'text',
    pageCount: 1,
    pageCountConfidence: 'verified',
    wordCount: 26,
    status: 'intake',
    styleProfile: 'original_research',
    primaryProvider: 'gemini',
    ocrUsed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const sectionId = `sec_e2e_${Date.now()}`;
  await manuscriptRepository.saveParsedSections([
    {
      id: sectionId,
      manuscriptId,
      parentId: null,
      type: 'results',
      title: 'Trial Results',
      orderIndex: 0,
      content: originalProse,
      tableData: null,
      rawHtml: null,
      charCount: originalProse.length,
      createdAt: new Date(),
    },
  ]);

  console.log(`[PASS] Created test manuscript ${manuscriptId}`);

  // 2. Consent verification
  const initialConsent = await refinementRepository.hasConsent(manuscriptId);
  if (initialConsent) {
    throw new Error('Initial consent must be false');
  }
  console.log('[PASS] Pre-refinement consent check is initially false');

  await refinementRepository.recordConsent(manuscriptId);
  const updatedConsent = await refinementRepository.hasConsent(manuscriptId);
  if (!updatedConsent) {
    throw new Error('Recorded consent must be true');
  }
  console.log('[PASS] Pre-refinement consent recorded and verified');

  // 3. Plan Refinement Job
  const plan = await refinementEngine.planJob({
    manuscriptId,
    styleProfile: 'original_research',
    intensity: 'standard',
    primaryProvider: 'gemini',
  });

  if (!plan.jobId || plan.totalChunks === 0) {
    throw new Error('Plan job returned invalid status');
  }
  console.log(`[PASS] Refinement job planned: ${plan.jobId} with ${plan.totalChunks} chunk(s)`);

  // 4. Run Refinement Job via Async Generator
  console.log('Running refinement stream...');
  const events = [];
  for await (const event of refinementEngine.runJob(plan.jobId)) {
    events.push(event);
    if (event.type === 'job_started') {
      console.log(` -> Event: job_started (totalChunks: ${event.totalChunks})`);
    } else if (event.type === 'chunk_started') {
      console.log(` -> Event: chunk_started (chunk: ${event.chunkId}, provider: ${event.providerName})`);
    } else if (event.type === 'chunk_completed') {
      console.log(` -> Event: chunk_completed (change: ${event.changeLevel})`);
    } else if (event.type === 'job_completed') {
      console.log(` -> Event: job_completed (result paragraphs: ${(event.result.paragraphs || event.result.refinedParagraphs || []).length})`);
    }
  }

  // Verify event flow
  const hasJobStarted = events.some((e) => e.type === 'job_started');
  const hasChunkCompleted = events.some((e) => e.type === 'chunk_completed');
  const hasJobCompleted = events.some((e) => e.type === 'job_completed');

  if (!hasJobStarted || !hasChunkCompleted || !hasJobCompleted) {
    throw new Error('Missing expected refinement progress events in stream');
  }
  console.log('[PASS] Refinement async stream emitted all required events');

  // 5. Verify Immutability of Original Section in DB
  const verifyManuscript = await manuscriptRepository.getManuscriptById(manuscriptId);
  if (!verifyManuscript) throw new Error('Manuscript disappeared');

  if (verifyManuscript.sections[0].content !== originalProse) {
    throw new Error('CRITICAL INTEGRITY FAILURE: Original section content was mutated!');
  }
  console.log('[PASS] Original manuscript text remained strictly immutable in storage');

  // 6. Verify Results
  const results = await refinementEngine.getJobResults(plan.jobId);
  if (!results || (results.paragraphs || results.refinedParagraphs || []).length === 0) {
    throw new Error('Refinement results empty');
  }
  console.log(`[PASS] Refinement results retrieved successfully: ${(results.paragraphs || results.refinedParagraphs || []).length} paragraphs refined`);

  console.log('\n--- All End-to-End Tests Succeeded ---');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('[ERROR] E2E test failed:', err);
  process.exit(1);
});
