import { eq, desc, and, isNull, like, or } from 'drizzle-orm';
import { db } from '../db';
import {
  manuscripts,
  documentSections,
  ManuscriptRecord,
  NewManuscriptRecord,
  DocumentSectionRecord,
  NewDocumentSectionRecord,
} from '../schema';

export class ManuscriptRepository {
  /**
   * Inserts a new manuscript entity.
   */
  async createManuscript(data: NewManuscriptRecord): Promise<ManuscriptRecord> {
    const inserted = db.insert(manuscripts).values(data).returning().get();
    return inserted;
  }

  /**
   * Persists extracted document sections in batch.
   */
  async saveParsedSections(sections: NewDocumentSectionRecord[]): Promise<void> {
    if (sections.length === 0) return;
    db.insert(documentSections).values(sections).run();
  }

  /**
   * Retrieves a manuscript by ID along with all associated sections ordered by sequence.
   */
  async getManuscriptById(
    id: string
  ): Promise<{ manuscript: ManuscriptRecord; sections: DocumentSectionRecord[] } | null> {
    const manuscript = db
      .select()
      .from(manuscripts)
      .where(and(eq(manuscripts.id, id), isNull(manuscripts.deletedAt)))
      .get();

    if (!manuscript) return null;

    const sections = db
      .select()
      .from(documentSections)
      .where(eq(documentSections.manuscriptId, id))
      .all()
      .sort((a, b) => a.orderIndex - b.orderIndex);

    return { manuscript, sections };
  }

  /**
   * Lists all active manuscripts with optional search and status filtering.
   */
  async listManuscripts(filter?: {
    status?: string;
    search?: string;
    sort?: string;
  }): Promise<ManuscriptRecord[]> {
    const query = db
      .select()
      .from(manuscripts)
      .where(
        and(
          isNull(manuscripts.deletedAt),
          filter?.status && filter.status !== 'all'
            ? eq(manuscripts.status, filter.status as any)
            : undefined,
          filter?.search
            ? or(
                like(manuscripts.title, `%${filter.search}%`),
                like(manuscripts.sourceUrl, `%${filter.search}%`)
              )
            : undefined
        )
      )
      .all();

    // Sort order
    if (filter?.sort === 'title') {
      return query.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filter?.sort === 'status') {
      return query.sort((a, b) => a.status.localeCompare(b.status));
    }
    // Default: most recent first
    return query.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Updates manuscript processing status and metrics.
   */
  async updateManuscriptStatus(
    id: string,
    status: ManuscriptRecord['status'],
    options?: { wordCount?: number; pageCount?: number }
  ): Promise<void> {
    db.update(manuscripts)
      .set({
        status,
        updatedAt: new Date(),
        ...(options?.wordCount !== undefined ? { wordCount: options.wordCount } : {}),
        ...(options?.pageCount !== undefined ? { pageCount: options.pageCount } : {}),
      })
      .where(eq(manuscripts.id, id))
      .run();
  }

  /**
   * Soft deletes a manuscript.
   */
  async softDeleteManuscript(id: string): Promise<void> {
    db.update(manuscripts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(manuscripts.id, id))
      .run();
  }
}

export const manuscriptRepository = new ManuscriptRepository();
