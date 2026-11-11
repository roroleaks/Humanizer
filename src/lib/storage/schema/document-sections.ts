import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { manuscripts } from './manuscripts';

export const documentSections = sqliteTable('document_sections', {
  id: text('id').primaryKey(),
  manuscriptId: text('manuscript_id')
    .notNull()
    .references(() => manuscripts.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  orderIndex: integer('order_index').notNull(),
  content: text('content').notNull(),
  tableData: text('table_data'),
  rawHtml: text('raw_html'),
  charCount: integer('char_count').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type DocumentSectionRecord = typeof documentSections.$inferSelect;
export type NewDocumentSectionRecord = typeof documentSections.$inferInsert;
