/**
 * Manuscript Core Domain Contracts
 * 
 * Defines the central manuscript entity, lifecycle states, storage records,
 * intake response models, and high-level query summaries.
 */

import { ParsedDocument } from './document-section';
import { ProtectedInventory, ValidationReport } from './scientific-integrity';
import { ManuscriptStyleProfile, RefinementResult } from './refinement';

/**
 * Lifecycle states of an academic manuscript in the processing pipeline.
 */
export type ManuscriptStatus =
  | 'uploaded'
  | 'intake'
  | 'parsed'
  | 'inventory_extracted'
  | 'profiled'
  | 'refining'
  | 'refined'
  | 'validating'
  | 'validated'
  | 'ready'
  | 'exported'
  | 'completed'
  | 'failed';

/**
 * Core manuscript entity stored in the database.
 */
export interface Manuscript {
  id: string;
  title: string;
  authors: string[];
  status: ManuscriptStatus;
  sourceType: 'docx' | 'pdf' | 'url' | 'text';
  originalFilePath?: string;
  revisedFilePath?: string;
  pageCount: number;
  wordCountOriginal: number;
  wordCountRevised?: number;
  styleProfile: ManuscriptStyleProfile;
  parsedDocument?: ParsedDocument;
  protectedInventory?: ProtectedInventory;
  refinementResult?: RefinementResult;
  validationReport?: ValidationReport;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Compact summary for manuscript dashboard and history listings.
 */
export interface ManuscriptSummary {
  id: string;
  title: string;
  status: ManuscriptStatus;
  sourceType: 'docx' | 'pdf' | 'url' | 'text';
  pageCount: number;
  pageCountConfidence?: 'verified' | 'estimated';
  wordCount?: number;
  validationStatus?: 'PASS' | 'WARNING' | 'FAIL';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * Standard intake error descriptor returned when document processing halts.
 */
export interface IntakeError {
  code: string; // e.g., 'PAGE_LIMIT_EXCEEDED', 'SSRF_BLOCKED', 'UNSUPPORTED_TYPE', 'PARSE_FAILED'
  message: string; // User-facing, no internal file paths
  field?: string;
}

/**
 * Standard server response for document intake operations.
 * Returns metadata and processing diagnostics; never reflects manuscript body text.
 */
export interface IntakeResponse {
  manuscriptId: string;
  status: 'parsed' | 'failed';
  pageCount: number;
  pageCountConfidence: 'verified' | 'estimated';
  sectionCount: number;
  wordCount: number;
  ocrUsed: boolean;
  errors?: IntakeError[];
}
