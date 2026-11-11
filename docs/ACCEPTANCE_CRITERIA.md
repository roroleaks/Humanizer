# Phase-by-Phase Acceptance Criteria — Scientific Humanizer

---

## 1. Overview & Verification Protocol

Every phase of Scientific Humanizer must satisfy binary, auditable acceptance criteria before advancement. No phase may proceed automatically. Regressions against previously satisfied criteria result in immediate build failure.

---

## 2. Acceptance Criteria by Phase

### Phase 0: Project Foundation & Architecture (Current Phase)
- [x] All 12 documentation files exist and exceed 200 words of substantive content.
- [x] `.env.example` exists and contains all required variables with zero real credentials.
- [x] `.gitignore` explicitly includes `.env.local`, `/tmp`, `node_modules`, and `.storage`.
- [x] All TypeScript contract files in `src/contracts/` compile cleanly with `tsc --noEmit`.
- [x] No production logic exists in `src/modules/` (stubs return typed empty results only).
- [x] Module boundary rules are strictly enforced (no forbidden imports).
- [x] `.antigravity/STATE.md` exists and is fully filled in.
- [x] No existing files were overwritten without prior inspection.
- [x] No API keys are hardcoded anywhere in the codebase.
- [x] No manuscript text appears in any log statement.
- [x] `next lint` passes with zero errors and zero warnings.
- [x] No UI claims functionality that is not yet implemented.

### Phase 1: Premium UI/UX Design System & App Shell
- [ ] All 7 application routes (`/`, `/new`, `/manuscripts`, `/history`, `/providers`, `/settings`, `/help`) render successfully.
- [ ] Navigation header and sidebar conform to the Deep Navy (`#0B2545`) and Clinical White (`#FFFFFF`) palette.
- [ ] Responsive design functions seamlessly across desktop (1440px), laptop (1024px), and mobile (375px) viewports.
- [ ] Reusable components (Button, Badge, Modal, Card, Dropzone, Alert) conform to `src/styles/design-tokens.ts`.
- [ ] Interactive controls clearly indicate "Not yet implemented" or wire to Phase 0 stubs; zero deceptive UI states.
- [ ] Page navigation accessibility satisfies WCAG 2.1 AA standards.

### Phase 2: Document Intake & Section Decomposition Engine
- [ ] Successfully parses standard `.docx` manuscripts, extracting headings, paragraphs, and tables.
- [ ] Successfully parses text-based `.pdf` files, accurately reporting physical page count.
- [ ] Detects scanned/image-based PDFs with low character density and flags OCR requirement.
- [ ] Successfully retrieves public web articles while rejecting RFC 1918 private IPs, loopback, and metadata addresses.
- [ ] Enforces maximum 15-page limit across all modalities, halting oversized manuscripts with actionable feedback.
- [ ] Correctly decomposes text into a typed `DocumentSection` tree preserving heading hierarchy.

### Phase 3: AI Provider Orchestration & Resilient Adapters
- [ ] Implementations of `AIProviderAdapter` complete for OpenAI, Google Gemini, Anthropic Claude, and OpenAI-compatible endpoints.
- [ ] Provider health check endpoint reports live availability and round-trip latency.
- [ ] Automatic retry with randomized exponential jitter functions on simulated 429 and 503 errors.
- [ ] Automatic fallback switches to secondary provider when primary exceeds timeout (`SH_AI_TIMEOUT_MS`).
- [ ] User is explicitly notified in the UI whenever a fallback provider is utilized.
- [ ] Zero manuscript text appears in server-side application logs or error telemetry.

### Phase 4: Academic Writing Profiler & Readability Engine
- [ ] Computes sentence length distribution and variance across all manuscript sections.
- [ ] Calculates lexical diversity index and Academic Word List (AWL) density.
- [ ] Identifies formulaic academic transitions ("Furthermore", "Moreover", "In summary") and flags repetition.
- [ ] Profiles stylistic markers against the 7 recognized academic genres (`original_research`, `narrative_review`, etc.).
- [ ] Returns structured metrics without mutating the underlying manuscript text.

### Phase 5: Refinement Pipeline & Scientific Integrity Validator
- [ ] Successfully extracts all 15 categories into the pre-refinement `ProtectedInventory`.
- [ ] Executes contextual LLM refinement preserving section context across chunk boundaries.
- [ ] `integrity-validator` evaluates revised text against the `ProtectedInventory` in total isolation from the LLM adapter.
- [ ] Accurately flags numerical, statistical, dosage, and citation discrepancies into `INFO`, `WARNING`, and `FAIL` severities.
- [ ] Blocks automated approval when any check receives a `FAIL` rating ("No Silent Approval" rule).
- [ ] Generates a comprehensive, structured `ValidationReport`.

### Phase 6: Dual-Panel Comparison Viewer & DOCX Export Engine
- [ ] Renders synchronized dual-panel viewer with paragraph-level lock-step scrolling.
- [ ] Displays word-level additions (green) and deletions (red strikeout) within modified paragraphs.
- [ ] Displays inline discrepancy badges with actionable "Revert to Original" triggers.
- [ ] Compiles refined text into a valid Microsoft Word (.docx) document matching journal submission formatting.
- [ ] Preserves all tables, figure captions, headers, footnotes, and bibliographic reference lists in the exported DOCX.
- [ ] Rejects generation if pre-download XML validation detects truncated or duplicated sections.

### Phase 7: End-to-End Hardening, Security Audits & Stress Testing
- [ ] SSRF security penetration suite passes 100% against mock attacker URLs.
- [ ] Prompt-injection test suite confirms system directives cannot be overridden by document text.
- [ ] Stress test confirms stable processing of 15-page manuscripts under simulated concurrent user load.
- [ ] 100% test pass rate for all unit and integration test suites.
- [ ] Zero ESLint errors, zero TypeScript errors in strict mode.

### Phase 8: Production Release, Telemetry & Documentation
- [ ] Production build (`npm run build`) completes with zero errors or unhandled warnings.
- [ ] Docker container build verified with non-root security context.
- [ ] All environment variables documented in `.env.example` with clear configuration guidance.
- [ ] Deployment runbooks and user operational manuals published.
