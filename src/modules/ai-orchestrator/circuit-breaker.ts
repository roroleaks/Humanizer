import { AIProviderName } from '@/contracts/ai-provider';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  failureWindowMs?: number;
  openDurationMs?: number;
}

interface ProviderCircuitRecord {
  state: CircuitState;
  failureTimestamps: number[];
  lastStateChange: number;
}

export interface CircuitBreaker {
  getState(providerName: AIProviderName): CircuitState;
  recordSuccess(providerName: AIProviderName): void;
  recordFailure(providerName: AIProviderName): void;
  allowRequest(providerName: AIProviderName): boolean;
  reset(providerName?: AIProviderName): void;
}

export class InMemoryCircuitBreaker implements CircuitBreaker {
  private readonly records: Map<AIProviderName, ProviderCircuitRecord> = new Map();
  private readonly failureThreshold: number;
  private readonly failureWindowMs: number;
  private readonly openDurationMs: number;

  constructor(options?: CircuitBreakerOptions) {
    this.failureThreshold =
      options?.failureThreshold ??
      parseInt(process.env.SH_AI_CIRCUIT_FAILURE_THRESHOLD || '5', 10);
    this.failureWindowMs =
      options?.failureWindowMs ??
      parseInt(process.env.SH_AI_CIRCUIT_FAILURE_WINDOW_MS || '60000', 10);
    this.openDurationMs =
      options?.openDurationMs ??
      parseInt(process.env.SH_AI_CIRCUIT_OPEN_DURATION_MS || '60000', 10);
  }

  private getRecord(name: AIProviderName): ProviderCircuitRecord {
    let rec = this.records.get(name);
    if (!rec) {
      rec = {
        state: 'CLOSED',
        failureTimestamps: [],
        lastStateChange: Date.now(),
      };
      this.records.set(name, rec);
    }
    return rec;
  }

  getState(providerName: AIProviderName): CircuitState {
    const rec = this.getRecord(providerName);
    const now = Date.now();

    // Check transition from OPEN -> HALF_OPEN
    if (rec.state === 'OPEN') {
      if (now - rec.lastStateChange >= this.openDurationMs) {
        rec.state = 'HALF_OPEN';
        rec.lastStateChange = now;
      }
    }

    return rec.state;
  }

  allowRequest(providerName: AIProviderName): boolean {
    const state = this.getState(providerName);
    return state === 'CLOSED' || state === 'HALF_OPEN';
  }

  recordSuccess(providerName: AIProviderName): void {
    const rec = this.getRecord(providerName);
    rec.state = 'CLOSED';
    rec.failureTimestamps = [];
    rec.lastStateChange = Date.now();
  }

  recordFailure(providerName: AIProviderName): void {
    const rec = this.getRecord(providerName);
    const now = Date.now();

    if (rec.state === 'HALF_OPEN') {
      rec.state = 'OPEN';
      rec.lastStateChange = now;
      return;
    }

    // Prune failures older than failureWindowMs
    const windowStart = now - this.failureWindowMs;
    rec.failureTimestamps = rec.failureTimestamps.filter((t) => t > windowStart);
    rec.failureTimestamps.push(now);

    if (rec.failureTimestamps.length >= this.failureThreshold) {
      rec.state = 'OPEN';
      rec.lastStateChange = now;
    }
  }

  reset(providerName?: AIProviderName): void {
    if (providerName) {
      this.records.delete(providerName);
    } else {
      this.records.clear();
    }
  }
}

export const defaultCircuitBreaker = new InMemoryCircuitBreaker();
