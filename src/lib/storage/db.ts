import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'fs';
import path from 'path';
import * as schema from './schema';

// Section 3.2 & 5.2: Startup check to strictly enforce privacy
if (process.env.NODE_ENV === 'production' && process.env.SH_LOG_MANUSCRIPT_CONTENT === 'true') {
  throw new Error('CRITICAL SECURITY VIOLATION: SH_LOG_MANUSCRIPT_CONTENT must be "false" in production.');
}

const storagePath = process.env.SH_STORAGE_LOCAL_PATH || './.storage';
const dbFilePath = process.env.SH_DATABASE_SQLITE_PATH || path.join(storagePath, 'dev.db');

// Ensure storage and originals directories exist
const resolvedStorageDir = path.resolve(storagePath);
const originalsDir = path.join(resolvedStorageDir, 'originals');

if (!fs.existsSync(resolvedStorageDir)) {
  fs.mkdirSync(resolvedStorageDir, { recursive: true });
}
if (!fs.existsSync(originalsDir)) {
  fs.mkdirSync(originalsDir, { recursive: true });
}

const resolvedDbPath = path.resolve(dbFilePath);

const globalForDb = globalThis as unknown as {
  sqlite: InstanceType<typeof Database> | undefined;
  db: ReturnType<typeof drizzle> | undefined;
};

let sqliteInstance: InstanceType<typeof Database>;

if (!globalForDb.sqlite) {
  sqliteInstance = new Database(resolvedDbPath, { timeout: 15000 });

  // Enable WAL mode and foreign key cascading
  try {
    sqliteInstance.pragma('journal_mode = WAL');
    sqliteInstance.pragma('busy_timeout = 15000');
    sqliteInstance.pragma('foreign_keys = ON');

    // Initialize database schema tables if not present
    sqliteInstance.exec(`
      CREATE TABLE IF NOT EXISTS manuscripts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'Untitled Manuscript',
        source_type TEXT NOT NULL,
        source_url TEXT,
        original_filename TEXT,
        original_file_path TEXT,
        page_count INTEGER NOT NULL,
        page_count_confidence TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'intake',
        style_profile TEXT NOT NULL DEFAULT 'original_research',
        primary_provider TEXT,
        ocr_used INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        refinement_consent_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS document_sections (
        id TEXT PRIMARY KEY,
        manuscript_id TEXT NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
        parent_id TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        table_data TEXT,
        raw_html TEXT,
        char_count INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS processing_events (
        id TEXT PRIMARY KEY,
        manuscript_id TEXT NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_severity TEXT NOT NULL,
        detail TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS refinement_jobs (
        id TEXT PRIMARY KEY,
        manuscript_id TEXT NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
        style_profile TEXT NOT NULL,
        intensity TEXT NOT NULL,
        primary_provider TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        total_chunks INTEGER NOT NULL DEFAULT 0,
        completed_chunks INTEGER NOT NULL DEFAULT 0,
        failed_chunks INTEGER NOT NULL DEFAULT 0,
        started_at INTEGER,
        completed_at INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS refinement_chunks (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL REFERENCES refinement_jobs(id) ON DELETE CASCADE,
        manuscript_id TEXT NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
        section_id TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        paragraph_ids TEXT NOT NULL,
        original_text TEXT NOT NULL,
        refined_text TEXT,
        change_level TEXT,
        word_count INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        provider_used TEXT,
        model_used TEXT,
        tokens_used INTEGER DEFAULT 0,
        flags TEXT,
        error_message TEXT,
        started_at INTEGER,
        completed_at INTEGER
      );
    `);

    // Safely add column refinement_consent_at if existing SQLite file predates Phase 4
    try {
      sqliteInstance.exec('ALTER TABLE manuscripts ADD COLUMN refinement_consent_at INTEGER;');
    } catch {
      // Column already exists
    }
  } catch (err) {
    // If table creation is already handled by another thread
    console.warn('SQLite init warning (handled):', err);
  }

  globalForDb.sqlite = sqliteInstance;
  globalForDb.db = drizzle(sqliteInstance, { schema });
} else {
  sqliteInstance = globalForDb.sqlite;
}

export const sqlite = globalForDb.sqlite!;
export const db = globalForDb.db!;
