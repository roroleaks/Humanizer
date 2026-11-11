/**
 * Multi-Provider AI Orchestration Contracts
 * 
 * Defines unified adapter interfaces, provider configuration contracts,
 * health monitoring signatures, streaming chunk models, typed error hierarchies,
 * and high-level orchestrator contracts.
 */

import { DocumentSectionContext, ManuscriptStyleProfile } from './refinement';
import { ProtectedInventory } from './scientific-integrity';

/**
 * Recognized AI provider identifiers.
 */
export type AIProviderName =
  | 'openai'
  | 'gemini'
  | 'anthropic'
  | 'openai_compatible';

/**
 * Runtime configuration parameters for an AI provider.
 */
export interface AIProviderConfig {
  name: AIProviderName;
  displayName: string;
  apiBaseUrl?: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  maxRetries: number;
  dataRetentionPolicyUrl?: string;
}

/**
 * Health check assessment payload for a provider adapter.
 */
export interface ProviderHealth {
  name: AIProviderName;
  status: 'healthy' | 'degraded' | 'unavailable';
  lastCheckedAt: string; // ISO 8601
  latencyMs?: number;
  notes?: string;
}

/**
 * Input request payload submitted to an AI provider adapter.
 */
export interface RefinementRequest {
  manuscriptId: string;
  chunkId: string;
  sectionContext: DocumentSectionContext;
  textToRefine: string;
  protectedInventory: ProtectedInventory;
  styleProfile: ManuscriptStyleProfile;
  instructions: string;
}

/**
 * Standardized response payload returned by an AI provider adapter.
 */
export interface RefinementResponse {
  providerName: AIProviderName;
  modelUsed: string;
  refinedText: string;
  tokensUsed: number;
  finishReason: string;
  warnings: string[];
}

/**
 * Streaming response chunk yielded by streaming provider adapters.
 */
export interface RefinementChunk {
  delta: string;
  done: boolean;
  tokensSoFar: number;
  providerName?: AIProviderName;
  modelUsed?: string;
  streaming?: 'native' | 'simulated';
}

/**
 * Common adapter contract that all LLM provider integrations must implement.
 */
export interface AIProviderAdapter {
  readonly name: AIProviderName;
  health(): Promise<ProviderHealth>;
  refine(input: RefinementRequest): Promise<RefinementResponse>;
}

/**
 * Streaming adapter extension for incremental generation.
 */
export interface StreamingAIProviderAdapter extends AIProviderAdapter {
  refineStream(input: RefinementRequest): AsyncIterable<RefinementChunk>;
}

/**
 * Base typed provider error.
 */
export class ProviderError extends Error {
  constructor(
    public providerName: AIProviderName,
    message: string,
    public code: string,
    public retryable: boolean,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/**
 * Rate limit error (retryable, carries optional retry-after duration).
 */
export class RateLimitError extends ProviderError {
  constructor(providerName: AIProviderName, public retryAfterMs?: number) {
    super(providerName, 'Rate limited', 'rate_limit', true);
    this.name = 'RateLimitError';
  }
}

/**
 * Authentication error (non-retryable).
 */
export class AuthenticationError extends ProviderError {
  constructor(providerName: AIProviderName) {
    super(providerName, 'Authentication failed', 'auth_failed', false);
    this.name = 'AuthenticationError';
  }
}

/**
 * Timeout error (retryable).
 */
export class TimeoutError extends ProviderError {
  constructor(providerName: AIProviderName, public timeoutMs: number) {
    super(providerName, 'Request timed out', 'timeout', true);
    this.name = 'TimeoutError';
  }
}

/**
 * Provider unavailable / 5xx error (retryable).
 */
export class ProviderUnavailableError extends ProviderError {
  constructor(providerName: AIProviderName, message = 'Provider unavailable') {
    super(providerName, message, 'provider_unavailable', true);
    this.name = 'ProviderUnavailableError';
  }
}

/**
 * Thrown when credentials are missing for an adapter prior to network dispatch.
 */
export class MissingCredentialError extends Error {
  constructor(public providerName: AIProviderName) {
    super(`No API key configured for provider "${providerName}"`);
    this.name = 'MissingCredentialError';
  }
}

/**
 * Thrown when all primary and fallback providers have failed in the orchestration chain.
 */
export class OrchestrationError extends Error {
  constructor(
    public attemptedProviders: Array<{ name: AIProviderName; error: string }>,
  ) {
    super(
      `All providers failed: ${attemptedProviders
        .map((p) => `${p.name} (${p.error})`)
        .join(', ')}`
    );
    this.name = 'OrchestrationError';
  }
}

/**
 * Top-level AI Orchestrator service contract.
 */
export interface AIOrchestrator {
  refine(request: RefinementRequest): Promise<RefinementResponse>;
  refineStream(request: RefinementRequest): AsyncIterable<RefinementChunk>;
  getProviderHealth(): Promise<ProviderHealth[]>;
  triggerHealthCheck(): Promise<void>;
}
