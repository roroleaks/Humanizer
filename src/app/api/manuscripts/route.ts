import { NextRequest, NextResponse } from 'next/server';
import { manuscriptRepository } from '@/lib/storage/repositories';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || undefined;

    const records = await manuscriptRepository.listManuscripts({
      status,
      search,
      sort,
    });

    const items = records.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      sourceType: r.sourceType,
      pageCount: r.pageCount,
      pageCountConfidence: r.pageCountConfidence,
      wordCount: r.wordCount,
      ocrUsed: r.ocrUsed,
      styleProfile: r.styleProfile,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json({ manuscripts: items, total: items.length });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve manuscripts.', detail: error?.message },
      { status: 500 }
    );
  }
}
