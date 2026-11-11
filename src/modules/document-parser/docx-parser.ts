import mammoth from 'mammoth';
import { JSDOM } from 'jsdom';
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

export interface DocxParseOptions {
  manuscriptId: string;
  buffer: Buffer;
  originalFilename?: string;
  wordDensity?: number;
  maxPages?: number;
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
  const storagePath = process.env.SH_STORAGE_LOCAL_PATH || './.storage';
  const originalsDir = path.resolve(storagePath, 'originals');
  if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, { recursive: true });
  }
  const binaryFilePath = path.join(originalsDir, `${manuscriptId}.docx`);
  fs.writeFileSync(binaryFilePath, buffer);

  // 2. Convert DOCX to semantic HTML using mammoth
  const conversionResult = await mammoth.convertToHtml({ buffer });
  const html = conversionResult.value;

  const dom = new JSDOM(html);
  const doc = dom.window.document;

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

  // Iterate top-level elements in body
  const bodyNodes = Array.from(doc.body.children);
  let detectedTitle = originalFilename?.replace(/\.docx$/i, '') || 'Untitled Manuscript';

  for (const node of bodyNodes) {
    const tagName = node.tagName.toLowerCase();

    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      flushSection();
      const headingText = node.textContent?.trim() || 'Untitled Section';
      currentTitle = headingText;
      currentType = classifySectionHeading(headingText);

      if (tagName === 'h1' && detectedTitle === 'Untitled Manuscript') {
        detectedTitle = headingText;
      }
    } else if (tagName === 'table') {
      flushSection();
      currentTitle = `Table ${sections.filter((s) => s.type === 'table').length + 1}`;
      currentType = 'table';

      // Parse structured TableData
      const tableElem = node as HTMLTableElement;
      const rowElements = Array.from(tableElem.querySelectorAll('tr'));
      const tableCells: TableCell[][] = [];

      for (const rowElem of rowElements) {
        const rowCells: TableCell[] = [];
        const cellNodes = Array.from(rowElem.querySelectorAll('th, td'));
        for (const cellNode of cellNodes) {
          const colSpan = parseInt(cellNode.getAttribute('colspan') || '1', 10);
          const rowSpan = parseInt(cellNode.getAttribute('rowspan') || '1', 10);
          const isHeader = cellNode.tagName.toLowerCase() === 'th';
          const headerScope = isHeader
            ? (cellNode.getAttribute('scope') as 'row' | 'column' | null) || 'column'
            : null;

          rowCells.push({
            text: cellNode.textContent?.trim() || '',
            colSpan,
            rowSpan,
            headerScope,
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

      currentContentParts.push(node.textContent?.trim() || '');
      flushSection();
      currentTitle = 'Continuing Text';
      currentType = 'unknown';
    } else {
      const text = node.textContent?.trim();
      if (text) {
        currentContentParts.push(text);
      }
    }
  }

  flushSection();

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
