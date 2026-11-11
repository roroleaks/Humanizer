import { eq, desc, and } from 'drizzle-orm';
import { db } from '@/lib/storage/db';
import {
  refinementJobs,
  refinementChunks,
  manuscripts,
  RefinementJobRecord,
  NewRefinementJobRecord,
  RefinementChunkRecord,
  NewRefinementChunkRecord,
} from '@/lib/storage/schema';

export class RefinementRepository {
  async createJob(job: NewRefinementJobRecord): Promise<RefinementJobRecord> {
    const inserted = db.insert(refinementJobs).values(job).returning().get();
    return inserted;
  }

  async createChunks(chunks: NewRefinementChunkRecord[]): Promise<void> {
    if (chunks.length === 0) return;
    db.insert(refinementChunks).values(chunks).run();
  }

  async getJobById(jobId: string): Promise<RefinementJobRecord | null> {
    const job = db
      .select()
      .from(refinementJobs)
      .where(eq(refinementJobs.id, jobId))
      .get();
    return job || null;
  }

  async getJobWithChunks(
    jobId: string
  ): Promise<{ job: RefinementJobRecord; chunks: RefinementChunkRecord[] } | null> {
    const job = await this.getJobById(jobId);
    if (!job) return null;

    const chunks = db
      .select()
      .from(refinementChunks)
      .where(eq(refinementChunks.jobId, jobId))
      .all()
      .sort((a, b) => a.chunkIndex - b.chunkIndex);

    return { job, chunks };
  }

  async getChunksByJob(jobId: string): Promise<RefinementChunkRecord[]> {
    return db
      .select()
      .from(refinementChunks)
      .where(eq(refinementChunks.jobId, jobId))
      .all()
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async updateJobStatus(
    jobId: string,
    status: RefinementJobRecord['status'],
    updates?: Partial<RefinementJobRecord>
  ): Promise<void> {
    db.update(refinementJobs)
      .set({
        status,
        ...updates,
      })
      .where(eq(refinementJobs.id, jobId))
      .run();
  }

  async updateChunk(chunkId: string, updates: Partial<RefinementChunkRecord>): Promise<void> {
    db.update(refinementChunks)
      .set(updates)
      .where(eq(refinementChunks.id, chunkId))
      .run();
  }

  async recordConsent(manuscriptId: string, consentedAt: Date = new Date()): Promise<void> {
    db.update(manuscripts)
      .set({ refinementConsentAt: consentedAt, updatedAt: new Date() })
      .where(eq(manuscripts.id, manuscriptId))
      .run();
  }

  async hasConsent(manuscriptId: string): Promise<boolean> {
    const manuscript = db
      .select({ consent: manuscripts.refinementConsentAt })
      .from(manuscripts)
      .where(eq(manuscripts.id, manuscriptId))
      .get();
    return !!manuscript?.consent;
  }
}

export const refinementRepository = new RefinementRepository();
