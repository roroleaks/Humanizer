/**
 * Public Domain Contracts Index
 * 
 * Central re-export of all TypeScript interfaces and domain types for Scientific Humanizer.
 */

export * from './document-section';
export * from './scientific-integrity';
export type {
  RefinementChunk as ManuscriptRefinementChunk,
  DocumentSectionContext,
  ManuscriptStyleProfile,
  RefinementIntensity,
  RefinementChunkPlan,
  RefinementFlag,
  RefinedParagraph,
  RefinementResult,
  RefinementJobRequest,
  RefinementJobStatus,
  RefinementProgressEvent,
  RefinementEngine,
} from './refinement';
export * from './ai-provider';
export * from './manuscript';
export * from './validation';
