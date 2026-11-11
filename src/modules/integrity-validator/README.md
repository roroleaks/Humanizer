# Integrity Validator Module

## Responsibility
Responsible for rigorous, deterministic scientific integrity verification:
- Construction of the pre-refinement `ProtectedInventory` across 15 critical scientific categories.
- Comparing revised paragraphs against the immutable `ProtectedInventory`.
- Categorical evaluation of numerical, statistical, dosage, citation, and outcome consistency.
- Classification of detected discrepancies into `INFO`, `WARNING`, and `FAIL` severities.
- Generation of the structured `ValidationReport`.
- Strict enforcement of the "No Silent Approval" rule for detected discrepancies.

## Public Interface
- `buildProtectedInventoryStub(document: ParsedDocument): Promise<ProtectedInventory>`: Phase 0 typed stub. Real inventory extraction will be implemented in Phase 5.
- `validateIntegrityStub(original: ParsedDocument, revised: RefinementResult): Promise<ValidationReport>`: Phase 0 typed stub. Real validation comparison will be implemented in Phase 5.

## Boundary Rules
- **May import from:** `src/contracts/`, `src/lib/`, `src/modules/document-parser` (read-only)
- **FORBIDDEN to import from:** `src/modules/refinement-engine`, `src/modules/ai-orchestrator`, `src/modules/docx-generator`.
- **Architectural Rationale:** The validator is strictly isolated from the refinement engine to prevent validation logic from being biased or coupled to the rewriting mechanism.
