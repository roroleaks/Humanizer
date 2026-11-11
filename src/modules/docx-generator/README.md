# DOCX Generator Module

## Responsibility
Responsible for compiling refined manuscripts into publication-grade Microsoft Word (.docx) documents:
- Preserving hierarchical headings, numbering, and document metadata.
- Formatting paragraphs with consistent scientific typography and margins.
- Re-integrating tables, captions, footnotes, and bibliographic reference lists.
- Pre-download validation ensuring no text truncation, duplicated paragraphs, or corrupted XML nodes.

## Public Interface
- `generateDocxStub(original: ParsedDocument, revised: RefinementResult): Promise<Buffer>`: Phase 0 typed stub. Real DOCX generation will be implemented in Phase 6.

## Boundary Rules
- **May import from:** `src/contracts/`, `src/lib/`, `src/modules/document-parser` (read-only)
- **FORBIDDEN to import from:** All other modules except `src/contracts/` (`refinement-engine`, `integrity-validator`, `writing-profiler`, `ai-orchestrator`).
