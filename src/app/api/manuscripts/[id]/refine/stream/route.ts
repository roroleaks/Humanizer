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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const events = refinementEngine.runJob(jobId);
        for await (const event of events) {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }
      } catch (err: any) {
        const errorPayload = `data: ${JSON.stringify({
          type: 'job_failed',
          jobId,
          reason: err?.message || 'Unexpected stream failure',
        })}\n\n`;
        controller.enqueue(encoder.encode(errorPayload));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
