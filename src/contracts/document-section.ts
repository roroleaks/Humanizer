/**
 * Document Section & Intake Contracts
 * 
 * Defines structural decomposition models for ingested academic manuscripts,
 * location tracking coordinates, table data representations, and intake metadata.
 */

/**
 * Standard scientific manuscript section classification.
 * Accommodates IMRAD format, review taxonomies, case reports, and non-standard structures.
 */
export type DocumentSectionType =
  | 'title'
  | 'abstract'
  | 'keywords'
  | 'introduction'
  | 'materials_and_methods'
  | 'methods'
  | 'results'
  | 'discussion'
  | 'conclusion'
  | 'limitations'
  | 'acknowledgements'
  | 'funding'
  | 'conflict_of_interest'
  | 'references'
  | 'table'
  | 'figure_caption'
  | 'supplementary_reference'
  | 'unknown';

/**
 * Precise character and paragraph level coordinates within a parsed document.
 */
export interface DocumentLocation {
  sectionId: string;
  paragraphIndex: number;
  charStart: number;
  charEnd: number;
}

/**
 * Individual cell structure within an extracted academic table.
 */
export interface TableCell {
  text: string;
  colSpan: number;
  rowSpan: number;
  headerScope: 'row' | 'column' | null;
}

/**
 * Structured table representation preserving grid relationships.
 * Source of truth for comparison review and DOCX regeneration.
 */
export interface TableData {
  rows: number;
  columns: number;
  cells: TableCell[][];
  caption?: string;
}

/**
 * Structured document section node supporting hierarchical sub-sections and embedded table data.
 */
export interface DocumentSection {
  id: string;
  type: DocumentSectionType;
  title: string;
  order: number;
  content: string;
  children: DocumentSection[];
  location: DocumentLocation;
  table?: TableData;
  rawHtml?: string;
  likelyTable?: boolean;
}

/**
 * Source modality of the ingested manuscript.
 */
export type DocumentSourceType = 'docx' | 'pdf' | 'url' | 'text';

/**
 * Degree of confidence in computed page count.
 */
export type PageCountConfidence = 'verified' | 'estimated';

/**
 * Metadata associated with parsed scientific manuscripts.
 */
export interface DocumentMetadata {
  title?: string;
  authors?: string[];
  doi?: string;
  language?: string;
  extractedAt: string; // ISO 8601
  sourceUrl?: string;
  ocrUsed: boolean;
}

/**
 * Comprehensive parsed document model containing parsed sections, raw text, and page metrics.
 */
export interface ParsedDocument {
  manuscriptId: string;
  sourceType: DocumentSourceType;
  pageCount: number;
  pageCountConfidence: PageCountConfidence;
  sections: DocumentSection[];
  rawText: string;
  metadata: DocumentMetadata;
}
