import { AIProviderName, ProviderHealth, StreamingAIProviderAdapter } from '@/contracts/ai-provider';

export interface HealthMonitorOptions {
  checkIntervalMs?: number;
  initialDelayMs?: number;
}

export class HealthMonitor {
  private readonly checkIntervalMs: number;
  private readonly initialDelayMs: number;
  private timer: NodeJS.Timeout | null = null;
  private readonly cachedHealth: Map<AIProviderName, ProviderHealth> = new Map();
  private isChecking = false;

  constructor(
    private readonly adapters: Map<AIProviderName, StreamingAIProviderAdapter>,
    options?: HealthMonitorOptions
  ) {
    this.checkIntervalMs =
      options?.checkIntervalMs ??
      parseInt(process.env.SH_AI_HEALTH_CHECK_INTERVAL_MS || '60000', 10);
    this.initialDelayMs = options?.initialDelayMs ?? 5000;
  }

  start(): void {
    if (this.timer) return;

    // Delayed initial check
    const bootTimer = setTimeout(() => {
      this.triggerHealthCheck().catch(() => {});
      this.timer = setInterval(() => {
        this.triggerHealthCheck().catch(() => {});
      }, this.checkIntervalMs);
      if (typeof this.timer === 'object' && 'unref' in this.timer) {
        this.timer.unref();
      }
    }, this.initialDelayMs);

    if (typeof bootTimer === 'object' && 'unref' in bootTimer) {
      bootTimer.unref();
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async triggerHealthCheck(): Promise<ProviderHealth[]> {
    if (this.isChecking) {
      return this.getAllCachedHealth();
    }

    this.isChecking = true;
    try {
      const promises = Array.from(this.adapters.values()).map(async (adapter) => {
        try {
          const health = await adapter.health();
          this.cachedHealth.set(adapter.name, health);
          return health;
        } catch (err: any) {
          const fallbackHealth: ProviderHealth = {
            name: adapter.name,
            status: 'unavailable',
            lastCheckedAt: new Date().toISOString(),
            notes: err?.message || 'Health probe failed',
          };
          this.cachedHealth.set(adapter.name, fallbackHealth);
          return fallbackHealth;
        }
      });

      return await Promise.all(promises);
    } finally {
      this.isChecking = false;
    }
  }

  getAllCachedHealth(): ProviderHealth[] {
    const list: ProviderHealth[] = [];
    const entries = Array.from(this.adapters.entries());
    for (const [name, adapter] of entries) {
      const cached = this.cachedHealth.get(name);
      if (cached) {
        list.push(cached);
      } else {
        list.push({
          name,
          status: 'unavailable',
          lastCheckedAt: new Date().toISOString(),
          notes: 'Pending initial health probe',
        });
      }
    }
    return list;
  }

  getProviderHealth(name: AIProviderName): ProviderHealth | null {
    return this.cachedHealth.get(name) || null;
  }
}
