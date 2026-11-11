import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { parsePdf } from '@/modules/document-parser';
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
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const styleProfile = (formData.get('styleProfile') as string) || 'original_research';
    const primaryProvider = (formData.get('primaryProvider') as string) || 'anthropic';

    if (!file) {
      return NextResponse.json(
        {
          manuscriptId,
          status: 'failed',
          pageCount: 0,
          pageCountConfidence: 'estimated',
          sectionCount: 0,
          wordCount: 0,
          ocrUsed: false,
          errors: [{ code: 'FILE_MISSING', message: 'No PDF file was provided in the upload payload.' }],
        } satisfies IntakeResponse,
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const parsed = await parsePdf({
      manuscriptId,
      buffer,
      originalFilename: file.name,
    });

    const words = parsed.rawText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const storagePath = process.env.SH_STORAGE_LOCAL_PATH || './.storage';
    const originalFilePath = path.resolve(storagePath, 'originals', `${manuscriptId}.pdf`);

    // Persist manuscript record
    await manuscriptRepository.createManuscript({
      id: manuscriptId,
      title: parsed.metadata?.title || file.name.replace(/\.pdf$/i, ''),
      sourceType: 'pdf',
      originalFilename: file.name,
      originalFilePath,
      pageCount: parsed.pageCount,
      pageCountConfidence: parsed.pageCountConfidence,
      wordCount,
      status: 'parsed',
      styleProfile,
      primaryProvider,
      ocrUsed: parsed.metadata?.ocrUsed || false,
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
      `PDF ingested: ${parsed.sections.length} sections, ${parsed.pageCount} pages, OCR: ${parsed.metadata?.ocrUsed ? 'yes' : 'no'}`
    );

    const responsePayload: IntakeResponse = {
      manuscriptId,
      status: 'parsed',
      pageCount: parsed.pageCount,
      pageCountConfidence: parsed.pageCountConfidence,
      sectionCount: parsed.sections.length,
      wordCount,
      ocrUsed: parsed.metadata?.ocrUsed || false,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to process PDF file.';
    const isPageLimit = errorMessage.includes('PAGE_LIMIT_EXCEEDED');

    await processingEventRepository.logEvent(
      manuscriptId,
      'intake_failed',
      'error',
      `PDF processing failed: ${isPageLimit ? 'PAGE_LIMIT_EXCEEDED' : 'PARSE_FAILED'}`
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
