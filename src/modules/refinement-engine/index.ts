/**
 * Refinement Engine Module
 * 
 * Provides two-pass semantic chunking, prompt generation for all style profiles & intensities,
 * number preservation guarding, refinement flag detection, streaming execution via AI orchestrator,
 * and refinement job/chunk persistence.
 */

export * from './chunker';
export * from './adjacent-summarizer';
export * from './number-guard';
export * from './flag-detector';
export * from './prompt-builder';
export * from './refinement-engine';
export * from './repositories/refinement-repository';
