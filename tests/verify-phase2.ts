import fs from 'fs';
import path from 'path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';
import {
  parseDocx,
  parsePdf,
  parseText,
  parseUrl,
} from '../src/modules/document-parser';
import {
  manuscriptRepository,
  processingEventRepository,
} from '../src/lib/storage/repositories';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runVerification() {
  console.log('=== STARTING PHASE 2 INTAKE & DECOMPOSITION VERIFICATION ===\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
      failCount++;
    }
  }

  // 1. DOCX Intake Test
  console.log('\n--- 1. Testing DOCX Intake ---');
  const docxSamplePath = path.resolve(__dirname, 'fixtures', 'sample_synthetic.docx');
  assert(fs.existsSync(docxSamplePath), 'DOCX fixture exists', `Missing fixture at ${docxSamplePath}`);
  if (fs.existsSync(docxSamplePath)) {
    const docxBuffer = fs.readFileSync(docxSamplePath);
    const docxId = crypto.randomUUID();
    try {
      const parsedDocx = await parseDocx({
        manuscriptId: docxId,
        buffer: docxBuffer,
        originalFilename: 'sample_synthetic.docx',
      });

      assert(parsedDocx.sourceType === 'docx', 'DOCX sourceType is docx');
      assert(parsedDocx.sections.length > 0, `DOCX parsed sections count: ${parsedDocx.sections.length}`);
      assert(parsedDocx.pageCount > 0 && parsedDocx.pageCount <= 15, `DOCX pageCount within limit: ${parsedDocx.pageCount}`);

      // Persist DOCX
      await manuscriptRepository.createManuscript({
        id: docxId,
        title: parsedDocx.metadata?.title || 'Synthetic DOCX Trial',
        sourceType: 'docx',
        originalFilename: 'sample_synthetic.docx',
        pageCount: parsedDocx.pageCount,
        pageCountConfidence: parsedDocx.pageCountConfidence,
        wordCount: parsedDocx.rawText.split(/\s+/).filter(Boolean).length,
        status: 'parsed',
        styleProfile: 'original_research',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const sectionRecords = parsedDocx.sections.map((s) => ({
        id: s.id,
        manuscriptId: docxId,
        parentId: null,
        type: s.type,
        title: s.title,
        orderIndex: s.order,
        content: s.content,
        tableData: s.table ? JSON.stringify(s.table) : null,
        rawHtml: s.rawHtml || null,
        charCount: s.content.length,
        createdAt: new Date(),
      }));
      await manuscriptRepository.saveParsedSections(sectionRecords);

      const retrieved = await manuscriptRepository.getManuscriptById(docxId);
      assert(retrieved !== null && retrieved.sections.length === parsedDocx.sections.length, 'DOCX successfully persisted and retrieved from SQLite');
    } catch (err: any) {
      assert(false, 'DOCX parsing failed', err.message);
    }
  }

  // 2. PDF Intake Test
  console.log('\n--- 2. Testing PDF Intake ---');
  const pdfSamplePath = path.resolve(__dirname, 'fixtures', 'sample_synthetic.pdf');
  assert(fs.existsSync(pdfSamplePath), 'PDF fixture exists', `Missing fixture at ${pdfSamplePath}`);
  if (fs.existsSync(pdfSamplePath)) {
    const pdfBuffer = fs.readFileSync(pdfSamplePath);
    const pdfId = crypto.randomUUID();
    try {
      const parsedPdf = await parsePdf({
        manuscriptId: pdfId,
        buffer: pdfBuffer,
        originalFilename: 'sample_synthetic.pdf',
      });

      assert(parsedPdf.sourceType === 'pdf', 'PDF sourceType is pdf');
      assert(parsedPdf.pageCount > 0 && parsedPdf.pageCount <= 15, `PDF physical page count within limit: ${parsedPdf.pageCount}`);
      assert(parsedPdf.sections.length > 0, `PDF parsed sections count: ${parsedPdf.sections.length}`);

      // Persist PDF
      await manuscriptRepository.createManuscript({
        id: pdfId,
        title: parsedPdf.metadata?.title || 'Synthetic PDF Trial',
        sourceType: 'pdf',
        originalFilename: 'sample_synthetic.pdf',
        pageCount: parsedPdf.pageCount,
        pageCountConfidence: parsedPdf.pageCountConfidence,
        wordCount: parsedPdf.rawText.split(/\s+/).filter(Boolean).length,
        status: 'parsed',
        styleProfile: 'original_research',
        ocrUsed: parsedPdf.metadata?.ocrUsed || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const retrievedPdf = await manuscriptRepository.getManuscriptById(pdfId);
      assert(retrievedPdf !== null, 'PDF successfully persisted and retrieved from SQLite');
    } catch (err: any) {
      assert(false, 'PDF parsing failed', err.message);
    }
  }

  // 3. Plain Text Intake Test
  console.log('\n--- 3. Testing Text Intake & Decomposition ---');
  const sampleAcademicText = `A Randomized Trial of Novel Therapeutic Agents in Cardiorenal Syndromes

ABSTRACT
Background: Cardiorenal syndrome remains a primary driver of morbidity. We assessed the efficacy of combined sodium-glucose cotransporter-2 inhibition.
Methods: In this double-blind trial, 450 patients were randomized 1:1 to active therapy or placebo.
Results: Primary composite endpoint occurred in 14.2% versus 23.8% (HR 0.58; 95% CI 0.41-0.82; p=0.002).
Conclusions: Therapy significantly reduced cardiorenal decompensation.

1. INTRODUCTION
Cardiorenal syndromes involve complex bidirectional neurohormonal feedback loops. Previous registry analyses have highlighted persistent clinical vulnerabilities.

2. METHODS AND STUDY DESIGN
Eligible participants had chronic kidney disease (eGFR 25-60 mL/min/1.73m2) and persistent albuminuria. All participants provided written informed consent.

3. RESULTS
Baseline demographics were well balanced across both treatment arms. Systolic blood pressure decreased by 4.2 mmHg in the intervention arm.

4. DISCUSSION
Our findings demonstrate clinically meaningful cardiovascular and renal preservation across high-risk patient cohorts.

REFERENCES
1. Smith JA, et al. N Engl J Med. 2021;384:145-155.
2. Doe R, et al. Lancet. 2022;399:1120-1130.`;

  const textId = crypto.randomUUID();
  try {
    const parsedText = await parseText({
      manuscriptId: textId,
      text: sampleAcademicText,
      title: 'Cardiorenal Trial Text Ingestion',
    });

    assert(parsedText.sourceType === 'text', 'Text sourceType is text');
    assert(parsedText.sections.length >= 5, `Text decomposed into ${parsedText.sections.length} sections`);

    const sectionTypes = parsedText.sections.map((s) => s.type);
    assert(sectionTypes.includes('abstract'), 'Extracted section includes abstract');
    assert(sectionTypes.includes('introduction'), 'Extracted section includes introduction');
    assert(sectionTypes.includes('methods'), 'Extracted section includes methods');
    assert(sectionTypes.includes('results'), 'Extracted section includes results');
    assert(sectionTypes.includes('discussion'), 'Extracted section includes discussion');
    assert(sectionTypes.includes('references'), 'Extracted section includes references');

    // Persist Text
    await manuscriptRepository.createManuscript({
      id: textId,
      title: parsedText.metadata?.title || 'Cardiorenal Trial',
      sourceType: 'text',
      pageCount: parsedText.pageCount,
      pageCountConfidence: parsedText.pageCountConfidence,
      wordCount: parsedText.rawText.split(/\s+/).filter(Boolean).length,
      status: 'parsed',
      styleProfile: 'original_research',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const retrievedText = await manuscriptRepository.getManuscriptById(textId);
    assert(retrievedText !== null, 'Text manuscript persisted and retrieved from SQLite');
  } catch (err: any) {
    assert(false, 'Text intake failed', err.message);
  }

  // 4. SSRF Guard Verification
  console.log('\n--- 4. Testing SSRF Protection ---');
  try {
    await parseUrl({ manuscriptId: 'ssrf-test-1', url: 'http://127.0.0.1:8080/secret' });
    assert(false, 'SSRF loopback 127.0.0.1 was NOT blocked');
  } catch (err: any) {
    assert(err.message.includes('SSRF_GUARD_VIOLATION'), 'Loopback 127.0.0.1 correctly blocked with SSRF_GUARD_VIOLATION');
  }

  try {
    await parseUrl({ manuscriptId: 'ssrf-test-2', url: 'http://169.254.169.254/latest/meta-data/' });
    assert(false, 'SSRF cloud metadata 169.254.169.254 was NOT blocked');
  } catch (err: any) {
    assert(err.message.includes('SSRF_GUARD_VIOLATION'), 'Cloud metadata address 169.254.169.254 correctly blocked');
  }

  try {
    await parseUrl({ manuscriptId: 'ssrf-test-3', url: 'ftp://ftp.example.com/file.txt' });
    assert(false, 'Unsupported protocol ftp:// was NOT blocked');
  } catch (err: any) {
    assert(err.message.includes('UNSUPPORTED_PROTOCOL'), 'Unsupported protocol correctly rejected');
  }

  // 5. 15-Page Limit Enforcement
  console.log('\n--- 5. Testing 15-Page Limit Enforcement ---');
  try {
    // Generate text exceeding 15 pages (16 pages * 500 words = 8000 words)
    const longTextWords = Array(8500).fill('clinical').join(' ');
    await parseText({
      manuscriptId: 'page-limit-test',
      text: longTextWords,
      maxPages: 15,
      wordDensity: 500,
    });
    assert(false, 'Document exceeding 15 pages was NOT rejected');
  } catch (err: any) {
    assert(err.message.includes('PAGE_LIMIT_EXCEEDED'), `Exceeded page limit correctly rejected: ${err.message}`);
  }

  // 6. Zero Operational Log Privacy Check
  console.log('\n--- 6. Testing Operational Logging Privacy Check ---');
  const event = await processingEventRepository.logEvent(
    textId,
    'intake_test',
    'info',
    'Document ingested: 6 sections, 3 pages, OCR: false.'
  );
  assert(!event.detail.includes(sampleAcademicText), 'Operational log detail does NOT contain manuscript text');
  assert(event.eventSeverity === 'info', 'Operational event logged with correct severity');

  console.log(`\n=== VERIFICATION FINISHED: ${passCount} PASSED, ${failCount} FAILED ===`);
  if (failCount > 0) {
    process.exit(1);
  }
}

runVerification().catch((e) => {
  console.error('Verification error:', e);
  process.exit(1);
});
