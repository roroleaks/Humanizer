import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const manuscripts = sqliteTable('manuscripts', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('Untitled Manuscript'),
  sourceType: text('source_type', { enum: ['docx', 'pdf', 'url', 'text'] }).notNull(),
  sourceUrl: text('source_url'),
  originalFilename: text('original_filename'),
  originalFilePath: text('original_file_path'),
  pageCount: integer('page_count').notNull(),
  pageCountConfidence: text('page_count_confidence', { enum: ['verified', 'estimated'] }).notNull(),
  wordCount: integer('word_count').notNull(),
  status: text('status', {
    enum: ['intake', 'parsed', 'profiling', 'refining', 'validating', 'ready', 'exported', 'failed'],
  }).notNull().default('intake'),
  styleProfile: text('style_profile').notNull().default('original_research'),
  primaryProvider: text('primary_provider'),
  ocrUsed: integer('ocr_used', { mode: 'boolean' }).notNull().default(false),
  refinementConsentAt: integer('refinement_consent_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export type ManuscriptRecord = typeof manuscripts.$inferSelect;
export type NewManuscriptRecord = typeof manuscripts.$inferInsert;
