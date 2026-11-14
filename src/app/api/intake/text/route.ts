import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { parseText } from '@/modules/document-parser';
import { manuscriptRepository, processingEventRepository } from '@/lib/storage/repositories';
import { IntakeResponse } from '@/contracts/manuscript';
import { rateLimiter } from '@/lib/rate-limiter';
import { getStorageRoot } from '@/lib/storage-path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const manuscriptId = crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const rateLimit = rateLimiter.check(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        manuscriptId,
        status: 'failed',
        pageCount: 0,
        pageCountConfidence: 'estimated',
        sectionCount: 0,
        wordCount: 0,
        ocrUsed: false,
        errors: [{ code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Maximum 20 requests per minute.' }],
      } satisfies IntakeResponse,
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const text = body.text?.trim();
    const title = body.title?.trim() || 'Untitled Manuscript';
    const styleProfile = body.styleProfile || 'original_research';
    const primaryProvider = body.primaryProvider || 'anthropic';

    if (!text) {
      return NextResponse.json(
        {
          manuscriptId,
          status: 'failed',
          pageCount: 0,
          pageCountConfidence: 'estimated',
          sectionCount: 0,
          wordCount: 0,
          ocrUsed: false,
          errors: [{ code: 'TEXT_MISSING', message: 'No manuscript text was provided in the payload.' }],
        } satisfies IntakeResponse,
        { status: 400 }
      );
    }

    // Parse plain text
    const parsed = await parseText({
      manuscriptId,
      text,
      title,
    });

    const words = parsed.rawText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const storagePath = getStorageRoot();
    const originalFilePath = path.resolve(storagePath, 'originals', `${manuscriptId}.txt`);

    // Persist manuscript record
    await manuscriptRepository.createManuscript({
      id: manuscriptId,
      title: parsed.metadata?.title || title,
      sourceType: 'text',
      originalFilePath,
      pageCount: parsed.pageCount,
      pageCountConfidence: parsed.pageCountConfidence,
      wordCount,
      status: 'parsed',
      styleProfile,
      primaryProvider,
      ocrUsed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Persist sections
    const sectionRecords = parsed.sections.map((s) => ({
      id: s.id,
      manuscriptId,
      parentId: null,
      type: s.type,
      title: s.title,
      orderIndex: s.order,
      content: s.content,
      tableData: s.table ? JSON.stringify(s.table) : null,
      rawHtml: s.rawHtml || null,
      charCount: s.content.length,
      createdAt: new Date(),
    }));
    await manuscriptRepository.saveParsedSections(sectionRecords);

    // Audit log
    await processingEventRepository.logEvent(
      manuscriptId,
      'intake_completed',
      'info',
      `Text ingested: ${parsed.sections.length} sections, ${parsed.pageCount} pages, ${wordCount} words.`
    );

    const responsePayload: IntakeResponse = {
      manuscriptId,
      status: 'parsed',
      pageCount: parsed.pageCount,
      pageCountConfidence: parsed.pageCountConfidence,
      sectionCount: parsed.sections.length,
      wordCount,
      ocrUsed: false,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to process manuscript text.';
    const isPageLimit = errorMessage.includes('PAGE_LIMIT_EXCEEDED');

    await processingEventRepository.logEvent(
      manuscriptId,
      'intake_failed',
      'error',
      `Text processing failed: ${isPageLimit ? 'PAGE_LIMIT_EXCEEDED' : 'PARSE_FAILED'}`
    );

    const status = isPageLimit ? 422 : 500;
    const responsePayload: IntakeResponse = {
      manuscriptId,
      status: 'failed',
      pageCount: 0,
      pageCountConfidence: 'estimated',
      sectionCount: 0,
      wordCount: 0,
      ocrUsed: false,
      errors: [
        {
          code: isPageLimit ? 'PAGE_LIMIT_EXCEEDED' : 'PARSE_FAILED',
          message: errorMessage,
        },
      ],
    };

    return NextResponse.json(responsePayload, { status });
  }
}
