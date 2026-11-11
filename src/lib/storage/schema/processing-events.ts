import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { manuscripts } from './manuscripts';

export const processingEvents = sqliteTable('processing_events', {
  id: text('id').primaryKey(),
  manuscriptId: text('manuscript_id')
    .notNull()
    .references(() => manuscripts.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  eventSeverity: text('event_severity', { enum: ['info', 'warning', 'error', 'security'] }).notNull(),
  detail: text('detail').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type ProcessingEventRecord = typeof processingEvents.$inferSelect;
export type NewProcessingEventRecord = typeof processingEvents.$inferInsert;
