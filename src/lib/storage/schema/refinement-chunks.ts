import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { manuscripts } from './manuscripts';
import { refinementJobs } from './refinement-jobs';

export const refinementChunks = sqliteTable('refinement_chunks', {
  id: text('id').primaryKey(),
  jobId: text('job_id')
    .notNull()
    .references(() => refinementJobs.id, { onDelete: 'cascade' }),
  manuscriptId: text('manuscript_id')
    .notNull()
    .references(() => manuscripts.id, { onDelete: 'cascade' }),
  sectionId: text('section_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  paragraphIds: text('paragraph_ids').notNull(), // JSON array of string IDs
  originalText: text('original_text').notNull(),
  refinedText: text('refined_text'),
  changeLevel: text('change_level', { enum: ['unchanged', 'minor', 'major'] }),
  wordCount: integer('word_count').notNull(),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] })
    .notNull()
    .default('pending'),
  providerUsed: text('provider_used'),
  modelUsed: text('model_used'),
  tokensUsed: integer('tokens_used').default(0),
  flags: text('flags'), // JSON array of RefinementFlag
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

export type RefinementChunkRecord = typeof refinementChunks.$inferSelect;
export type NewRefinementChunkRecord = typeof refinementChunks.$inferInsert;
