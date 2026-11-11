import { NextRequest, NextResponse } from 'next/server';
import { manuscriptRepository, processingEventRepository } from '@/lib/storage/repositories';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    const data = await manuscriptRepository.getManuscriptById(id);
    if (!data) {
      return NextResponse.json(
        { error: 'Manuscript not found', manuscriptId: id },
        { status: 404 }
      );
    }

    const events = await processingEventRepository.getEventsByManuscript(id);

    const formattedSections = data.sections.map((s) => ({
      id: s.id,
      manuscriptId: s.manuscriptId,
      parentId: s.parentId,
      type: s.type,
      title: s.title,
      orderIndex: s.orderIndex,
      content: s.content,
      tableData: s.tableData ? JSON.parse(s.tableData) : null,
      rawHtml: s.rawHtml,
      charCount: s.charCount,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      manuscript: {
        id: data.manuscript.id,
        title: data.manuscript.title,
        status: data.manuscript.status,
        sourceType: data.manuscript.sourceType,
        sourceUrl: data.manuscript.sourceUrl,
        originalFilename: data.manuscript.originalFilename,
        pageCount: data.manuscript.pageCount,
        pageCountConfidence: data.manuscript.pageCountConfidence,
        wordCount: data.manuscript.wordCount,
        styleProfile: data.manuscript.styleProfile,
        primaryProvider: data.manuscript.primaryProvider,
        ocrUsed: data.manuscript.ocrUsed,
        refinementConsentAt: data.manuscript.refinementConsentAt ? data.manuscript.refinementConsentAt.toISOString() : null,
        createdAt: data.manuscript.createdAt.toISOString(),
        updatedAt: data.manuscript.updatedAt.toISOString(),
      },
      sections: formattedSections,
      events: events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        eventSeverity: e.eventSeverity,
        detail: e.detail,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve manuscript details.', detail: error?.message },
      { status: 500 }
    );
  }
}
