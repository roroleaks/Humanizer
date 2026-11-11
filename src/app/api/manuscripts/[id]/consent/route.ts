import { NextRequest, NextResponse } from 'next/server';
import { refinementRepository } from '@/modules/refinement-engine/repositories/refinement-repository';
import { processingEventRepository } from '@/lib/storage/repositories/processing-event-repository';

// Simple in-memory rate limiter: 1 request per second per IP
const consentRateLimiter = new Map<string, number>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: manuscriptId } = await params;
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

    // Record processing event without manuscript content
    await processingEventRepository.recordEvent({
      manuscriptId,
      eventType: 'refinement_consent_granted',
      eventSeverity: 'info',
      detail: `Consent granted for refinement via primary provider ${primaryProvider}. Fallbacks: ${fallbacks.join(', ')}.`,
    });

    return NextResponse.json({
      consentedAt: consentedDate.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'CONSENT_FAILED', message: error?.message || 'Failed to record consent' },
      { status: 500 }
    );
  }
}
