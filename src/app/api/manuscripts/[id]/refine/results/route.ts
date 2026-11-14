import { NextRequest, NextResponse } from 'next/server';
import { refinementEngine } from '@/modules/refinement-engine';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  await context.params;
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'MISSING_JOB_ID', message: 'Query parameter jobId is required.' },
      { status: 400 }
    );
  }

  try {
    const status = await refinementEngine.getJobStatus(jobId);
    if (status.status !== 'completed' && status.completedChunks === 0) {
      return NextResponse.json(
        {
          error: 'JOB_NOT_COMPLETE',
          message: `Job ${jobId} is currently ${status.status}. Results are not available yet.`,
        },
        { status: 409 }
      );
    }

    const results = await refinementEngine.getJobResults(jobId);
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'RESULTS_FETCH_FAILED', message: error?.message || 'Could not retrieve refinement results' },
      { status: 404 }
    );
  }
}
