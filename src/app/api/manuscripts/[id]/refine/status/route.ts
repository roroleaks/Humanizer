import { NextRequest, NextResponse } from 'next/server';
import { refinementEngine } from '@/modules/refinement-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // Consume params
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
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'STATUS_FETCH_FAILED', message: error?.message || 'Could not fetch job status' },
      { status: 404 }
    );
  }
}
