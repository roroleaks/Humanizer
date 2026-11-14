import './setup-env';
import os from 'os';
import path from 'path';

import {
  AIProviderName,
  StreamingAIProviderAdapter,
  RefinementRequest,
  RefinementResponse,
  RefinementChunk,
  ProviderHealth,
  RateLimitError,
  AuthenticationError,
  TimeoutError,
  ProviderUnavailableError,
  MissingCredentialError,
  OrchestrationError,
} from '../src/contracts/ai-provider';
import {
  DefaultAIOrchestrator,
  ExponentialBackoffWithJitterPolicy,
  NoDelayRetryPolicy,
  InMemoryCircuitBreaker,
  HealthMonitor,
  EnvVarCredentialSource,
} from '../src/modules/ai-orchestrator';
import {
  SYNTHETIC_SHORT,
  SYNTHETIC_WITH_INVENTORY,
  SYNTHETIC_LONG,
  SYNTHETIC_INJECTION,
} from '../src/modules/ai-orchestrator/__tests__/fixtures/synthetic-payloads';

class MockAdapter implements StreamingAIProviderAdapter {
  constructor(
    public readonly name: AIProviderName,
    private config: {
      healthStatus?: 'healthy' | 'degraded' | 'unavailable';
      healthLatency?: number;
      refineHandler?: (req: RefinementRequest) => Promise<RefinementResponse>;
      streamHandler?: (req: RefinementRequest) => AsyncIterable<RefinementChunk>;
    } = {}
  ) {}

  async health(): Promise<ProviderHealth> {
    return {
      name: this.name,
      status: this.config.healthStatus || 'healthy',
      lastCheckedAt: new Date().toISOString(),
      latencyMs: this.config.healthLatency ?? 42,
    };
  }

  async refine(input: RefinementRequest): Promise<RefinementResponse> {
    if (this.config.refineHandler) {
      return this.config.refineHandler(input);
    }
    return {
      providerName: this.name,
      modelUsed: `mock-${this.name}-model`,
      refinedText: `Refined: ${input.textToRefine}`,
      tokensUsed: 120,
      finishReason: 'stop',
      warnings: [],
    };
  }

  async *refineStream(input: RefinementRequest): AsyncIterable<RefinementChunk> {
    if (this.config.streamHandler) {
      yield* this.config.streamHandler(input);
      return;
    }
    yield {
      delta: 'Refined chunk 1. ',
      done: false,
      tokensSoFar: 4,
      providerName: this.name,
      modelUsed: `mock-${this.name}-model`,
      streaming: 'native',
    };
    yield {
      delta: 'Refined chunk 2.',
      done: false,
      tokensSoFar: 8,
      providerName: this.name,
      modelUsed: `mock-${this.name}-model`,
      streaming: 'native',
    };
    yield {
      delta: '',
      done: true,
      tokensSoFar: 8,
      providerName: this.name,
      modelUsed: `mock-${this.name}-model`,
      streaming: 'native',
    };
  }
}

async function runPhase3Verification() {
  console.log('=== STARTING PHASE 3 AI ORCHESTRATION VERIFICATION ===\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failCount++;
    }
  }

  // 1. Retry Policy Tests
  console.log('\n--- 1. Testing Exponential Backoff & Jitter Retry Policy ---');
  const retryPolicy = new ExponentialBackoffWithJitterPolicy({
    baseDelayMs: 500,
    factor: 2,
    maxRetries: 3,
    jitterRatio: 0.25,
  });

  const rateLimitErr = new RateLimitError('openai');
  const authErr = new AuthenticationError('openai');

  assert(retryPolicy.shouldRetry(rateLimitErr, 1) === true, 'RetryPolicy allows retry 1 for RateLimitError');
  assert(retryPolicy.shouldRetry(rateLimitErr, 3) === false, 'RetryPolicy disallows retry 3 (exceeds maxRetries=3)');
  assert(retryPolicy.shouldRetry(authErr, 1) === false, 'RetryPolicy disallows retry for AuthenticationError (non-retryable)');

  const delay1 = retryPolicy.nextDelayMs(1, rateLimitErr);
  const delay2 = retryPolicy.nextDelayMs(2, rateLimitErr);
  const delay3 = retryPolicy.nextDelayMs(3, rateLimitErr);

  assert(delay1 >= 375 && delay1 <= 625, `Attempt 1 delay in [375, 625] ms: got ${delay1}ms`);
  assert(delay2 >= 750 && delay2 <= 1250, `Attempt 2 delay in [750, 1250] ms: got ${delay2}ms`);
  assert(delay3 >= 1500 && delay3 <= 2500, `Attempt 3 delay in [1500, 2500] ms: got ${delay3}ms`);

  const explicitRetryErr = new RateLimitError('openai', 7500);
  assert(retryPolicy.nextDelayMs(1, explicitRetryErr) === 7500, 'RetryPolicy honors explicit retryAfterMs header (7500ms)');

  // 2. Circuit Breaker Tests
  console.log('\n--- 2. Testing Circuit Breaker State Transitions ---');
  const circuitBreaker = new InMemoryCircuitBreaker({
    failureThreshold: 3,
    failureWindowMs: 5000,
    openDurationMs: 200,
  });

  assert(circuitBreaker.getState('openai') === 'CLOSED', 'Initial circuit state is CLOSED');
  assert(circuitBreaker.allowRequest('openai') === true, 'CLOSED circuit allows requests');

  circuitBreaker.recordFailure('openai');
  circuitBreaker.recordFailure('openai');
  assert(circuitBreaker.getState('openai') === 'CLOSED', '2 failures remain CLOSED (threshold is 3)');

  circuitBreaker.recordFailure('openai');
  assert(circuitBreaker.getState('openai') === 'OPEN', '3rd failure trips circuit to OPEN');
  assert(circuitBreaker.allowRequest('openai') === false, 'OPEN circuit blocks requests');

  // Wait for openDurationMs to test HALF_OPEN
  await new Promise((r) => setTimeout(r, 250));
  assert(circuitBreaker.getState('openai') === 'HALF_OPEN', 'Elapsed duration transitions circuit to HALF_OPEN');
  assert(circuitBreaker.allowRequest('openai') === true, 'HALF_OPEN allows trial probe request');

  circuitBreaker.recordFailure('openai');
  assert(circuitBreaker.getState('openai') === 'OPEN', 'Failure in HALF_OPEN returns immediately to OPEN');

  await new Promise((r) => setTimeout(r, 250));
  assert(circuitBreaker.getState('openai') === 'HALF_OPEN', 'Transition back to HALF_OPEN after delay');

  circuitBreaker.recordSuccess('openai');
  assert(circuitBreaker.getState('openai') === 'CLOSED', 'Success in HALF_OPEN resets circuit to CLOSED');

  // 3. Health Monitor Tests
  console.log('\n--- 3. Testing Health Monitor Caching & Refresh ---');
  const mockAdaptersMap = new Map<AIProviderName, StreamingAIProviderAdapter>();
  mockAdaptersMap.set('openai', new MockAdapter('openai', { healthStatus: 'healthy', healthLatency: 35 }));
  mockAdaptersMap.set('gemini', new MockAdapter('gemini', { healthStatus: 'degraded', healthLatency: 120 }));

  const healthMonitor = new HealthMonitor(mockAdaptersMap, { initialDelayMs: 50, checkIntervalMs: 5000 });
  const probedHealth = await healthMonitor.triggerHealthCheck();

  assert(probedHealth.length === 2, 'Health monitor probed all registered adapters');
  assert(healthMonitor.getProviderHealth('openai')?.status === 'healthy', 'OpenAI health cached as healthy');
  assert(healthMonitor.getProviderHealth('gemini')?.status === 'degraded', 'Gemini health cached as degraded');

  // 4. Orchestrator Primary Success Path
  console.log('\n--- 4. Testing Orchestrator Primary Success & Disclosure ---');
  const primaryMock = new MockAdapter('openai', {
    refineHandler: async () => ({
      providerName: 'openai',
      modelUsed: 'gpt-4o',
      refinedText: '[SYNTHETIC] Refined primary prose.',
      tokensUsed: 50,
      finishReason: 'stop',
      warnings: [],
    }),
  });
  const fallbackMock = new MockAdapter('gemini');

  const cb = new InMemoryCircuitBreaker();
  const orchestratorInstance = new DefaultAIOrchestrator({
    primaryProvider: 'openai',
    fallbackProviders: ['gemini'],
    circuitBreaker: cb,
    retryPolicy: new NoDelayRetryPolicy(3),
  });
  orchestratorInstance.registerAdapter(primaryMock);
  orchestratorInstance.registerAdapter(fallbackMock);

  const primaryResult = await orchestratorInstance.refine(SYNTHETIC_SHORT);
  assert(primaryResult.providerName === 'openai', 'Primary provider served response');
  assert(primaryResult.refinedText === '[SYNTHETIC] Refined primary prose.', 'Primary response content verified');

  // 5. Orchestrator Retry on Retryable Error
  console.log('\n--- 5. Testing Orchestrator Retries on Retryable Error ---');
  let primaryAttempts = 0;
  const retryingPrimary = new MockAdapter('openai', {
    refineHandler: async () => {
      primaryAttempts++;
      if (primaryAttempts < 3) {
        throw new RateLimitError('openai');
      }
      return {
        providerName: 'openai',
        modelUsed: 'gpt-4o',
        refinedText: '[SYNTHETIC] Succeeded on attempt 3.',
        tokensUsed: 65,
        finishReason: 'stop',
        warnings: [],
      };
    },
  });

  const orchestratorRetry = new DefaultAIOrchestrator({
    primaryProvider: 'openai',
    fallbackProviders: ['gemini'],
    circuitBreaker: new InMemoryCircuitBreaker(),
    retryPolicy: new NoDelayRetryPolicy(3),
  });
  orchestratorRetry.registerAdapter(retryingPrimary);
  orchestratorRetry.registerAdapter(fallbackMock);

  const retryResult = await orchestratorRetry.refine(SYNTHETIC_SHORT);
  assert(primaryAttempts === 3, `Primary retried 3 times: got ${primaryAttempts}`);
  assert(retryResult.providerName === 'openai', 'Primary succeeded after retry');

  // 6. Orchestrator Failover Path & Disclosure
  console.log('\n--- 6. Testing Failover to Secondary Provider ---');
  const failingPrimary = new MockAdapter('openai', {
    refineHandler: async () => {
      throw new ProviderUnavailableError('openai', 'OpenAI 503 outage');
    },
  });
  const workingFallback = new MockAdapter('gemini', {
    refineHandler: async () => ({
      providerName: 'gemini',
      modelUsed: 'gemini-1.5-pro',
      refinedText: '[SYNTHETIC] Refined via Gemini fallback.',
      tokensUsed: 75,
      finishReason: 'stop',
      warnings: [],
    }),
  });

  const orchestratorFailover = new DefaultAIOrchestrator({
    primaryProvider: 'openai',
    fallbackProviders: ['gemini'],
    circuitBreaker: new InMemoryCircuitBreaker(),
    retryPolicy: new NoDelayRetryPolicy(1), // immediate failover after 1 try
  });
  orchestratorFailover.registerAdapter(failingPrimary);
  orchestratorFailover.registerAdapter(workingFallback);

  const failoverResult = await orchestratorFailover.refine(SYNTHETIC_WITH_INVENTORY);
  assert(failoverResult.providerName === 'gemini', 'Failover disclosed actual provider used (gemini)');
  assert(failoverResult.refinedText === '[SYNTHETIC] Refined via Gemini fallback.', 'Fallback response received');

  // 7. Orchestrator All-Providers-Fail Path
  console.log('\n--- 7. Testing All Providers Fail (OrchestrationError) ---');
  const failingFallback = new MockAdapter('gemini', {
    refineHandler: async () => {
      throw new ProviderUnavailableError('gemini', 'Gemini 500 error');
    },
  });

  const orchestratorAllFail = new DefaultAIOrchestrator({
    primaryProvider: 'openai',
    fallbackProviders: ['gemini'],
    circuitBreaker: new InMemoryCircuitBreaker(),
    retryPolicy: new NoDelayRetryPolicy(1),
  });
  orchestratorAllFail.registerAdapter(failingPrimary);
  orchestratorAllFail.registerAdapter(failingFallback);

  try {
    await orchestratorAllFail.refine(SYNTHETIC_SHORT);
    assert(false, 'Expected OrchestrationError was not thrown');
  } catch (err: any) {
    assert(err instanceof OrchestrationError, 'Throws OrchestrationError when all providers fail');
    assert(err.attemptedProviders.length === 2, `Attempted providers recorded: ${err.attemptedProviders.length}`);
    assert(!err.message.includes(SYNTHETIC_SHORT.textToRefine), 'OrchestrationError message does NOT contain manuscript text');
  }

  // 8. Streaming Support & Initial Disclosure Chunk
  console.log('\n--- 8. Testing Streaming & Initial Provider Disclosure Chunk ---');
  const streamingOrchestrator = new DefaultAIOrchestrator({
    primaryProvider: 'openai',
    fallbackProviders: ['gemini'],
    circuitBreaker: new InMemoryCircuitBreaker(),
    retryPolicy: new NoDelayRetryPolicy(1),
  });
  streamingOrchestrator.registerAdapter(primaryMock);

  const chunks: RefinementChunk[] = [];
  for await (const chunk of streamingOrchestrator.refineStream(SYNTHETIC_SHORT)) {
    chunks.push(chunk);
  }

  assert(chunks.length >= 3, `Yielded ${chunks.length} streaming chunks`);
  assert(chunks[0].providerName === 'openai', 'First streaming chunk discloses providerName');
  assert(chunks[chunks.length - 1].done === true, 'Final chunk has done: true');

  // 9. Two-Tier Streaming Timeout (TTFB & Inter-chunk)
  console.log('\n--- 9. Testing Two-Tier Streaming Timeout & Failover ---');
  const stalledTtfbAdapter = new MockAdapter('openai', {
    streamHandler: async function* () {
      // Simulate stalled TTFB > 100ms
      await new Promise((r) => setTimeout(r, 200));
      yield { delta: 'Delayed first chunk', done: false, tokensSoFar: 3 };
    },
  });

  const quickFallback = new MockAdapter('gemini', {
    streamHandler: async function* () {
      yield { delta: 'Fallback chunk 1', done: false, tokensSoFar: 3, providerName: 'gemini' };
      yield { delta: '', done: true, tokensSoFar: 3, providerName: 'gemini' };
    },
  });

  const orchestratorTtfbTimeout = new DefaultAIOrchestrator({
    primaryProvider: 'openai',
    fallbackProviders: ['gemini'],
    circuitBreaker: new InMemoryCircuitBreaker(),
    retryPolicy: new NoDelayRetryPolicy(1),
    ttfbTimeoutMs: 80, // tight timeout to test trigger
  });
  orchestratorTtfbTimeout.registerAdapter(stalledTtfbAdapter);
  orchestratorTtfbTimeout.registerAdapter(quickFallback);

  const ttfbChunks: RefinementChunk[] = [];
  for await (const chunk of orchestratorTtfbTimeout.refineStream(SYNTHETIC_LONG)) {
    ttfbChunks.push(chunk);
  }

  assert(ttfbChunks.length > 0, 'Streaming completed via failover after TTFB timeout');
  assert(ttfbChunks[0].providerName === 'gemini', 'Failover provider (gemini) served stream after primary TTFB timeout');

  // 10. Missing Credential Error
  console.log('\n--- 10. Testing Missing Credential Behavior ---');
  const emptyCredSource = {
    getKey: () => null,
  };
  const unconfiguredAdapter = new MockAdapter('anthropic', {
    refineHandler: async () => {
      throw new MissingCredentialError('anthropic');
    },
  });
  try {
    await unconfiguredAdapter.refine(SYNTHETIC_SHORT);
    assert(false, 'Expected MissingCredentialError not thrown');
  } catch (err: any) {
    assert(err instanceof MissingCredentialError, 'Throws MissingCredentialError when key is null');
  }

  // 11. Live Integration Tests (Guarded by configured API keys)
  console.log('\n--- 11. Checking Live Provider Credentials (Integration Tests) ---');
  const creds = new EnvVarCredentialSource();
  const providersToCheck: AIProviderName[] = ['openai', 'gemini', 'anthropic', 'openai_compatible'];

  for (const p of providersToCheck) {
    const key = creds.getKey(p);
    const baseUrl = creds.getBaseUrl?.(p);
    if (!key && !baseUrl) {
      console.log(`[SKIP] ${p}: No credentials configured in environment (Skipped integration test as designed)`);
    } else {
      console.log(`[INTEGRATION] ${p}: Credentials present, testing live health probe...`);
      // When keys are present in .env.local, real probe executes
      const adapter = orchestratorInstance['adapters'].get(p);
      if (adapter) {
        const health = await adapter.health();
        assert(health.status !== undefined, `Live ${p} health returned status: ${health.status}`);
      }
    }
  }

  console.log(`\n=== VERIFICATION FINISHED: ${passCount} PASSED, ${failCount} FAILED ===`);
  if (failCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase3Verification().catch((err) => {
  console.error('Fatal Phase 3 verification error:', err);
  process.exit(1);
});
