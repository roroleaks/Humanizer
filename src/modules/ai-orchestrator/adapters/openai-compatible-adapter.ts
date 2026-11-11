import OpenAI from 'openai';
import {
  AIProviderName,
  ProviderHealth,
  RefinementRequest,
  RefinementResponse,
  RefinementChunk,
  StreamingAIProviderAdapter,
  MissingCredentialError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  ProviderUnavailableError,
  ProviderError,
} from '@/contracts/ai-provider';
import { CredentialSource, defaultCredentialSource } from '../credential-source';

export class OpenAICompatibleAdapter implements StreamingAIProviderAdapter {
  readonly name: AIProviderName = 'openai_compatible';
  private cachedHealth: { health: ProviderHealth; timestamp: number } | null = null;
  private readonly cacheTtlMs = 60 * 1000;

  constructor(
    private readonly credentialSource: CredentialSource = defaultCredentialSource,
    private readonly clientFactory?: (apiKey: string, baseURL?: string) => OpenAI
  ) {}

  private getClient(): OpenAI {
    const apiKey = this.credentialSource.getKey(this.name) || 'dummy-key';
    const baseURL =
      this.credentialSource.getBaseUrl?.(this.name) ||
      process.env.SH_AI_OPENAI_COMPATIBLE_BASE_URL?.trim();

    if (!baseURL && !this.credentialSource.getKey(this.name)) {
      throw new MissingCredentialError(this.name);
    }

    if (this.clientFactory) {
      return this.clientFactory(apiKey, baseURL);
    }

    return new OpenAI({
      apiKey,
      baseURL: baseURL || undefined,
      defaultHeaders: { 'User-Agent': 'ScientificHumanizer/0.1' },
      timeout: parseInt(process.env.SH_AI_TIMEOUT_MS || '60000', 10),
    });
  }

  private mapError(err: any): ProviderError {
    const status = err?.status || err?.statusCode;
    const message = err?.message || 'OpenAI-compatible endpoint request failed';

    if (status === 401 || status === 403 || /api[_\s]?key|auth|unauthorized/i.test(message)) {
      return new AuthenticationError(this.name);
    }
    if (status === 429 || /rate[_\s]?limit/i.test(message)) {
      const retryAfterHeader = err?.headers?.['retry-after'];
      const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : undefined;
      return new RateLimitError(this.name, retryAfterMs);
    }
    if (status === 408 || /timeout|ETIMEDOUT|ECONNABORTED/i.test(message)) {
      return new TimeoutError(this.name, parseInt(process.env.SH_AI_TIMEOUT_MS || '60000', 10));
    }
    if (status >= 500 || /unavailable|connection refused|ECONNREFUSED/i.test(message)) {
      return new ProviderUnavailableError(this.name, message);
    }
    return new ProviderError(this.name, message, 'openai_compatible_error', true);
  }

  async health(): Promise<ProviderHealth> {
    const now = Date.now();
    if (this.cachedHealth && now - this.cachedHealth.timestamp < this.cacheTtlMs) {
      return this.cachedHealth.health;
    }

    const key = this.credentialSource.getKey(this.name);
    const baseURL =
      this.credentialSource.getBaseUrl?.(this.name) ||
      process.env.SH_AI_OPENAI_COMPATIBLE_BASE_URL?.trim();

    if (!key && !baseURL) {
      const health: ProviderHealth = {
        name: this.name,
        status: 'unavailable',
        lastCheckedAt: new Date().toISOString(),
        notes: 'No base URL or API key configured — set SH_AI_OPENAI_COMPATIBLE_BASE_URL in .env.local',
      };
      this.cachedHealth = { health, timestamp: now };
      return health;
    }

    const start = Date.now();
    try {
      const client = this.getClient();
      try {
        await client.models.list();
      } catch {
        // Fall back to 1-token test if models.list is not implemented
        const model = process.env.SH_AI_OPENAI_COMPATIBLE_DEFAULT_MODEL || 'default';
        await client.chat.completions.create({
          model,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        });
      }
      const latencyMs = Date.now() - start;

      const health: ProviderHealth = {
        name: this.name,
        status: 'healthy',
        lastCheckedAt: new Date().toISOString(),
        latencyMs,
        notes: 'Endpoint reachable and responsive',
      };
      this.cachedHealth = { health, timestamp: now };
      return health;
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      const mapped = this.mapError(err);
      const isAuth = mapped instanceof AuthenticationError;

      const health: ProviderHealth = {
        name: this.name,
        status: isAuth ? 'unavailable' : 'degraded',
        lastCheckedAt: new Date().toISOString(),
        latencyMs,
        notes: mapped.message,
      };
      this.cachedHealth = { health, timestamp: now };
      return health;
    }
  }

  async refine(input: RefinementRequest): Promise<RefinementResponse> {
    const client = this.getClient();
    const model = process.env.SH_AI_OPENAI_COMPATIBLE_DEFAULT_MODEL || 'default';

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an academic writing intelligence engine. Style: ${input.styleProfile}. ${input.instructions}`,
          },
          {
            role: 'user',
            content: input.textToRefine,
          },
        ],
        temperature: 0.3,
      });

      const choice = response.choices[0];
      const refinedText = choice?.message?.content || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        providerName: this.name,
        modelUsed: response.model || model,
        refinedText,
        tokensUsed,
        finishReason: choice?.finish_reason || 'stop',
        warnings: [],
      };
    } catch (err: any) {
      throw this.mapError(err);
    }
  }

  async *refineStream(input: RefinementRequest): AsyncIterable<RefinementChunk> {
    const client = this.getClient();
    const model = process.env.SH_AI_OPENAI_COMPATIBLE_DEFAULT_MODEL || 'default';

    try {
      const stream = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an academic writing intelligence engine. Style: ${input.styleProfile}. ${input.instructions}`,
          },
          {
            role: 'user',
            content: input.textToRefine,
          },
        ],
        temperature: 0.3,
        stream: true,
      });

      let tokensSoFar = 0;
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          tokensSoFar += Math.ceil(delta.length / 4);
          yield {
            delta,
            done: false,
            tokensSoFar,
            providerName: this.name,
            modelUsed: model,
            streaming: 'native',
          };
        }
      }

      yield {
        delta: '',
        done: true,
        tokensSoFar,
        providerName: this.name,
        modelUsed: model,
        streaming: 'native',
      };
    } catch (err: any) {
      // If streaming is not supported by the custom endpoint, fallback to simulated streaming
      if (/stream|not supported|unsupported/i.test(err?.message || '')) {
        const res = await this.refine(input);
        yield {
          delta: res.refinedText,
          done: false,
          tokensSoFar: res.tokensUsed,
          providerName: this.name,
          modelUsed: model,
          streaming: 'simulated',
        };
        yield {
          delta: '',
          done: true,
          tokensSoFar: res.tokensUsed,
          providerName: this.name,
          modelUsed: model,
          streaming: 'simulated',
        };
        return;
      }
      throw this.mapError(err);
    }
  }
}
