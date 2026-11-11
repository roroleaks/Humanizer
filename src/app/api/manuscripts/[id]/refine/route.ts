import { NextRequest, NextResponse } from 'next/server';
import { refinementRepository } from '@/modules/refinement-engine/repositories/refinement-repository';
import { refinementEngine } from '@/modules/refinement-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: manuscriptId } = await params;

  // 1. Consent verification (mandatory pre-condition)
  const hasConsent = await refinementRepository.hasConsent(manuscriptId);
  if (!hasConsent) {
    return NextResponse.json(
      {
        error: 'CONSENT_REQUIRED',
        message: 'Pre-refinement user consent is mandatory before initiating AI refinement.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const styleProfile = body.styleProfile || 'original_research';
    const intensity = body.intensity || 'standard';
    const primaryProvider = body.primaryProvider;

    const jobPlan = await refinementEngine.planJob({
      manuscriptId,
      styleProfile,
      intensity,
      primaryProvider,
    });

    return NextResponse.json({
      jobId: jobPlan.jobId,
      totalChunks: jobPlan.totalChunks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'PLANNING_FAILED', message: error?.message || 'Failed to plan refinement job' },
      { status: 500 }
    );
  }
}
