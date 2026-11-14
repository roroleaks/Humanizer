import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import {
  DocumentSection,
  ParsedDocument,
  TableData,
  TableCell,
} from '@/contracts/document-section';
import { classifySectionHeading } from './section-classifier';
import { detectAndLogPromptInjection } from './security-guard';
import { getStorageRoot } from '@/lib/storage-path';

export interface DocxParseOptions {
  manuscriptId: string;
  buffer: Buffer;
  originalFilename?: string;
  wordDensity?: number;
  maxPages?: number;
}

function stripHtml(rawHtml: string): string {
  return rawHtml
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export async function parseDocx(options: DocxParseOptions): Promise<ParsedDocument> {
  const {
    manuscriptId,
    buffer,
    originalFilename,
    wordDensity = parseInt(process.env.SH_PAGE_WORD_DENSITY || '500', 10),
    maxPages = parseInt(process.env.SH_MAX_PAGES || '15', 10),
  } = options;

  // 1. Save original binary to local private storage
  const storagePath = getStorageRoot();
  const originalsDir = path.resolve(storagePath, 'originals');
  if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, { recursive: true });
  }
  const binaryFilePath = path.join(originalsDir, `${manuscriptId}.docx`);
  fs.writeFileSync(binaryFilePath, buffer);

  // 2. Convert DOCX to semantic HTML using mammoth
  const conversionResult = await mammoth.convertToHtml({ buffer });
  const html = conversionResult.value;

  const sections: DocumentSection[] = [];
  let currentTitle = 'Title & Preliminary';
  let currentType = classifySectionHeading(currentTitle);
  let currentContentParts: string[] = [];
  let currentTableData: TableData | undefined = undefined;
  let sectionIndex = 0;
  let charTracker = 0;

  function flushSection() {
    const fullContent = currentContentParts.join('\n\n').trim();
    if (fullContent.length > 0 || currentTableData) {
      const charStart = charTracker;
      const charEnd = charStart + fullContent.length;
      charTracker = charEnd + 2;

      sections.push({
        id: crypto.randomUUID(),
        type: currentType,
        title: currentTitle,
        order: sectionIndex++,
        content: fullContent,
        children: [],
        table: currentTableData,
        location: {
          sectionId: '',
          paragraphIndex: 0,
          charStart,
          charEnd,
        },
      });

      currentContentParts = [];
      currentTableData = undefined;
    }
  }

  // Parse HTML elements without heavy jsdom dependency
  let detectedTitle = originalFilename?.replace(/\.docx$/i, '') || 'Untitled Manuscript';
  const blockRegex = /<(h[1-6]|table|p|blockquote|ul|ol|div)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    const innerHtml = match[2];

    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      flushSection();
      const headingText = stripHtml(innerHtml) || 'Untitled Section';
      currentTitle = headingText;
      currentType = classifySectionHeading(headingText);

      if (tagName === 'h1' && detectedTitle === 'Untitled Manuscript') {
        detectedTitle = headingText;
      }
    } else if (tagName === 'table') {
      flushSection();
      currentTitle = `Table ${sections.filter((s) => s.type === 'table').length + 1}`;
      currentType = 'table';

      // Parse structured table rows and cells
      const tableCells: TableCell[][] = [];
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let trMatch: RegExpExecArray | null;

      while ((trMatch = trRegex.exec(innerHtml)) !== null) {
        const rowCells: TableCell[] = [];
        const cellRegex = /<(th|td)([^>]*)>([\s\S]*?)<\/\1>/gi;
        let cellMatch: RegExpExecArray | null;

        while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
          const isHeader = cellMatch[1].toLowerCase() === 'th';
          const attrs = cellMatch[2];
          const cellContent = stripHtml(cellMatch[3]);

          const colSpanMatch = /colspan=["']?(\d+)["']?/i.exec(attrs);
          const rowSpanMatch = /rowspan=["']?(\d+)["']?/i.exec(attrs);
          const colSpan = colSpanMatch ? parseInt(colSpanMatch[1], 10) : 1;
          const rowSpan = rowSpanMatch ? parseInt(rowSpanMatch[1], 10) : 1;

          rowCells.push({
            text: cellContent,
            colSpan,
            rowSpan,
            headerScope: isHeader ? 'column' : null,
          });
        }

        if (rowCells.length > 0) {
          tableCells.push(rowCells);
        }
      }

      currentTableData = {
        rows: tableCells.length,
        columns: tableCells[0]?.length || 0,
        cells: tableCells,
      };

      currentContentParts.push(stripHtml(innerHtml));
      flushSection();
      currentTitle = 'Continuing Text';
      currentType = 'unknown';
    } else {
      const text = stripHtml(innerHtml);
      if (text) {
        currentContentParts.push(text);
      }
    }
  }

  flushSection();

  // If regex found no blocks, extract full text as fallback
  if (sections.length === 0) {
    const rawExtraction = await mammoth.extractRawText({ buffer });
    const text = rawExtraction.value.trim();
    if (text) {
      sections.push({
        id: crypto.randomUUID(),
        type: 'unknown',
        title: detectedTitle,
        order: 0,
        content: text,
        children: [],
        location: {
          sectionId: '',
          paragraphIndex: 0,
          charStart: 0,
          charEnd: text.length,
        },
      });
    }
  }

  // If no sections were produced, create a fallback section from raw text
  const rawText = sections.map((s) => `${s.title}\n${s.content}`).join('\n\n');
  const words = rawText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / wordDensity));

  // Security check: Prompt injection detection on extracted sections
  for (const section of sections) {
    await detectAndLogPromptInjection(manuscriptId, section.content, `Section "${section.title}"`);
  }

  // Authoritative page limit validation
  if (estimatedPages > maxPages) {
    throw new Error(
      `PAGE_LIMIT_EXCEEDED: Document contains approximately ${estimatedPages} pages, exceeding the maximum allowed limit of ${maxPages} pages.`
    );
  }

  return {
    manuscriptId,
    sourceType: 'docx',
    pageCount: estimatedPages,
    pageCountConfidence: 'estimated',
    sections,
    rawText,
    metadata: {
      title: detectedTitle,
      extractedAt: new Date().toISOString(),
      ocrUsed: false,
    },
  };
}
