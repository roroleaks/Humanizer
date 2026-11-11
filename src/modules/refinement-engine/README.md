# Refinement Engine Module

## Responsibility
Responsible for scientific manuscript refinement orchestration:
- Decomposing sections into coherent refinement chunks.
- Applying contextual prompts tailored to the specified `ManuscriptStyleProfile`.
- Orchestrating LLM calls via the `ai-orchestrator` module.
- Structuring output into paragraph-level revisions with change metrics (`minor`, `major`, `unchanged`).
- Flagging ambiguous meanings and suspected factual claims for author inspection.

## Public Interface
- `refineManuscriptStub(document: ParsedDocument, profile: ManuscriptStyleProfile): Promise<RefinementResult>`: Phase 0 typed stub. Real refinement logic will be implemented in Phase 5.

## Boundary Rules
- **May import from:** `src/contracts/`, `src/lib/`, `src/modules/ai-orchestrator`, `src/modules/document-parser` (read-only)
- **FORBIDDEN to import from:** `src/modules/integrity-validator`, `src/modules/docx-generator`.
