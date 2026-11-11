import { NextRequest, NextResponse } from 'next/server';
import { AIProviderName } from '@/contracts/ai-provider';
import { orchestrator, defaultCredentialSource, defaultCircuitBreaker, CircuitState } from '@/modules/ai-orchestrator';
import { rateLimiter } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

const PROVIDER_METADATA: Record<
  AIProviderName,
  { displayName: string; defaultModel: string; dataRetentionPolicyUrl: string }
> = {
  openai: {
    displayName: 'OpenAI Enterprise (GPT-4o)',
    defaultModel: process.env.SH_AI_OPENAI_DEFAULT_MODEL || 'gpt-4o',
    dataRetentionPolicyUrl: 'https://openai.com/enterprise-privacy',
  },
  gemini: {
    displayName: 'Google Gemini (1.5 Pro)',
    defaultModel: process.env.SH_AI_GEMINI_DEFAULT_MODEL || 'gemini-1.5-pro',
    dataRetentionPolicyUrl: 'https://cloud.google.com/terms/data-retention',
  },
  anthropic: {
    displayName: 'Anthropic Claude (3.5 Sonnet)',
    defaultModel: process.env.SH_AI_ANTHROPIC_DEFAULT_MODEL || 'claude-3-5-sonnet-latest',
    dataRetentionPolicyUrl: 'https://www.anthropic.com/prioritizing-privacy',
  },
  openai_compatible: {
    displayName: 'Custom OpenAI-Compatible Endpoint',
    defaultModel: process.env.SH_AI_OPENAI_COMPATIBLE_DEFAULT_MODEL || 'default',
    dataRetentionPolicyUrl: 'https://example.com/custom-privacy',
  },
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  // Rate limit: 1 health check probe per 10 seconds per IP
  const rateLimit = rateLimiter.check(`health-check:${ip}`, { limit: 1, windowMs: 10000 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Health checks may be triggered at most once every 10 seconds.' },
      { status: 429 }
    );
  }

  try {
    await orchestrator.triggerHealthCheck();
    const healthList = await orchestrator.getProviderHealth();
    const chain = orchestrator.getOrchestrationChain();

    const providerNames: AIProviderName[] = ['openai', 'gemini', 'anthropic', 'openai_compatible'];

    const providers = providerNames.map((name) => {
      const meta = PROVIDER_METADATA[name];
      const hasKey = !!defaultCredentialSource.getKey(name);
      const hasBaseUrl = !!defaultCredentialSource.getBaseUrl?.(name);
      const configured = hasKey || (name === 'openai_compatible' && hasBaseUrl);

      const health = healthList.find((h) => h.name === name) || null;
      const circuitState: CircuitState = defaultCircuitBreaker.getState(name);

      return {
        name,
        displayName: meta.displayName,
        defaultModel: meta.defaultModel,
        configured,
        health,
        circuitState,
        dataRetentionPolicyUrl: meta.dataRetentionPolicyUrl,
      };
    });

    return NextResponse.json({
      providers,
      orchestration: {
        primary: chain.primary,
        fallbacks: chain.fallbacks,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to refresh provider health.', detail: error?.message },
      { status: 500 }
    );
  }
}
