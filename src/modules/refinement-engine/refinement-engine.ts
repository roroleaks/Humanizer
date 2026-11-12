/**
 * Academic Refinement Engine implementation.
 * Conforms to Section 5 of Prompt 4:
 * Coordinates job planning, streaming execution, failover handling, number guarding,
 * flag detection, and result assembly.
 */

import {
  RefinementEngine,
  RefinementJobRequest,
  RefinementJobStatus,
  RefinementProgressEvent,
  RefinementResult,
  RefinedParagraph,
  RefinementFlag,
  RefinementChunkPlan,
  ManuscriptStyleProfile,
  RefinementIntensity,
} from '@/contracts/refinement';
import { AIProviderName, RefinementRequest } from '@/contracts/ai-provider';
import { DocumentSection } from '@/contracts/document-section';
import { manuscriptRepository } from '@/lib/storage/repositories/manuscript-repository';
import { processingEventRepository } from '@/lib/storage/repositories/processing-event-repository';
import { refinementRepository } from './repositories/refinement-repository';
import { SemanticChunker } from './chunker';
import { buildPrompt } from './prompt-builder';
import { RegexNumberGuard } from './number-guard';
import { detectRefinementFlags, calculateSentenceChangeRatio } from './flag-detector';
import { orchestrator } from '@/modules/ai-orchestrator';
import { summarizeAdjacentText } from './adjacent-summarizer';

export class DefaultRefinementEngine implements RefinementEngine {
  private chunker: SemanticChunker;
  private numberGuard: RegexNumberGuard;
  private cancelledJobs: Set<string> = new Set();

  constructor() {
    this.chunker = new SemanticChunker();
    this.numberGuard = new RegexNumberGuard();
  }

  async planJob(request: RefinementJobRequest): Promise<RefinementJobStatus> {
    const manuscriptData = await manuscriptRepository.getManuscriptById(request.manuscriptId);
    if (!manuscriptData) {
      throw new Error(`Manuscript not found: ${request.manuscriptId}`);
    }

    const { manuscript, sections } = manuscriptData;

    // Convert section records to DocumentSection contracts
    const docSections: DocumentSection[] = sections.map((s) => ({
      id: s.id,
      type: s.type as any,
      title: s.title,
      order: s.orderIndex,
      content: s.content,
      children: [],
      location: {
        sectionId: s.id,
        paragraphIndex: 0,
        charStart: 0,
        charEnd: s.charCount,
      },
      table: s.tableData ? JSON.parse(s.tableData) : undefined,
      rawHtml: s.rawHtml || undefined,
    }));

    // Plan chunks across all sections
    const allChunkPlans: RefinementChunkPlan[] = [];
    let globalChunkIndex = 0;

    for (let sIdx = 0; sIdx < docSections.length; sIdx++) {
      const section = docSections[sIdx];
      const precedingSection = sIdx > 0 ? docSections[sIdx - 1] : undefined;
      const followingSection = sIdx < docSections.length - 1 ? docSections[sIdx + 1] : undefined;

      const plans = this.chunker.plan(section, {
        manuscriptId: manuscript.id,
        manuscriptTitle: manuscript.title,
        adjacentSections: {
          preceding: precedingSection,
          following: followingSection,
        },
      });

      for (const plan of plans) {
        plan.chunkIndex = globalChunkIndex++;
        allChunkPlans.push(plan);
      }
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date();

    // Persist Job
    await refinementRepository.createJob({
      id: jobId,
      manuscriptId: request.manuscriptId,
      styleProfile: request.styleProfile,
      intensity: request.intensity,
      primaryProvider: request.primaryProvider || process.env.SH_AI_PRIMARY_PROVIDER || 'gemini',
      status: 'pending',
      totalChunks: allChunkPlans.length,
      completedChunks: 0,
      failedChunks: 0,
      startedAt: null,
      completedAt: null,
      createdAt: now,
    });

    // Persist Chunks
    const chunkRecords = allChunkPlans.map((plan) => ({
      id: `${jobId}_${plan.id}`,
      jobId,
      manuscriptId: request.manuscriptId,
      sectionId: plan.sectionId,
      chunkIndex: plan.chunkIndex,
      paragraphIds: JSON.stringify(plan.paragraphIds),
      originalText: plan.originalText,
      refinedText: null,
      changeLevel: null,
      wordCount: plan.wordCount,
      status: 'pending' as const,
      providerUsed: null,
      modelUsed: null,
      tokensUsed: 0,
      flags: null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    }));

    await refinementRepository.createChunks(chunkRecords);

    return {
      jobId,
      manuscriptId: request.manuscriptId,
      status: 'pending',
      totalChunks: allChunkPlans.length,
      completedChunks: 0,
      startedAt: now.toISOString(),
      failedChunks: [],
    };
  }

  async *runJob(jobId: string): AsyncIterable<RefinementProgressEvent> {
    const jobData = await refinementRepository.getJobWithChunks(jobId);
    if (!jobData) {
      yield { type: 'job_failed', jobId, reason: `Job ${jobId} not found` };
      return;
    }

    const { job, chunks } = jobData;
    const manuscriptData = await manuscriptRepository.getManuscriptById(job.manuscriptId);
    const sectionTypeMap = new Map<string, string>();
    if (manuscriptData) {
      for (const s of manuscriptData.sections) {
        sectionTypeMap.set(s.id, s.type);
      }
    }

    // Mark job running
    const jobStartTime = new Date();
    await refinementRepository.updateJobStatus(jobId, 'running', {
      startedAt: jobStartTime,
    });

    yield {
      type: 'job_started',
      jobId,
      totalChunks: chunks.length,
    };

    let completedCount = 0;
    let failedCount = 0;
    let currentProvider: AIProviderName | undefined = job.primaryProvider as AIProviderName;
    const failedChunksSummary: Array<{ chunkId: string; reason: string }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Check cancellation
      if (this.cancelledJobs.has(jobId)) {
        await refinementRepository.updateJobStatus(jobId, 'cancelled');
        yield { type: 'job_failed', jobId, reason: 'Refinement job was cancelled by user' };
        this.cancelledJobs.delete(jobId);
        return;
      }

      await refinementRepository.updateChunk(chunk.id, {
        status: 'running',
        startedAt: new Date(),
      });

      // Compute adjacent summaries
      const prevText = i > 0 ? chunks[i - 1].originalText : undefined;
      const nextText = i < chunks.length - 1 ? chunks[i + 1].originalText : undefined;

      const chunkPlan: RefinementChunkPlan = {
        id: chunk.id,
        manuscriptId: chunk.manuscriptId,
        sectionId: chunk.sectionId,
        chunkIndex: chunk.chunkIndex,
        paragraphIds: JSON.parse(chunk.paragraphIds || '[]'),
        originalText: chunk.originalText,
        wordCount: chunk.wordCount,
        context: {
          sectionType: (sectionTypeMap.get(chunk.sectionId) || 'body') as any,
          precedingSectionSummary: prevText ? summarizeAdjacentText(prevText) : undefined,
          followingSectionSummary: nextText ? summarizeAdjacentText(nextText) : undefined,
          protectedInventory: {
            manuscriptId: job.manuscriptId,
            items: [],
            createdAt: new Date().toISOString(),
          },
        },
        sharedReferenceMarkers: [],
      };

      const promptInstructions = buildPrompt(
        chunkPlan,
        job.styleProfile as ManuscriptStyleProfile,
        job.intensity as RefinementIntensity
      );

      const refineRequest: RefinementRequest = {
        manuscriptId: job.manuscriptId,
        chunkId: chunk.id,
        sectionContext: chunkPlan.context,
        textToRefine: chunkPlan.originalText,
        protectedInventory: chunkPlan.context.protectedInventory,
        styleProfile: job.styleProfile as ManuscriptStyleProfile,
        instructions: promptInstructions,
      };

      let chunkRefinedText = '';
      let chunkProvider: AIProviderName = currentProvider || 'gemini';
      let chunkModel = '';
      let chunkTokens = 0;
      let isFirstChunkStream = true;

      try {
        const stream = orchestrator.refineStream(refineRequest);

        for await (const streamChunk of stream) {
          if (isFirstChunkStream) {
            isFirstChunkStream = false;
            chunkProvider = (streamChunk.providerName as AIProviderName) || chunkProvider;
            chunkModel = streamChunk.modelUsed || 'default';

            if (currentProvider && currentProvider !== chunkProvider) {
              // Provider failover detected
              yield {
                type: 'provider_failover',
                chunkId: chunk.id,
                fromProvider: currentProvider,
                toProvider: chunkProvider,
                reason: 'Primary provider unavailable or rate-limited; failed over to fallback.',
              };

              await processingEventRepository.logEvent(
                job.manuscriptId,
                'provider_failover',
                'warning',
                `Failover from ${currentProvider} to ${chunkProvider} during chunk ${chunk.chunkIndex}.`
              );
            }

            currentProvider = chunkProvider;

            yield {
              type: 'chunk_started',
              chunkId: chunk.id,
              chunkIndex: chunk.chunkIndex,
              providerName: chunkProvider,
              modelUsed: chunkModel,
            };
          }

          if (streamChunk.delta) {
            chunkRefinedText += streamChunk.delta;
          }
          if (streamChunk.tokensSoFar) {
            chunkTokens = streamChunk.tokensSoFar;
          }

          yield {
            type: 'chunk_delta',
            chunkId: chunk.id,
            delta: streamChunk.delta,
            tokensSoFar: chunkTokens,
          };
        }

        // Run Number Guard and Flag Detector
        const numberGuardResult = this.numberGuard.check(chunk.originalText, chunkRefinedText);
        const flags = detectRefinementFlags({
          originalText: chunk.originalText,
          refinedText: chunkRefinedText,
          chunkId: chunk.id,
          sectionId: chunk.sectionId,
          intensity: job.intensity as RefinementIntensity,
          numberGuardResult,
        });

        // Determine change level
        let changeLevel: 'unchanged' | 'minor' | 'major' = 'minor';
        if (chunkRefinedText.trim() === chunk.originalText.trim()) {
          changeLevel = 'unchanged';
        } else {
          const ratio = calculateSentenceChangeRatio(chunk.originalText, chunkRefinedText);
          changeLevel = ratio > 0.35 ? 'major' : 'minor';
        }

        // Update chunk record
        await refinementRepository.updateChunk(chunk.id, {
          status: 'completed',
          refinedText: chunkRefinedText,
          changeLevel,
          providerUsed: chunkProvider,
          modelUsed: chunkModel,
          tokensUsed: chunkTokens,
          flags: JSON.stringify(flags),
          completedAt: new Date(),
        });

        completedCount++;
        await refinementRepository.updateJobStatus(jobId, 'running', {
          completedChunks: completedCount,
        });

        yield {
          type: 'chunk_completed',
          chunkId: chunk.id,
          refinedText: chunkRefinedText,
          changeLevel,
          flags,
        };
      } catch (err: any) {
        failedCount++;
        const errorMessage = err?.message || 'Refinement failed for this chunk';
        failedChunksSummary.push({ chunkId: chunk.id, reason: errorMessage });

        await refinementRepository.updateChunk(chunk.id, {
          status: 'failed',
          errorMessage,
          completedAt: new Date(),
        });

        await refinementRepository.updateJobStatus(jobId, 'running', {
          failedChunks: failedCount,
        });

        yield {
          type: 'chunk_failed',
          chunkId: chunk.id,
          reason: errorMessage,
        };
      }
    }

    const jobEndTime = new Date();
    const finalStatus = completedCount > 0 ? 'completed' : 'failed';

    await refinementRepository.updateJobStatus(jobId, finalStatus, {
      completedAt: jobEndTime,
    });

    if (finalStatus === 'completed') {
      const result = await this.getJobResults(jobId);
      yield {
        type: 'job_completed',
        jobId,
        result,
      };
    } else {
      yield {
        type: 'job_failed',
        jobId,
        reason: 'All chunks in this refinement job failed to process.',
      };
    }
  }

  async getJobStatus(jobId: string): Promise<RefinementJobStatus> {
    const jobData = await refinementRepository.getJobWithChunks(jobId);
    if (!jobData) {
      throw new Error(`Job ${jobId} not found`);
    }

    const { job, chunks } = jobData;
    const runningChunk = chunks.find((c) => c.status === 'running');
    const failedChunks = chunks
      .filter((c) => c.status === 'failed')
      .map((c) => ({ chunkId: c.id, reason: c.errorMessage || 'Unknown error' }));

    return {
      jobId: job.id,
      manuscriptId: job.manuscriptId,
      status: job.status,
      totalChunks: job.totalChunks,
      completedChunks: job.completedChunks,
      currentChunkId: runningChunk?.id,
      currentProvider: (runningChunk?.providerUsed || job.primaryProvider) as AIProviderName,
      startedAt: job.startedAt ? job.startedAt.toISOString() : job.createdAt.toISOString(),
      completedAt: job.completedAt ? job.completedAt.toISOString() : undefined,
      failedChunks,
    };
  }

  async getJobResults(jobId: string): Promise<RefinementResult> {
    const jobData = await refinementRepository.getJobWithChunks(jobId);
    if (!jobData) {
      throw new Error(`Job ${jobId} not found`);
    }

    const { job, chunks } = jobData;
    if (job.status !== 'completed' && job.completedChunks === 0) {
      throw new Error('Refinement job is not completed yet');
    }

    const paragraphs: RefinedParagraph[] = [];
    const allFlags: RefinementFlag[] = [];
    let lastProvider = job.primaryProvider || 'gemini';
    let lastModel = 'default';

    for (const chunk of chunks) {
      const flags: RefinementFlag[] = chunk.flags ? JSON.parse(chunk.flags) : [];
      allFlags.push(...flags);

      if (chunk.providerUsed) lastProvider = chunk.providerUsed;
      if (chunk.modelUsed) lastModel = chunk.modelUsed;

      paragraphs.push({
        id: chunk.id,
        originalText: chunk.originalText,
        refinedText: chunk.refinedText || chunk.originalText,
        changeLevel: (chunk.changeLevel as any) || 'unchanged',
        flags,
      });
    }

    return {
      manuscriptId: job.manuscriptId,
      jobId,
      refinedParagraphs: paragraphs,
      styleProfileUsed: job.styleProfile as ManuscriptStyleProfile,
      intensityUsed: job.intensity as RefinementIntensity,
      providerName: lastProvider,
      modelUsed: lastModel,
      generatedAt: (job.completedAt || new Date()).toISOString(),
    };
  }

  async cancelJob(jobId: string): Promise<void> {
    this.cancelledJobs.add(jobId);
    await refinementRepository.updateJobStatus(jobId, 'cancelled');
  }
}

export const refinementEngine = new DefaultRefinementEngine();
