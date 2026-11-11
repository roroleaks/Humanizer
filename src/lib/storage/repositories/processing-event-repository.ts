import { eq } from 'drizzle-orm';
import { db } from '../db';
import { processingEvents, ProcessingEventRecord, NewProcessingEventRecord } from '../schema';

export class ProcessingEventRepository {
  /**
   * Logs an operational lifecycle event.
   * STRICT INTEGRITY RULE: Detail must only record operational diagnostic information,
   * never verbatim manuscript prose or author names.
   */
  async logEvent(
    manuscriptId: string,
    eventType: string,
    eventSeverity: 'info' | 'warning' | 'error' | 'security',
    detail: string
  ): Promise<ProcessingEventRecord> {
    const id = crypto.randomUUID();
    const event: NewProcessingEventRecord = {
      id,
      manuscriptId,
      eventType,
      eventSeverity,
      detail,
      createdAt: new Date(),
    };

    const inserted = db.insert(processingEvents).values(event).returning().get();
    return inserted;
  }

  /**
   * Lists operational events for a given manuscript.
   */
  async getEventsByManuscript(manuscriptId: string): Promise<ProcessingEventRecord[]> {
    return db
      .select()
      .from(processingEvents)
      .where(eq(processingEvents.manuscriptId, manuscriptId))
      .all()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}

export const processingEventRepository = new ProcessingEventRepository();
