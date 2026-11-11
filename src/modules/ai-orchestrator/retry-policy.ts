import { ProviderError, RateLimitError } from '@/contracts/ai-provider';

export interface RetryPolicy {
  nextDelayMs(attempt: number, lastError: ProviderError): number;
  shouldRetry(error: ProviderError, attempt: number): boolean;
}

export interface ExponentialBackoffOptions {
  baseDelayMs?: number;
  factor?: number;
  maxRetries?: number;
  jitterRatio?: number;
}

export class ExponentialBackoffWithJitterPolicy implements RetryPolicy {
  private readonly baseDelayMs: number;
  private readonly factor: number;
  private readonly maxRetries: number;
  private readonly jitterRatio: number;

  constructor(options?: ExponentialBackoffOptions) {
    this.baseDelayMs = options?.baseDelayMs ?? 500;
    this.factor = options?.factor ?? 2;
    this.maxRetries =
      options?.maxRetries ??
      parseInt(process.env.SH_AI_MAX_RETRIES || '3', 10);
    this.jitterRatio = options?.jitterRatio ?? 0.25; // ±25%
  }

  shouldRetry(error: ProviderError, attempt: number): boolean {
    if (!error.retryable) {
      return false;
    }
    return attempt < this.maxRetries;
  }

  nextDelayMs(attempt: number, lastError: ProviderError): number {
    // If provider returned explicit retry-after header
    if (lastError instanceof RateLimitError && lastError.retryAfterMs !== undefined) {
      return Math.max(0, lastError.retryAfterMs);
    }

    // exponential calculation: base * factor^(attempt - 1)
    const nominalDelay = this.baseDelayMs * Math.pow(this.factor, Math.max(0, attempt - 1));
    const jitterRange = nominalDelay * this.jitterRatio;
    const jitter = (Math.random() * 2 - 1) * jitterRange;

    return Math.max(0, Math.round(nominalDelay + jitter));
  }
}

export class NoDelayRetryPolicy implements RetryPolicy {
  constructor(private readonly maxRetries = 3) {}

  shouldRetry(error: ProviderError, attempt: number): boolean {
    return error.retryable && attempt < this.maxRetries;
  }

  nextDelayMs(_attempt: number, _lastError: ProviderError): number {
    return 0;
  }
}
