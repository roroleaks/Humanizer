/**
 * In-Memory Sliding-Window Rate Limiter
 * 
 * Provides IP-based rate limiting for document intake endpoints.
 * Structured interface allows seamless swapping for Redis-backed store in Phase 9.
 */

export interface RateLimiterOptions {
  limit?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly defaultLimit: number;
  private readonly windowMs: number;

  constructor() {
    this.defaultLimit = parseInt(process.env.SH_RATE_LIMIT_PER_MINUTE || '20', 10);
    this.windowMs = 60 * 1000; // 1 minute window

    // Periodically clean up stale records every 5 minutes
    if (typeof setInterval !== 'undefined') {
      const interval = setInterval(() => {
        const now = Date.now();
        const entries = Array.from(this.requests.entries());
        for (const [key, timestamps] of entries) {
          const fresh = timestamps.filter((t: number) => now - t < this.windowMs);
          if (fresh.length === 0) {
            this.requests.delete(key);
          } else {
            this.requests.set(key, fresh);
          }
        }
      }, 5 * 60 * 1000);
      if (typeof interval === 'object' && 'unref' in interval) {
        interval.unref();
      }
    }
  }

  /**
   * Evaluates rate limit for a client identifier (e.g. IP address).
   */
  check(identifier: string, options?: RateLimiterOptions): RateLimitResult {
    const limit = options?.limit ?? this.defaultLimit;
    const windowMs = options?.windowMs ?? this.windowMs;
    const now = Date.now();

    const existing = this.requests.get(identifier) || [];
    const windowStart = now - windowMs;
    const freshTimestamps = existing.filter((t) => t > windowStart);

    if (freshTimestamps.length >= limit) {
      const oldestInWindow = freshTimestamps[0] || now;
      const resetMs = Math.max(0, oldestInWindow + windowMs - now);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetMs,
      };
    }

    freshTimestamps.push(now);
    this.requests.set(identifier, freshTimestamps);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - freshTimestamps.length),
      resetMs: windowMs,
    };
  }
}

export const rateLimiter = new InMemoryRateLimiter();
