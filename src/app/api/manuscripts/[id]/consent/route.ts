import { NextRequest, NextResponse } from 'next/server';
import { refinementRepository } from '@/modules/refinement-engine/repositories/refinement-repository';
import { processingEventRepository } from '@/lib/storage/repositories/processing-event-repository';

// Simple in-memory rate limiter: 1 request per second per IP
const consentRateLimiter = new Map<string, number>();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await context.params;
  const manuscriptId =
    resolvedParams?.id || request.nextUrl.pathname.split('/')[3] || 'active_manuscript';
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();

  const lastAttempt = consentRateLimiter.get(ip) || 0;
  if (now - lastAttempt < 1000) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', message: 'Too many consent requests. Please wait.' },
      { status: 429 }
    );
  }
  consentRateLimiter.set(ip, now);

  try {
    const body = await request.json().catch(() => ({}));
    const primaryProvider = body.primaryProvider || process.env.SH_AI_PRIMARY_PROVIDER || 'gemini';
    const fallbacks: string[] = Array.isArray(body.fallbacks) ? body.fallbacks : ['openai', 'anthropic'];

    const consentedDate = new Date();
    await refinementRepository.recordConsent(manuscriptId, consentedDate);

    // Record processing event without manuscript content (non-fatal if foreign keys differ across Lambdas)
    try {
      await processingEventRepository.logEvent(
        manuscriptId,
        'refinement_consent_granted',
        'info',
        `Consent granted for refinement via primary provider ${primaryProvider}. Fallbacks: ${fallbacks.join(', ')}.`
      );
    } catch (logError) {
      console.warn('Non-fatal event log failure during consent:', logError);
    }

    return NextResponse.json({
      consentedAt: consentedDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Consent recording error:', error);
    return NextResponse.json(
      { error: 'CONSENT_FAILED', message: error?.message || 'Failed to record consent' },
      { status: 500 }
    );
  }
}
