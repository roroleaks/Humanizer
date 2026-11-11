# Development Roadmap — Scientific Humanizer

---

## 1. Roadmap Overview & Timeline

The implementation of Scientific Humanizer is structured across **eight disciplined phases**. Each phase has strict entry and exit criteria, automated verification gates, and explicit non-negotiable boundaries.

```
Phase 0 [CURRENT]  ──►  Phase 1        ──►  Phase 2        ──►  Phase 3
Foundation & Specs      Premium UI Shell     Document Intake      AI Orchestration
(Contracts, Docs)       (App Router, Routes) (DOCX, PDF, URL)     (Adapters, Failover)
        │
        ▼
Phase 4            ──►  Phase 5        ──►  Phase 6        ──►  Phase 7 & 8
Writing Profiler        Refinement &         Dual-Panel Diff      Hardening, Security,
(Metrics, Cadence)      Integrity Validator  & DOCX Export        Production Launch
```

---

## 2. Phase-by-Phase Execution Plan

### Phase 0: Project Foundation & Architecture (Current Phase)
- **Status:** COMPLETE
- **Deliverables:** Architectural specifications, domain contracts, module scaffolding with stubs, `.env.example`, `.antigravity/STATE.md`, type check and lint verification.
- **Exit Gate:** All 12 docs exist, `tsc --noEmit` and `next lint` pass with 0 errors.

### Phase 1: Premium UI/UX Design System & Application Shell
- **Scope:** Implement the complete Next.js 14 App Router layout, navigation bar, sidebar, and 7 primary views (`/`, `/new`, `/manuscripts`, `/history`, `/providers`, `/settings`, `/help`) using Tailwind CSS and shadcn/ui.
- **Deliverables:** Reusable UI components (buttons, badges, modals, cards, tabs), layout templates, responsive shells, theme tokens.
- **Rule:** All interactive action buttons are labeled "Not yet implemented" or wire to Phase 0 stubs; no fake data presented as real processing.

### Phase 2: Multi-Channel Document Intake & Section Decomposition
- **Scope:** Implement real intake processing for DOCX, PDF, URL, and text.
- **Deliverables:**
  - `mammoth` integration for DOCX extraction.
  - `unpdf` integration for PDF extraction, physical page calculation, and scanned OCR detection.
  - SSRF-protected URL fetcher with IP filtering and HTML stripping.
  - Section decomposition engine mapping text into `DocumentSection` hierarchies.
  - 15-page limit enforcement gateway.

### Phase 3: Multi-Provider AI Orchestration & Adapter Infrastructure
- **Scope:** Implement real server-side adapters for OpenAI, Google Gemini, Anthropic Claude, and OpenAI-compatible endpoints.
- **Deliverables:**
  - `OpenAIAdapter`, `GeminiAdapter`, `AnthropicAdapter`, `OpenAICompatibleAdapter`.
  - Failover orchestration logic, exponential backoff retries, and timeout management.
  - Provider health ping checks and latency telemetry.
  - Server-side key management and content-sanitized logging.

### Phase 4: Academic Writing Profiler & Readability Engine
- **Scope:** Implement statistical text profiling algorithms analyzing academic prose.
- **Deliverables:**
  - Sentence length variation and rhythm distribution scoring.
  - Lexical diversity index (Type-Token Ratio, Academic Word List density).
  - Formulaic transition detector (identifying repetitive "Furthermore", "Moreover", "It is noteworthy that").
  - Baseline academic genre classification (`original_research`, `systematic_review`, etc.).

### Phase 5: Refinement Pipeline & Scientific Integrity Validator
- **Scope:** Implement the core humanization engine and deterministic validation system.
- **Deliverables:**
  - Pre-refinement `ProtectedInventory` extractor across all 15 scientific categories.
  - Context-aware section chunking and prompt generation.
  - Independent `integrity-validator` module comparing revisions against the inventory.
  - Categorical discrepancy classification (`INFO`, `WARNING`, `FAIL`).
  - Strict enforcement of the "No Silent Approval" rule.

### Phase 6: Dual-Panel Comparison Viewer & DOCX Export Engine
- **Scope:** Build the side-by-side synchronized review interface and publication-grade Word generator.
- **Deliverables:**
  - Synchronized dual-panel paragraph diff viewer with inline integrity flags.
  - Paragraph-level revert / approve controls.
  - Publication-grade DOCX compilation using the `docx` npm library, preserving heading styles, tables, citations, and metadata.
  - Pre-download document integrity verification.

### Phase 7: End-to-End Hardening, Security Audits & Edge Case Testing
- **Scope:** Rigorous testing and performance benchmarking.
- **Deliverables:**
  - SSRF penetration testing against loopback and cloud metadata ranges.
  - Prompt-injection stress testing using adversarial manuscript payloads.
  - Load testing long manuscripts (up to 15 pages) under simulated network degradation.
  - Cross-browser responsive audit.

### Phase 8: Production Release, Telemetry & Documentation Finalization
- **Scope:** Final deployment readiness.
- **Deliverables:**
  - Production build optimization and containerization.
  - Deployment guides for Vercel and self-hosted Docker environments.
  - Operator runbook and end-user scientific writing guide.

---

## 3. Technical Risks & Mitigation Strategies

| Risk Description | Severity | Likelihood | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **LLM Hallucination of Numbers or Citations** | HIGH | MEDIUM | Pre-refinement `ProtectedInventory` + post-refinement deterministic discrepancy check with blocking `FAIL` status. |
| **LLM Chunk Boundary Context Loss** | MEDIUM | HIGH | Pass preceding and succeeding section summaries into `DocumentSectionContext` for every chunk. |
| **SSRF via User-Provided URLs** | HIGH | LOW | Strict DNS resolution, IP range filtering (RFC 1918), and redirect destination re-verification. |
| **OCR Latency on Scanned PDFs** | MEDIUM | MEDIUM | Flag image-based PDFs at intake; calculate text-density ratio before triggering OCR pipeline. |
| **AI Provider Rate Limiting / Outages** | MEDIUM | HIGH | Multi-provider fallback chain (OpenAI -> Gemini -> Claude) with exponential backoff and jitter. |

---

## 4. Unresolved Technical Decisions (Surfaced for User Input)

1. **OCR Engine Selection:** Should scanned PDF processing default to client-side/server-side Tesseract.js (free, self-contained, but CPU-intensive) or an external cloud OCR API (e.g., Google Cloud Vision, AWS Textract)?
2. **Database Engine in Local Dev:** Should local development utilize an embedded SQLite database (via Prisma/Drizzle) or require a local/remote Supabase PostgreSQL instance from Phase 1 onward?
3. **Word Density Calibration:** Is 500 words/page the optimal density standard for all scientific genres, or should dense biomedical papers with tables default to 400 words/page?
