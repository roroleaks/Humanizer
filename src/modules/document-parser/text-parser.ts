import fs from 'fs';
import path from 'path';
import {
  DocumentSection,
  ParsedDocument,
} from '@/contracts/document-section';
import { classifySectionHeading } from './section-classifier';
import { detectAndLogPromptInjection } from './security-guard';
import { getStorageRoot } from '@/lib/storage-path';

export interface TextParseOptions {
  manuscriptId: string;
  text: string;
  title?: string;
  wordDensity?: number;
  maxPages?: number;
}

/**
 * Parses raw scientific text into structured sections.
 * Decomposes headings, estimates page count, enforces page limits,
 * and executes prompt-injection security checks.
 */
export async function parseText(options: TextParseOptions): Promise<ParsedDocument> {
  const {
    manuscriptId,
    text,
    title,
    wordDensity = parseInt(process.env.SH_PAGE_WORD_DENSITY || '500', 10),
    maxPages = parseInt(process.env.SH_MAX_PAGES || '15', 10),
  } = options;

  const normalizedText = text.replace(/\r\n/g, '\n').trim();

  // 1. Save original text to local private storage
  const storagePath = getStorageRoot();
  const originalsDir = path.resolve(storagePath, 'originals');
  if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, { recursive: true });
  }
  const binaryFilePath = path.join(originalsDir, `${manuscriptId}.txt`);
  fs.writeFileSync(binaryFilePath, normalizedText, 'utf-8');

  // 2. Compute word count and page estimation early
  const words = normalizedText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / wordDensity));

  // Authoritative page limit validation
  if (estimatedPages > maxPages) {
    throw new Error(
      `PAGE_LIMIT_EXCEEDED: Document contains approximately ${estimatedPages} pages (${wordCount} words), exceeding the maximum allowed limit of ${maxPages} pages.`
    );
  }

  // 3. Decompose text into sections
  const lines = normalizedText.split('\n');
  const sections: DocumentSection[] = [];
  let currentTitle = title?.trim() || 'Title & Preliminary';
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
      const likelyTable = /(\b\d+(\.\d+)?\b[\s\t]+){3,}/.test(content) || /\|.*\|.*\|/.test(content);

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
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (currentLines.length > 0) {
        currentLines.push('');
      }
      continue;
    }

    // Heuristics for section heading:
    // 1. Short line (< 80 characters)
    // 2. Either explicitly classified as known heading (not 'unknown')
    // 3. Or numbered heading (e.g., "1. Introduction", "2.1 Study Cohort", "IV. DISCUSSION")
    // 4. Or uppercase header (e.g. "METHODS", "RESULTS AND DISCUSSION")
    const isNumberedHeading = /^((\d+(\.\d+)*)|([IVXLCDM]+))\.\s+[A-Z][\w\s\-:]{2,60}$/i.test(trimmed);
    const isUppercaseHeading = /^[A-Z0-9\s\-:]{3,60}$/.test(trimmed) && trimmed === trimmed.toUpperCase() && trimmed.length > 3;
    const classified = classifySectionHeading(trimmed);
    const isClassifiedHeading = classified !== 'unknown';

    const isHeading = trimmed.length < 80 && (isClassifiedHeading || isNumberedHeading || isUppercaseHeading);

    if (isHeading && currentLines.length > 0) {
      flushSection();
      currentTitle = trimmed;
      currentType = isClassifiedHeading ? classified : classifySectionHeading(trimmed);
    } else {
      currentLines.push(rawLine);
    }
  }

  flushSection();

  if (sections.length === 0 && normalizedText.length > 0) {
    sections.push({
      id: crypto.randomUUID(),
      type: 'unknown',
      title: title || 'Full Manuscript Text',
      order: 0,
      content: normalizedText,
      children: [],
      location: {
        sectionId: '',
        paragraphIndex: 0,
        charStart: 0,
        charEnd: normalizedText.length,
      },
    });
  }

  // 4. Security check: Prompt injection detection on extracted sections
  for (const section of sections) {
    await detectAndLogPromptInjection(manuscriptId, section.content, `Text Section "${section.title}"`);
  }

  const detectedTitle = title || (sections[0]?.title !== 'Title & Preliminary' ? sections[0]?.title : 'Untitled Manuscript');

  return {
    manuscriptId,
    sourceType: 'text',
    pageCount: estimatedPages,
    pageCountConfidence: 'estimated',
    sections,
    rawText: normalizedText,
    metadata: {
      title: detectedTitle,
      extractedAt: new Date().toISOString(),
      ocrUsed: false,
    },
  };
}
