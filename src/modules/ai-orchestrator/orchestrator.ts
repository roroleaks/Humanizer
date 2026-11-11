import {
  AIProviderName,
  AIOrchestrator,
  StreamingAIProviderAdapter,
  RefinementRequest,
  RefinementResponse,
  RefinementChunk,
  ProviderHealth,
  OrchestrationError,
  TimeoutError,
  ProviderError,
} from '@/contracts/ai-provider';
import { CircuitBreaker, defaultCircuitBreaker } from './circuit-breaker';
import { RetryPolicy, ExponentialBackoffWithJitterPolicy } from './retry-policy';
import { HealthMonitor } from './health-monitor';
import { OpenAIAdapter } from './adapters/openai-adapter';
import { AnthropicAdapter } from './adapters/anthropic-adapter';
import { GeminiAdapter } from './adapters/gemini-adapter';
import { OpenAICompatibleAdapter } from './adapters/openai-compatible-adapter';
import { CredentialSource, defaultCredentialSource } from './credential-source';

export interface OrchestratorOptions {
  primaryProvider?: AIProviderName;
  fallbackProviders?: AIProviderName[];
  circuitBreaker?: CircuitBreaker;
  retryPolicy?: RetryPolicy;
  ttfbTimeoutMs?: number;
  interChunkTimeoutMs?: number;
  hardTimeoutMs?: number;
  credentialSource?: CredentialSource;
}

export class DefaultAIOrchestrator implements AIOrchestrator {
  private readonly adapters: Map<AIProviderName, StreamingAIProviderAdapter> = new Map();
  private readonly primaryProvider: AIProviderName;
  private readonly fallbackProviders: AIProviderName[];
  private readonly circuitBreaker: CircuitBreaker;
  private readonly retryPolicy: RetryPolicy;
  private readonly healthMonitor: HealthMonitor;
  private readonly ttfbTimeoutMs: number;
  private readonly interChunkTimeoutMs: number;
  private readonly hardTimeoutMs: number;

  constructor(options?: OrchestratorOptions) {
    const creds = options?.credentialSource || defaultCredentialSource;

// Instantiate adapters only when credentials are available
    const maybeAdd = (name: AIProviderName, AdapterClass: any) => {
      const key = creds.getKey(name);
      if (key) {
        this.adapters.set(name, new AdapterClass(creds));
      } else {
        // No API key – skip registration to avoid runtime errors
        console.warn(`AI Orchestrator: Skipping registration of '${name}' adapter due to missing credentials.`);
      }
    };
    maybeAdd('openai', OpenAIAdapter);
    maybeAdd('anthropic', AnthropicAdapter);
    maybeAdd('gemini', GeminiAdapter);
    maybeAdd('openai_compatible', OpenAICompatibleAdapter);

    this.primaryProvider =
      options?.primaryProvider ??
      ((process.env.SH_AI_PRIMARY_PROVIDER as AIProviderName) || 'openai');

    this.fallbackProviders =
      options?.fallbackProviders ??
      (process.env.SH_AI_FALLBACK_PROVIDERS
        ? (process.env.SH_AI_FALLBACK_PROVIDERS.split(',').map((s) => s.trim()) as AIProviderName[])
        : ['gemini', 'anthropic']);

    this.circuitBreaker = options?.circuitBreaker ?? defaultCircuitBreaker;
    this.retryPolicy = options?.retryPolicy ?? new ExponentialBackoffWithJitterPolicy();
    this.healthMonitor = new HealthMonitor(this.adapters);

    this.ttfbTimeoutMs =
      options?.ttfbTimeoutMs ??
      parseInt(process.env.SH_AI_TTFB_TIMEOUT_MS || '15000', 10);
    this.interChunkTimeoutMs =
      options?.interChunkTimeoutMs ??
      parseInt(process.env.SH_AI_INTERCHUNK_TIMEOUT_MS || '10000', 10);
    this.hardTimeoutMs =
      options?.hardTimeoutMs ??
      parseInt(process.env.SH_AI_TIMEOUT_MS || '60000', 10);

    // Boot background health monitor
    this.healthMonitor.start();
  }

  // Allow adapter injection for testing
  registerAdapter(adapter: StreamingAIProviderAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  async getProviderHealth(): Promise<ProviderHealth[]> {
    return this.healthMonitor.getAllCachedHealth();
  }

  async triggerHealthCheck(): Promise<void> {
    await this.healthMonitor.triggerHealthCheck();
  }

  getOrchestrationChain(): { primary: AIProviderName; fallbacks: AIProviderName[] } {
    return {
      primary: this.primaryProvider,
      fallbacks: this.fallbackProviders,
    };
  }

  async refine(request: RefinementRequest): Promise<RefinementResponse> {
    const attemptedProviders: Array<{ name: AIProviderName; error: string }> = [];
    const chain = [this.primaryProvider, ...this.fallbackProviders.filter((p) => p !== this.primaryProvider)];

    for (const providerName of chain) {
      const adapter = this.adapters.get(providerName);
      if (!adapter) continue;

      if (!this.circuitBreaker.allowRequest(providerName)) {
        attemptedProviders.push({ name: providerName, error: 'Circuit breaker is OPEN' });
        continue;
      }

      let attempt = 0;
      let succeeded = false;

      while (!succeeded) {
        attempt++;
        try {
          // Wrap with hard timeout
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new TimeoutError(providerName, this.hardTimeoutMs)),
              this.hardTimeoutMs
            )
          );

          const response = await Promise.race([adapter.refine(request), timeoutPromise]);
          this.circuitBreaker.recordSuccess(providerName);
          succeeded = true;
          return response;
        } catch (err: any) {
          const providerErr =
            err instanceof ProviderError
              ? err
              : new ProviderError(providerName, err?.message || 'Unknown error', 'error', true);

          if (this.retryPolicy.shouldRetry(providerErr, attempt)) {
            const delay = this.retryPolicy.nextDelayMs(attempt, providerErr);
            if (delay > 0) {
              await new Promise((r) => setTimeout(r, delay));
            }
            continue;
          }

          this.circuitBreaker.recordFailure(providerName);
          attemptedProviders.push({ name: providerName, error: providerErr.message });
          break;
        }
      }
    }

    throw new OrchestrationError(attemptedProviders);
  }

  async *refineStream(request: RefinementRequest): AsyncIterable<RefinementChunk> {
    const attemptedProviders: Array<{ name: AIProviderName; error: string }> = [];
    const chain = [this.primaryProvider, ...this.fallbackProviders.filter((p) => p !== this.primaryProvider)];

    for (const providerName of chain) {
      const adapter = this.adapters.get(providerName);
      if (!adapter) continue;

      if (!this.circuitBreaker.allowRequest(providerName)) {
        attemptedProviders.push({ name: providerName, error: 'Circuit breaker is OPEN' });
        continue;
      }

      let attempt = 0;
      let succeeded = false;

      while (!succeeded) {
        attempt++;
        try {
          const stream = adapter.refineStream(request);
          const iterator = stream[Symbol.asyncIterator]();

          // First chunk timeout: TTFB (15s)
          let ttfbTimer: NodeJS.Timeout | null = null;
          const ttfbTimeout = new Promise<never>((_, reject) => {
            ttfbTimer = setTimeout(
              () => reject(new TimeoutError(providerName, this.ttfbTimeoutMs)),
              this.ttfbTimeoutMs
            );
          });

          const firstResult = await Promise.race([iterator.next(), ttfbTimeout]);
          if (ttfbTimer) clearTimeout(ttfbTimer);

          if (firstResult.done) {
            this.circuitBreaker.recordSuccess(providerName);
            succeeded = true;
            return;
          }

          // Initial chunk carrying provider disclosure
          yield {
            delta: firstResult.value.delta,
            done: false,
            tokensSoFar: firstResult.value.tokensSoFar,
            providerName,
            modelUsed: firstResult.value.modelUsed,
            streaming: firstResult.value.streaming,
          };

          // Subsequent chunks with inter-chunk timeout (10s)
          let done = false;
          let lastTokens = firstResult.value.tokensSoFar;
          let lastModel = firstResult.value.modelUsed;
          let lastStreaming = firstResult.value.streaming;
          let emittedDone = false;

          while (!done) {
            let interTimer: NodeJS.Timeout | null = null;
            const interTimeout = new Promise<never>((_, reject) => {
              interTimer = setTimeout(
                () => reject(new TimeoutError(providerName, this.interChunkTimeoutMs)),
                this.interChunkTimeoutMs
              );
            });

            const nextResult = await Promise.race([iterator.next(), interTimeout]);
            if (interTimer) clearTimeout(interTimer);

            if (nextResult.done) {
              done = true;
              break;
            }

            lastTokens = nextResult.value.tokensSoFar;
            lastModel = nextResult.value.modelUsed || lastModel;
            lastStreaming = nextResult.value.streaming || lastStreaming;
            const isDone = nextResult.value.done;

            if (isDone) {
              emittedDone = true;
            }

            yield {
              delta: nextResult.value.delta,
              done: isDone,
              tokensSoFar: lastTokens,
              providerName,
              modelUsed: lastModel,
              streaming: lastStreaming,
            };

            if (isDone) {
              done = true;
              break;
            }
          }

          if (!emittedDone) {
            yield {
              delta: '',
              done: true,
              tokensSoFar: lastTokens,
              providerName,
              modelUsed: lastModel,
              streaming: lastStreaming,
            };
          }

          this.circuitBreaker.recordSuccess(providerName);
          succeeded = true;
          return;
        } catch (err: any) {
          const providerErr =
            err instanceof ProviderError
              ? err
              : new ProviderError(providerName, err?.message || 'Unknown streaming error', 'stream_error', true);

          if (this.retryPolicy.shouldRetry(providerErr, attempt)) {
            const delay = this.retryPolicy.nextDelayMs(attempt, providerErr);
            if (delay > 0) {
              await new Promise((r) => setTimeout(r, delay));
            }
            continue;
          }

          this.circuitBreaker.recordFailure(providerName);
          attemptedProviders.push({ name: providerName, error: providerErr.message });
          break;
        }
      }
    }

    throw new OrchestrationError(attemptedProviders);
  }
}

export const orchestrator = new DefaultAIOrchestrator();
