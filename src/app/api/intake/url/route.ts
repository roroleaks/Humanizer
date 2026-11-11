import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { parseUrl } from '@/modules/document-parser';
import { manuscriptRepository, processingEventRepository } from '@/lib/storage/repositories';
import { IntakeResponse } from '@/contracts/manuscript';
import { rateLimiter } from '@/lib/rate-limiter';

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
    const url = body.url?.trim();
    const styleProfile = body.styleProfile || 'original_research';
    const primaryProvider = body.primaryProvider || 'anthropic';

    if (!url) {
      return NextResponse.json(
        {
          manuscriptId,
          status: 'failed',
          pageCount: 0,
          pageCountConfidence: 'estimated',
          sectionCount: 0,
          wordCount: 0,
          ocrUsed: false,
          errors: [{ code: 'URL_MISSING', message: 'A valid URL must be provided in the request body.' }],
        } satisfies IntakeResponse,
        { status: 400 }
      );
    }

    // Parse URL with SSRF Guard
    const parsed = await parseUrl({
      manuscriptId,
      url,
    });

    const words = parsed.rawText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const storagePath = process.env.SH_STORAGE_LOCAL_PATH || './.storage';
    const originalFilePath = path.resolve(storagePath, 'originals', `${manuscriptId}.html`);

    // Persist manuscript record
    await manuscriptRepository.createManuscript({
      id: manuscriptId,
      title: parsed.metadata?.title || url,
      sourceType: 'url',
      sourceUrl: url,
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
      `URL ingested: ${parsed.sections.length} sections, ${parsed.pageCount} pages, ${wordCount} words.`
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
    const errorMessage = error?.message || 'Failed to process manuscript URL.';
    const isPageLimit = errorMessage.includes('PAGE_LIMIT_EXCEEDED');
    const isSsrfViolation = errorMessage.includes('SSRF_GUARD_VIOLATION') || errorMessage.includes('UNSUPPORTED_PROTOCOL');

    let errorCode = 'PARSE_FAILED';
    let statusCode = 500;

    if (isPageLimit) {
      errorCode = 'PAGE_LIMIT_EXCEEDED';
      statusCode = 422;
    } else if (isSsrfViolation) {
      errorCode = 'SSRF_GUARD_VIOLATION';
      statusCode = 422;
    }

    await processingEventRepository.logEvent(
      manuscriptId,
      'intake_failed',
      isSsrfViolation ? 'security' : 'error',
      `URL intake halted: ${errorCode}`
    );

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
          code: errorCode,
          message: errorMessage,
        },
      ],
    };

    return NextResponse.json(responsePayload, { status: statusCode });
  }
}
