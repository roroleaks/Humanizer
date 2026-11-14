import dns from 'dns/promises';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import {
  DocumentSection,
  ParsedDocument,
  TableData,
  TableCell,
} from '@/contracts/document-section';
import { classifySectionHeading } from './section-classifier';
import { detectAndLogPromptInjection } from './security-guard';
import { getStorageRoot } from '@/lib/storage-path';

export interface UrlFetchOptions {
  manuscriptId: string;
  url: string;
  wordDensity?: number;
  maxPages?: number;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_REDIRECTS = 5;

/**
 * Validates an IP address against RFC 1918, loopbacks, and cloud metadata addresses.
 */
function isRestrictedIp(ip: string): boolean {
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc00:') || ip.startsWith('fd00:')) {
    return true; // IPv6 loopback / ULA / link-local
  }

  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [b1, b2] = parts;
    if (b1 === 127) return true; // Loopback
    if (b1 === 10) return true; // RFC 1918 Class A
    if (b1 === 172 && b2 >= 16 && b2 <= 31) return true; // RFC 1918 Class B
    if (b1 === 192 && b2 === 168) return true; // RFC 1918 Class C
    if (b1 === 169 && b2 === 254) return true; // Link-local / Cloud metadata (169.254.169.254)
    if (b1 === 0) return true; // Current network
  }

  return false;
}

/**
 * Performs SSRF-guarded HTTP GET request.
 */
async function fetchSafeUrl(targetUrl: string, redirectCount = 0): Promise<{ html: string; finalUrl: string }> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error('SSRF_GUARD_VIOLATION: Exceeded maximum allowed redirects (5).');
  }

  const parsed = new URL(targetUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('UNSUPPORTED_PROTOCOL: Only http: and https: URLs are permitted.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('SSRF_GUARD_VIOLATION: Destination host is restricted.');
  }

  // Authoritative DNS pre-resolution
  const lookupResult = await dns.lookup(hostname, { all: true });
  for (const entry of lookupResult) {
    if (isRestrictedIp(entry.address)) {
      throw new Error(`SSRF_GUARD_VIOLATION: Resolved IP ${entry.address} is a restricted private/loopback destination.`);
    }
  }

  return new Promise((resolve, reject) => {
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: `${parsed.pathname}${parsed.search}`,
      method: 'GET',
      headers: {
        'User-Agent': 'ScientificHumanizer/0.1 (+https://scientific-humanizer.local)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      },
      timeout: DEFAULT_TIMEOUT_MS,
    };

    const req = client.request(requestOptions, (res) => {
      // Handle redirects
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, targetUrl).toString();
        res.resume();
        fetchSafeUrl(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        res.resume();
        reject(new Error(`HTTP_ERROR: Server returned status code ${res.statusCode}`));
        return;
      }

      let data = '';
      let receivedBytes = 0;

      res.on('data', (chunk) => {
        receivedBytes += chunk.length;
        if (receivedBytes > DEFAULT_MAX_BYTES) {
          req.destroy(new Error(`RESPONSE_TOO_LARGE: Download exceeded ${DEFAULT_MAX_BYTES} byte limit.`));
          return;
        }
        data += chunk;
      });

      res.on('end', () => {
        resolve({ html: data, finalUrl: targetUrl });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('TIMEOUT: Web request timed out after 15 seconds.'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

export async function parseUrl(options: UrlFetchOptions): Promise<ParsedDocument> {
  const {
    manuscriptId,
    url,
    wordDensity = parseInt(process.env.SH_PAGE_WORD_DENSITY || '500', 10),
    maxPages = parseInt(process.env.SH_MAX_PAGES || '15', 10),
  } = options;

  // 1. Fetch web article with authoritative SSRF validation
  const { html, finalUrl } = await fetchSafeUrl(url);

  // 2. Save raw HTML to local private storage
  const storagePath = getStorageRoot();
  const originalsDir = path.resolve(storagePath, 'originals');
  if (!fs.existsSync(originalsDir)) {
    fs.mkdirSync(originalsDir, { recursive: true });
  }
  const binaryFilePath = path.join(originalsDir, `${manuscriptId}.html`);
  fs.writeFileSync(binaryFilePath, html, 'utf-8');

  // 3. Extract readable article body using Mozilla Readability
  const dom = new JSDOM(html, { url: finalUrl });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.content) {
    throw new Error('CONTENT_EXTRACTION_FAILED: Unable to extract scientific article text from HTML page.');
  }

  // 4. Decompose HTML article content into typed DocumentSection hierarchy
  const articleDom = new JSDOM(article.content);
  const articleDoc = articleDom.window.document;

  const sections: DocumentSection[] = [];
  let currentTitle = 'Article Header & Title';
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
        rawHtml: article?.content || undefined,
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

  const elements = Array.from(articleDoc.body.children);
  for (const elem of elements) {
    const tag = elem.tagName.toLowerCase();

    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      flushSection();
      const heading = elem.textContent?.trim() || 'Untitled Section';
      currentTitle = heading;
      currentType = classifySectionHeading(heading);
    } else if (tag === 'table') {
      flushSection();
      currentTitle = `Table ${sections.filter((s) => s.type === 'table').length + 1}`;
      currentType = 'table';

      const tableElem = elem as HTMLTableElement;
      const rows = Array.from(tableElem.querySelectorAll('tr'));
      const tableCells: TableCell[][] = [];

      for (const row of rows) {
        const rowCells: TableCell[] = [];
        const cells = Array.from(row.querySelectorAll('th, td'));
        for (const cell of cells) {
          rowCells.push({
            text: cell.textContent?.trim() || '',
            colSpan: parseInt(cell.getAttribute('colspan') || '1', 10),
            rowSpan: parseInt(cell.getAttribute('rowspan') || '1', 10),
            headerScope: cell.tagName.toLowerCase() === 'th' ? 'column' : null,
          });
        }
        if (rowCells.length > 0) tableCells.push(rowCells);
      }

      currentTableData = {
        rows: tableCells.length,
        columns: tableCells[0]?.length || 0,
        cells: tableCells,
      };
      currentContentParts.push(elem.textContent?.trim() || '');
      flushSection();
      currentTitle = 'Continuing Text';
      currentType = 'unknown';
    } else {
      const text = elem.textContent?.trim();
      if (text) {
        currentContentParts.push(text);
      }
    }
  }

  flushSection();

  const rawText = sections.map((s) => `${s.title}\n${s.content}`).join('\n\n');
  const words = rawText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const estimatedPages = Math.max(1, Math.ceil(wordCount / wordDensity));

  // Security check: Prompt injection detection on extracted sections
  for (const section of sections) {
    await detectAndLogPromptInjection(manuscriptId, section.content, `URL Section "${section.title}"`);
  }

  // Authoritative page limit validation
  if (estimatedPages > maxPages) {
    throw new Error(
      `PAGE_LIMIT_EXCEEDED: Extracted web article contains approximately ${estimatedPages} pages, exceeding the maximum allowed limit of ${maxPages} pages.`
    );
  }

  return {
    manuscriptId,
    sourceType: 'url',
    pageCount: estimatedPages,
    pageCountConfidence: 'estimated',
    sections,
    rawText,
    metadata: {
      title: article.title || 'Untitled Web Article',
      authors: article.byline ? [article.byline] : undefined,
      sourceUrl: finalUrl,
      extractedAt: new Date().toISOString(),
      ocrUsed: false,
    },
  };
}
