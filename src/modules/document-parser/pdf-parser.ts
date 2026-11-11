import { extractText, getMeta } from 'unpdf';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import {
  DocumentSection,
  ParsedDocument,
} from '@/contracts/document-section';
import { classifySectionHeading } from './section-classifier';
import { detectAndLogPromptInjection } from './security-guard';

export interface PdfParseOptions {
  manuscriptId: string;
  buffer: Buffer;
  originalFilename?: string;
  maxPages?: number;
}

export async function parsePdf(options: PdfParseOptions): Promise<ParsedDocument> {
  const {
    manuscriptId,
    buffer,
    originalFilename,
    maxPages = parseInt(process.env.SH_MAX_PAGES || '15', 10),
  } = options;

  // 1. Save original PDF binary to local private storage
  const storagePath = process.env.SH_STORAGE_LOCAL_PATH || './.storage';
  const originalsDir = path.resolve(storagePath, 'originals');
  if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, { recursive: true });
  }
  const binaryFilePath = path.join(originalsDir, `${manuscriptId}.pdf`);
  fs.writeFileSync(binaryFilePath, buffer);

  // 2. Extract metadata and text using unpdf
  // Use freshly sliced ArrayBuffers to prevent detached ArrayBuffer transfer errors in pdfjs
  const createUint8Array = () =>
    new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));

  let meta: any = null;
  try {
    meta = await getMeta(createUint8Array());
  } catch {
    // Non-fatal, meta might be unavailable
  }

  const extracted = await extractText(createUint8Array());
  const physicalPageCount = extracted.totalPages || (Array.isArray(extracted.text) ? extracted.text.length : 1);

  // Enforce authoritative page limit BEFORE executing expensive OCR
  if (physicalPageCount > maxPages) {
    throw new Error(
      `PAGE_LIMIT_EXCEEDED: PDF contains ${physicalPageCount} physical pages, exceeding the maximum allowed limit of ${maxPages} pages.`
    );
  }

  const rawPages = Array.isArray(extracted.text) ? extracted.text : [String(extracted.text || '')];
  const totalCharacters = rawPages.reduce((acc, page) => acc + page.trim().length, 0);
  const averageCharsPerPage = physicalPageCount > 0 ? totalCharacters / physicalPageCount : 0;

  let ocrUsed = false;
  let fullText = rawPages.join('\n\n');

  // 3. Scanned PDF detection: if average chars per page < 100, trigger Tesseract in-process OCR
  if (averageCharsPerPage < 100) {
    ocrUsed = true;
    try {
      const ocrResult = await Tesseract.recognize(buffer, 'eng');
      if (ocrResult.data.text && ocrResult.data.text.trim().length > 0) {
        fullText = ocrResult.data.text;
      }
    } catch {
      // If image OCR on PDF fails or buffer is direct vector, keep extracted text
    }
  }

  // 4. Decompose text into sections
  const lines = fullText.split(/\r?\n/).map((l) => l.trim());
  const sections: DocumentSection[] = [];
  let currentTitle = 'Document Header & Preliminary';
  let currentType = classifySectionHeading(currentTitle);
  let currentLines: string[] = [];
  let orderIndex = 0;
  let charTracker = 0;

  function flushSection() {
    const content = currentLines.join('\n').trim();
    if (content.length > 0) {
      const charStart = charTracker;
      const charEnd = charStart + content.length;
      charTracker = charEnd + 2;

      // Detect table-like plain text patterns (multiple numbers or tabs)
      const likelyTable = /(\b\d+(\.\d+)?\b[\s\t]+){3,}/.test(content);

      sections.push({
        id: crypto.randomUUID(),
        type: currentType,
        title: currentTitle,
        order: orderIndex++,
        content,
        children: [],
        likelyTable,
        location: {
          sectionId: '',
          paragraphIndex: 0,
          charStart,
          charEnd,
        },
      });
      currentLines = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Heading heuristic for PDF lines
    const isHeading =
      line.length < 80 &&
      (classifySectionHeading(line) !== 'unknown' ||
        /^((\d+\.?\s+)|([I|V|X]+\.?\s+))?[A-Z][A-Za-z0-9\s,\-:]{3,60}$/.test(line));

    if (isHeading && currentLines.length > 0) {
      flushSection();
      currentTitle = line;
      currentType = classifySectionHeading(line);
    } else {
      currentLines.push(line);
    }
  }

  flushSection();

  if (sections.length === 0 && fullText.trim().length > 0) {
    sections.push({
      id: crypto.randomUUID(),
      type: 'unknown',
      title: 'Full Manuscript Body',
      order: 0,
      content: fullText.trim(),
      children: [],
      location: {
        sectionId: '',
        paragraphIndex: 0,
        charStart: 0,
        charEnd: fullText.trim().length,
      },
    });
  }

  // Security check: Prompt injection detection on extracted sections
  for (const section of sections) {
    await detectAndLogPromptInjection(manuscriptId, section.content, `PDF Section "${section.title}"`);
  }

  const detectedTitle =
    meta?.info?.Title || originalFilename?.replace(/\.pdf$/i, '') || 'Untitled Manuscript';

  return {
    manuscriptId,
    sourceType: 'pdf',
    pageCount: physicalPageCount,
    pageCountConfidence: 'verified',
    sections,
    rawText: fullText,
    metadata: {
      title: detectedTitle,
      authors: meta?.info?.Author ? [meta.info.Author] : undefined,
      extractedAt: new Date().toISOString(),
      ocrUsed,
    },
  };
}
