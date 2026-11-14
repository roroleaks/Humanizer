import { NextRequest, NextResponse } from 'next/server';
import { refinementEngine } from '@/modules/refinement-engine';
import { manuscriptRepository } from '@/lib/storage/repositories';
import { refinementRepository } from '@/modules/refinement-engine/repositories/refinement-repository';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await context.params;
  const manuscriptId =
    resolvedParams?.id || request.nextUrl.pathname.split('/')[3] || 'active_manuscript';

  const body = await request.json().catch(() => ({}));
  const styleProfile = body.styleProfile || 'original_research';
  const intensity = body.intensity || 'standard';
  const primaryProvider = body.primaryProvider || 'gemini';

  // 1. Self-heal manuscript in current container SQLite if absent
  const existingManuscript = await manuscriptRepository.getManuscriptById(manuscriptId);
  if (!existingManuscript) {
    await manuscriptRepository.createManuscript({
      id: manuscriptId,
      title: body.manuscript?.title || 'Active Manuscript',
      status: 'parsed',
      sourceType: body.manuscript?.sourceType || 'text',
      pageCount: body.manuscript?.pageCount || 1,
      pageCountConfidence: body.manuscript?.pageCountConfidence || 'verified',
      wordCount: body.manuscript?.wordCount || 0,
      ocrUsed: false,
      styleProfile: body.manuscript?.styleProfile || styleProfile,
      primaryProvider,
      refinementConsentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // 2. Self-heal sections in current container SQLite if absent
  if (body.sections && Array.isArray(body.sections) && body.sections.length > 0) {
    const existing = await manuscriptRepository.getManuscriptById(manuscriptId);
    if (!existing || existing.sections.length === 0) {
      await manuscriptRepository.saveParsedSections(
        body.sections.map((s: any, idx: number) => ({
          id: s.id || `sec_${manuscriptId}_${idx}`,
          manuscriptId,
          parentId: s.parentId || null,
          type: s.type || 'section',
          title: s.title || `Section ${idx + 1}`,
          orderIndex: s.orderIndex ?? idx,
          content: s.content || '',
          tableData: s.tableData ? JSON.stringify(s.tableData) : null,
          rawHtml: s.rawHtml || null,
          charCount: (s.content || '').length,
          createdAt: new Date(),
        }))
      );
    }
  }

  // 3. Ensure consent is recorded in current container
  await refinementRepository.recordConsent(manuscriptId);

  // 4. Plan refinement job in current container
  const jobPlan = await refinementEngine.planJob({
    manuscriptId,
    styleProfile,
    intensity,
    primaryProvider,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const events = refinementEngine.runJob(jobPlan.jobId);
        for await (const event of events) {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }
      } catch (err: any) {
        const errorPayload = `data: ${JSON.stringify({
          type: 'job_failed',
          jobId: jobPlan.jobId,
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
