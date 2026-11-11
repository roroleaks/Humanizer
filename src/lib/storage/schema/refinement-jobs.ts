import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { manuscripts } from './manuscripts';

export const refinementJobs = sqliteTable('refinement_jobs', {
  id: text('id').primaryKey(),
  manuscriptId: text('manuscript_id')
    .notNull()
    .references(() => manuscripts.id, { onDelete: 'cascade' }),
  styleProfile: text('style_profile').notNull(),
  intensity: text('intensity', { enum: ['conservative', 'standard', 'high_impact'] }).notNull(),
  primaryProvider: text('primary_provider'),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] })
    .notNull()
    .default('pending'),
  totalChunks: integer('total_chunks').notNull().default(0),
  completedChunks: integer('completed_chunks').notNull().default(0),
  failedChunks: integer('failed_chunks').notNull().default(0),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type RefinementJobRecord = typeof refinementJobs.$inferSelect;
export type NewRefinementJobRecord = typeof refinementJobs.$inferInsert;
