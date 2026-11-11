/**
 * Refinement Engine Contracts
 * 
 * Defines chunking specifications, contextual boundaries, paragraph-level revision models,
 * intensity grading, job progression events, and refinement outcome artifacts.
 */

import { DocumentLocation, DocumentSectionType } from './document-section';
import { ProtectedInventory } from './scientific-integrity';
import { AIProviderName } from './ai-provider';

/**
 * Recognized academic manuscript genres and writing profiles.
 */
export type ManuscriptStyleProfile =
  | 'original_research'
  | 'narrative_review'
  | 'systematic_review'
  | 'meta_analysis'
  | 'clinical_commentary'
  | 'case_report'
  | 'research_letter';

/**
 * Refinement transformation intensity levels.
 */
export type RefinementIntensity = 'conservative' | 'standard' | 'high_impact';

/**
 * Section context passed alongside a chunk to preserve narrative continuity.
 */
export interface DocumentSectionContext {
  manuscriptTitle?: string;
  sectionType: DocumentSectionType;
  precedingSectionSummary?: string;
  followingSectionSummary?: string;
  protectedInventory: ProtectedInventory;
}

/**
 * An isolated chunk of text scheduled for refinement.
 */
export interface RefinementChunk {
  id: string;
  sectionId: string;
  paragraphIds: string[];
  originalText: string;
  documentContext: DocumentSectionContext;
}

/**
 * Refinement Chunk Execution Plan produced by the two-pass chunker.
 */
export interface RefinementChunkPlan {
  id: string;
  manuscriptId: string;
  sectionId: string;
  chunkIndex: number;
  paragraphIds: string[];
  originalText: string;
  wordCount: number;
  context: DocumentSectionContext;
  sharedReferenceMarkers: string[]; // e.g., ['Table 2', '[Smith 2020]']
}

/**
 * Informational or cautionary flag generated during refinement.
 */
export interface RefinementFlag {
  type: 'ambiguous_meaning' | 'unsupported_claim' | 'style_deviation' | 'protected_item_touched';
  message: string;
  location: DocumentLocation;
}

/**
 * Revision output for an individual paragraph with granular change metrics.
 */
export interface RefinedParagraph {
  id: string;
  originalText: string;
  refinedText: string;
  changeLevel: 'unchanged' | 'minor' | 'major';
  flags: RefinementFlag[];
}

/**
 * Full aggregation of refined paragraphs for a manuscript.
 */
export interface RefinementResult {
  manuscriptId: string;
  jobId: string;
  refinedParagraphs: RefinedParagraph[];
  styleProfileUsed: ManuscriptStyleProfile;
  intensityUsed: RefinementIntensity;
  providerName: string;
  modelUsed: string;
  generatedAt: string; // ISO 8601
}

/**
 * Request payload to initiate a manuscript refinement job.
 */
export interface RefinementJobRequest {
  manuscriptId: string;
  styleProfile: ManuscriptStyleProfile;
  intensity: RefinementIntensity;
  primaryProvider?: AIProviderName;
}

/**
 * Progress tracking state for an active or completed refinement job.
 */
export interface RefinementJobStatus {
  jobId: string;
  manuscriptId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  totalChunks: number;
  completedChunks: number;
  currentChunkId?: string;
  currentProvider?: AIProviderName;
  startedAt: string;
  completedAt?: string;
  failedChunks: Array<{ chunkId: string; reason: string }>;
}

/**
 * Real-time event stream emitted during refinement job execution.
 */
export type RefinementProgressEvent =
  | { type: 'job_started'; jobId: string; totalChunks: number }
  | { type: 'chunk_started'; chunkId: string; chunkIndex: number; providerName: AIProviderName; modelUsed: string }
  | { type: 'chunk_delta'; chunkId: string; delta: string; tokensSoFar: number }
  | { type: 'chunk_completed'; chunkId: string; refinedText: string; changeLevel: 'unchanged' | 'minor' | 'major'; flags: RefinementFlag[] }
  | { type: 'chunk_failed'; chunkId: string; reason: string }
  | { type: 'provider_failover'; chunkId: string; fromProvider: AIProviderName; toProvider: AIProviderName; reason: string }
  | { type: 'job_completed'; jobId: string; result: RefinementResult }
  | { type: 'job_failed'; jobId: string; reason: string };

/**
 * Public service interface for the Scientific Refinement Engine.
 */
export interface RefinementEngine {
  planJob(request: RefinementJobRequest): Promise<RefinementJobStatus>;
  runJob(jobId: string): AsyncIterable<RefinementProgressEvent>;
  getJobStatus(jobId: string): Promise<RefinementJobStatus>;
  getJobResults(jobId: string): Promise<RefinementResult>;
  cancelJob(jobId: string): Promise<void>;
}
