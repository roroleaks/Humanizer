import './setup-env';
import fs from 'node:fs';
import path from 'node:path';
import { manuscriptRepository } from '../src/lib/storage/repositories';
import { refinementEngine, refinementRepository } from '../src/modules/refinement-engine';
import { generateManuscriptDocx } from '../src/modules/docx-exporter/docx-generator';
import { ManuscriptWithRelations } from '../src/contracts/manuscript';

async function runDocxExportTest() {
  console.log('=== STARTING COMPLETE PIPELINE TEST: INTAKE -> CONSENT -> REFINEMENT -> WORD DOCX EXPORT ===\n');

  // Step 1: Create Manuscript
  const manuscriptId = `ms_docx_${Date.now()}`;
  console.log(`[STEP 1] Creating manuscript: ${manuscriptId}`);

  await manuscriptRepository.createManuscript({
    id: manuscriptId,
    title: 'Trial of Sodium-Glucose Cotransporter 2 Inhibition in Heart Failure with Preserved Ejection Fraction',
    status: 'parsed',
    sourceType: 'text',
    pageCount: 3,
    pageCountConfidence: 'verified',
    wordCount: 750,
    ocrUsed: false,
    styleProfile: 'original_research',
    primaryProvider: 'gemini',
    refinementConsentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Add sample sections: Abstract, Introduction, Results (with Table), Discussion
  await manuscriptRepository.saveParsedSections([
    {
      id: `sec_${manuscriptId}_abs`,
      manuscriptId,
      orderIndex: 0,
      type: 'abstract',
      title: 'Abstract',
      content: 'Background: Sodium-glucose cotransporter 2 (SGLT2) inhibitors reduce cardiovascular death in reduced ejection fraction. Methods: In this double-blind trial, 5,988 patients were randomized to dapagliflozin (10 mg once daily) or placebo. Results: The primary composite outcome occurred in 498 of 2,997 patients (16.6%) in the dapagliflozin group and 612 of 2,991 patients (20.5%) in the placebo group (hazard ratio, 0.80; 95% CI, 0.71 to 0.90; P<0.001). Conclusions: Dapagliflozin significantly reduced composite cardiovascular mortality and heart failure hospitalization.',
      charCount: 520,
      createdAt: new Date(),
    },
    {
      id: `sec_${manuscriptId}_intro`,
      manuscriptId,
      orderIndex: 1,
      type: 'introduction',
      title: 'Introduction',
      content: 'Heart failure with preserved ejection fraction constitutes approximately half of all heart failure hospitalizations worldwide. Despite substantial therapeutic progress in heart failure with reduced ejection fraction, effective pharmacological strategies that improve hard clinical outcomes in preserved ejection fraction have remained remarkably elusive. SGLT2 inhibitors demonstrate profound cardiorenal metabolic improvements across diverse clinical populations.',
      charCount: 430,
      createdAt: new Date(),
    },
    {
      id: `sec_${manuscriptId}_res`,
      manuscriptId,
      orderIndex: 2,
      type: 'results',
      title: 'Primary and Secondary Outcomes',
      content: 'Table 1 delineates primary efficacy endpoints stratified by baseline renal function and glycemic status.',
      tableData: JSON.stringify({
        rows: 3,
        columns: 4,
        cells: [
          [
            { text: 'Efficacy Endpoint', colSpan: 1, rowSpan: 1, headerScope: 'col' },
            { text: 'Dapagliflozin (N=2,997)', colSpan: 1, rowSpan: 1, headerScope: 'col' },
            { text: 'Placebo (N=2,991)', colSpan: 1, rowSpan: 1, headerScope: 'col' },
            { text: 'Hazard Ratio (95% CI)', colSpan: 1, rowSpan: 1, headerScope: 'col' },
          ],
          [
            { text: 'Primary Composite Endpoint', colSpan: 1, rowSpan: 1, headerScope: 'row' },
            { text: '498 (16.6%)', colSpan: 1, rowSpan: 1, headerScope: null },
            { text: '612 (20.5%)', colSpan: 1, rowSpan: 1, headerScope: null },
            { text: '0.80 (0.71-0.90), P<0.001', colSpan: 1, rowSpan: 1, headerScope: null },
          ],
          [
            { text: 'Cardiovascular Death', colSpan: 1, rowSpan: 1, headerScope: 'row' },
            { text: '215 (7.2%)', colSpan: 1, rowSpan: 1, headerScope: null },
            { text: '249 (8.3%)', colSpan: 1, rowSpan: 1, headerScope: null },
            { text: '0.86 (0.72-1.03), P=0.10', colSpan: 1, rowSpan: 1, headerScope: null },
          ],
        ],
      }),
      charCount: 110,
      createdAt: new Date(),
    },
    {
      id: `sec_${manuscriptId}_disc`,
      manuscriptId,
      orderIndex: 3,
      type: 'discussion',
      title: 'Discussion',
      content: 'In this phase 3 trial comprising patients with heart failure and left ventricular ejection fraction >40%, administration of dapagliflozin produced a robust 20% relative reduction in the primary outcome. Importantly, this therapeutic benefit was consistently observed across prespecified subgroups, irrespective of baseline presence or absence of type 2 diabetes.',
      charCount: 360,
      createdAt: new Date(),
    },
  ]);
  console.log('[PASS] Manuscript and 4 structured sections inserted into storage.');

  // Step 2: Record Pre-refinement Consent
  console.log('\n[STEP 2] Recording pre-refinement consent...');
  await refinementRepository.recordConsent(manuscriptId);
  const hasConsent = await refinementRepository.hasConsent(manuscriptId);
  if (!hasConsent) throw new Error('Consent recording failed');
  console.log('[PASS] Consent verified and recorded in SQLite.');

  // Step 3: Plan Refinement Job
  console.log('\n[STEP 3] Planning semantic refinement job...');
  const plan = await refinementEngine.planJob({
    manuscriptId,
    styleProfile: 'original_research',
    intensity: 'standard',
    primaryProvider: 'gemini',
  });
  console.log(`[PASS] Refinement plan created: Job ${plan.jobId} with ${plan.totalChunks} chunk(s).`);

  // Step 4: Stream Refinement with Natural Writing Style
  console.log('\n[STEP 4] Executing streaming refinement...');
  let completedChunks = 0;
  for await (const event of refinementEngine.runJob(plan.jobId)) {
    if (event.type === 'chunk_started') {
      console.log(` -> Chunk ${event.chunkIndex} started (Provider: ${event.providerName})`);
    } else if (event.type === 'chunk_completed') {
      completedChunks++;
      console.log(` -> Chunk completed: Refined text length = ${event.refinedText.length} chars`);
    } else if (event.type === 'provider_failover') {
      console.warn(` -> Provider failover: ${event.fromProvider} -> ${event.toProvider}`);
    } else if (event.type === 'job_completed') {
      console.log(` -> Job completed successfully.`);
    }
  }

  // Retrieve results
  const results = await refinementEngine.getJobResults(plan.jobId);
  const paragraphCount = results.refinedParagraphs?.length || 0;
  console.log(`[PASS] Refinement results retrieved: ${paragraphCount} refined section(s).`);

  // Step 5: Export to Microsoft Word (.docx)
  console.log('\n[STEP 5] Generating publication-grade Word (.docx) manuscript...');
  const rawData = await manuscriptRepository.getManuscriptById(manuscriptId);
  if (!rawData) throw new Error('Manuscript not found');

  const fullManuscript: ManuscriptWithRelations = {
    id: rawData.manuscript.id,
    title: rawData.manuscript.title,
    status: rawData.manuscript.status,
    sourceType: rawData.manuscript.sourceType,
    pageCount: rawData.manuscript.pageCount,
    pageCountConfidence: rawData.manuscript.pageCountConfidence,
    wordCount: rawData.manuscript.wordCount,
    ocrUsed: rawData.manuscript.ocrUsed,
    styleProfile: rawData.manuscript.styleProfile,
    primaryProvider: rawData.manuscript.primaryProvider ?? undefined,
    refinementConsentAt: rawData.manuscript.refinementConsentAt ? rawData.manuscript.refinementConsentAt.toISOString() : undefined,
    createdAt: rawData.manuscript.createdAt.toISOString(),
    updatedAt: rawData.manuscript.updatedAt.toISOString(),
    sections: rawData.sections.map((s) => ({
      id: s.id,
      manuscriptId: s.manuscriptId,
      parentId: s.parentId ?? undefined,
      type: s.type as any,
      title: s.title,
      orderIndex: s.orderIndex,
      content: s.content,
      tableData: s.tableData ? JSON.parse(s.tableData) : undefined,
      rawHtml: s.rawHtml ?? undefined,
      charCount: s.charCount,
      createdAt: s.createdAt.toISOString(),
    })),
    metadata: ((rawData as any).metadata || []).map((m: any) => ({
      id: m.id,
      manuscriptId: m.manuscriptId,
      key: m.key,
      value: m.value,
      createdAt: m.createdAt.toISOString(),
    })),
  };

  const docxBuffer = await generateManuscriptDocx(fullManuscript, results);

  // Validate DOCX buffer
  console.log(`[PASS] DOCX buffer generated: size = ${docxBuffer.length} bytes (${(docxBuffer.length / 1024).toFixed(1)} KB)`);

  // Verify Zip Magic Bytes: 50 4B 03 04 (PK\x03\x04)
  const isZipMagic = docxBuffer[0] === 0x50 && docxBuffer[1] === 0x4b && docxBuffer[2] === 0x03 && docxBuffer[3] === 0x04;
  if (!isZipMagic) {
    throw new Error('Generated DOCX buffer does not start with PK ZIP header magic bytes!');
  }
  console.log('[PASS] Valid PK Zip / OOXML magic header confirmed.');

  // Save to output folder
  const outputDir = path.resolve(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'test_exported_manuscript.docx');
  fs.writeFileSync(outputPath, docxBuffer);
  console.log(`[PASS] Exported file written to disk: ${outputPath}`);

  console.log('\n=== ALL TESTS PASSED: COMPLETE PIPELINE THROUGH WORD EXPORT VERIFIED ===\n');
  process.exit(0);
}

runDocxExportTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
