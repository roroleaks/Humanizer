import { GoogleGenerativeAI } from '@google/generative-ai';
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

export class GeminiAdapter implements StreamingAIProviderAdapter {
  readonly name: AIProviderName = 'gemini';
  private cachedHealth: { health: ProviderHealth; timestamp: number } | null = null;
  private readonly cacheTtlMs = 60 * 1000;

  constructor(
    private readonly credentialSource: CredentialSource = defaultCredentialSource,
    private readonly clientFactory?: (apiKey: string) => GoogleGenerativeAI
  ) {}

  private getClient(): GoogleGenerativeAI {
    const apiKey = this.credentialSource.getKey(this.name);
    if (!apiKey) {
      throw new MissingCredentialError(this.name);
    }
    if (this.clientFactory) {
      return this.clientFactory(apiKey);
    }
    return new GoogleGenerativeAI(apiKey);
  }

  private mapError(err: any): ProviderError {
    const status = err?.status || err?.statusCode;
    const message = err?.message || 'Google Gemini request failed';

    if (
      status === 400 && /API_KEY_INVALID|key not valid/i.test(message) ||
      status === 401 ||
      status === 403 ||
      /permission denied|unauthorized/i.test(message)
    ) {
      return new AuthenticationError(this.name);
    }
    if (status === 429 || /RESOURCE_EXHAUSTED|rate[_\s]?limit|quota/i.test(message)) {
      return new RateLimitError(this.name);
    }
    if (status === 408 || /timeout|deadline exceeded/i.test(message)) {
      return new TimeoutError(this.name, parseInt(process.env.SH_AI_TIMEOUT_MS || '60000', 10));
    }
    if (status >= 500 || /unavailable|internal server error/i.test(message)) {
      return new ProviderUnavailableError(this.name, message);
    }
    return new ProviderError(this.name, message, 'gemini_error', true);
  }

  async health(): Promise<ProviderHealth> {
    const now = Date.now();
    if (this.cachedHealth && now - this.cachedHealth.timestamp < this.cacheTtlMs) {
      return this.cachedHealth.health;
    }

    const key = this.credentialSource.getKey(this.name);
    if (!key) {
      const health: ProviderHealth = {
        name: this.name,
        status: 'unavailable',
        lastCheckedAt: new Date().toISOString(),
        notes: 'No API key configured — add SH_AI_GEMINI_API_KEY to .env.local to enable',
      };
      this.cachedHealth = { health, timestamp: now };
      return health;
    }

    const start = Date.now();
    try {
      const client = this.getClient();
      const modelName = process.env.SH_AI_GEMINI_DEFAULT_MODEL || 'gemini-1.5-pro';
      const model = client.getGenerativeModel({ model: modelName });

      // 1-token synthetic probe
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 1 },
      });
      const latencyMs = Date.now() - start;

      const health: ProviderHealth = {
        name: this.name,
        status: 'healthy',
        lastCheckedAt: new Date().toISOString(),
        latencyMs,
        notes: 'Configured and responsive',
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
    const modelName = process.env.SH_AI_GEMINI_DEFAULT_MODEL || 'gemini-1.5-pro';
    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction: `You are an academic writing intelligence engine. Style: ${input.styleProfile}. ${input.instructions}`,
    });

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: input.textToRefine }] }],
        generationConfig: {
          temperature: 0.3,
        },
      });

      const response = result.response;
      const refinedText = response.text() || '';
      const tokensUsed = response.usageMetadata?.totalTokenCount || 0;

      return {
        providerName: this.name,
        modelUsed: modelName,
        refinedText,
        tokensUsed,
        finishReason: 'stop',
        warnings: [],
      };
    } catch (err: any) {
      throw this.mapError(err);
    }
  }

  async *refineStream(input: RefinementRequest): AsyncIterable<RefinementChunk> {
    const client = this.getClient();
    const modelName = process.env.SH_AI_GEMINI_DEFAULT_MODEL || 'gemini-1.5-pro';
    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction: `You are an academic writing intelligence engine. Style: ${input.styleProfile}. ${input.instructions}`,
    });

    try {
      const streamResult = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: input.textToRefine }] }],
        generationConfig: {
          temperature: 0.3,
        },
      });

      let tokensSoFar = 0;
      for await (const chunk of streamResult.stream) {
        const delta = chunk.text() || '';
        if (delta) {
          tokensSoFar += Math.ceil(delta.length / 4);
          yield {
            delta,
            done: false,
            tokensSoFar,
            providerName: this.name,
            modelUsed: modelName,
            streaming: 'native',
          };
        }
      }

      yield {
        delta: '',
        done: true,
        tokensSoFar,
        providerName: this.name,
        modelUsed: modelName,
        streaming: 'native',
      };
    } catch (err: any) {
      throw this.mapError(err);
    }
  }
}
