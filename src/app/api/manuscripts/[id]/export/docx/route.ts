import { NextRequest, NextResponse } from 'next/server';
import { manuscriptRepository } from '@/lib/storage/repositories';
import { refinementEngine } from '@/modules/refinement-engine';
import { refinementRepository } from '@/modules/refinement-engine/repositories/refinement-repository';
import { generateManuscriptDocx } from '@/modules/docx-exporter/docx-generator';
import { ManuscriptWithRelations } from '@/contracts/manuscript';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
): Promise<Response> {
  try {
    const params = await context.params;
    const { id } = params;

    const rawData = await manuscriptRepository.getManuscriptById(id);
    if (!rawData) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Manuscript ${id} not found.` },
        { status: 404 }
      );
    }

    // Format manuscript with relations
    const manuscript: ManuscriptWithRelations = {
      id: rawData.manuscript.id,
      title: rawData.manuscript.title,
      status: rawData.manuscript.status,
      sourceType: rawData.manuscript.sourceType,
      sourceUrl: rawData.manuscript.sourceUrl ?? undefined,
      originalFilename: rawData.manuscript.originalFilename ?? undefined,
      pageCount: rawData.manuscript.pageCount,
      pageCountConfidence: rawData.manuscript.pageCountConfidence,
      wordCount: rawData.manuscript.wordCount,
      ocrUsed: rawData.manuscript.ocrUsed,
      styleProfile: rawData.manuscript.styleProfile,
      primaryProvider: rawData.manuscript.primaryProvider ?? undefined,
      refinementConsentAt: rawData.manuscript.refinementConsentAt ? rawData.manuscript.refinementConsentAt.toISOString() : undefined,
      createdAt: rawData.manuscript.createdAt.toISOString(),
      updatedAt: rawData.manuscript.updatedAt.toISOString(),
      sections: rawData.sections.map((s) => ({
        id: s.id,
        manuscriptId: s.manuscriptId,
        parentId: s.parentId ?? undefined,
        type: s.type as any,
        title: s.title,
        orderIndex: s.orderIndex,
        content: s.content,
        tableData: s.tableData ? JSON.parse(s.tableData) : undefined,
        rawHtml: s.rawHtml ?? undefined,
        charCount: s.charCount,
        createdAt: s.createdAt.toISOString(),
      })),
      metadata: [],
    };

    // Check query params for specific jobId, or fetch the latest job
    const { searchParams } = new URL(request.url);
    const requestedJobId = searchParams.get('jobId');

    let refinementResult = null;
    let targetJobId = requestedJobId;

    if (!targetJobId) {
      const latestJob = await refinementRepository.getLatestJobForManuscript(id);
      if (latestJob) {
        targetJobId = latestJob.id;
      }
    }

    if (targetJobId) {
      try {
        refinementResult = await refinementEngine.getJobResults(targetJobId);
      } catch {
        // Fall back to original content if results are pending or job failed
        refinementResult = null;
      }
    }

    // Generate Word document buffer
    const buffer = await generateManuscriptDocx(manuscript, refinementResult);

    const safeTitle = (manuscript.title || 'manuscript')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .substring(0, 50);
    const filename = `${safeTitle}_refined.docx`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'EXPORT_FAILED', message: error?.message || 'Failed to export manuscript to DOCX' },
      { status: 500 }
    );
  }
}
