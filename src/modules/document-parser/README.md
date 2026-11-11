# Document Parser Module

## Responsibility
Responsible for multi-channel intake of academic manuscripts:
- DOCX parsing (preserving headings, tables, citations, and structure).
- PDF extraction and physical page count verification (detecting scanned PDFs requiring OCR).
- Public URL fetching (strictly enforcing SSRF protection and private network IP blocking).
- Direct text ingestion with configurable word-density page estimation.
- Decomposition of document text into a typed `DocumentSection` tree with character-level coordinate tracking.
- Page limit enforcement (maximum 15 pages).

## Public Interface
- `parseDocumentStub(source: unknown): Promise<ParsedDocument>`: Phase 0 typed stub. Real parsing logic will be implemented in Phase 2.

## Boundary Rules
- **May import from:** `src/contracts/`, `src/lib/`
- **FORBIDDEN to import from:** All other modules (`writing-profiler`, `refinement-engine`, `integrity-validator`, `docx-generator`, `ai-orchestrator`).
