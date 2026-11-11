# System Architecture — Scientific Humanizer

---

## 1. Architectural Philosophy & Principles

Scientific Humanizer is built upon a **Domain-Driven, Decoupled Adapter Architecture**. It enforces strict isolation between document parsing, refinement, and integrity verification to ensure reproducible, auditable, and academically trustworthy outcomes.

Key architectural imperatives:
- **Zero Client-Side Credential Exposure:** All AI integrations, database queries, and file parsers execute exclusively on the server side.
- **Contract-First Design:** Domain models and interaction protocols are declared in `src/contracts/` as pure TypeScript definitions before module implementation.
- **Strict Module Boundaries:** Circular dependencies are forbidden. Cross-module communications flow through defined interfaces.
- **Independent Validation Isolation:** The `integrity-validator` module is architecturally isolated from the `refinement-engine`. It evaluates revised output against an immutable baseline without dependency on the prompt or model that produced the revision.

---

## 2. High-Level Architectural Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                 │
│  Next.js App Router (React 18) • Tailwind CSS • Design Tokens • shadcn   │
│  - Dual-Panel Comparison Viewer  - Intake Dropzone (DOCX, PDF, URL, Text) │
│  - Validation Report Inspector   - Style Profile Selector                 │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │ HTTPS / JSON / SSE
┌─────────────────────────────────────▼────────────────────────────────────┐
│                       SERVER-SIDE API ROUTE HANDLERS                      │
│  /api/manuscripts  •  /api/refine  •  /api/validate  •  /api/export      │
└──────────┬──────────────────────────┬──────────────────────────┬─────────┘
           │                          │                          │
┌──────────▼──────────┐    ┌──────────▼──────────┐    ┌──────────▼─────────┐
│   DOCUMENT PARSER   │    │  WRITING PROFILER   │    │ REFINEMENT ENGINE  │
│  - Mammoth DOCX     │    │  - Cadence Analyzer │    │ - Section Chunking │
│  - unpdf / PDF.js   │    │  - Formulaic Traces │    │ - Context Builder  │
│  - SSRF URL Fetcher │    │  - Lexical Density  │    │ - Style Injector   │
│  - OCR Detector     │    │  - Transition Check │    │                    │
└──────────┬──────────┘    └──────────┬──────────┘    └──────────┬─────────┘
           │                          │                          │
           │                          └────────────┬─────────────┘
           │                                       │
┌──────────▼───────────────────────────────────────▼───────────────────────┐
│                       AI ORCHESTRATOR SUBSYSTEM                          │
│  - Unified AIProviderAdapter Interface                                   │
│  - Providers: OpenAI (GPT-4o), Gemini (1.5 Pro), Anthropic (Claude 3.5)  │
│  - Health Telemetry, Retries, Exponential Backoff, Fallback Chains       │
│  - Content-Sanitized Logging                                             │
└─────────────────────────────────────┬────────────────────────────────────┘
                                      │ Refined Text Stream
┌─────────────────────────────────────▼────────────────────────────────────┐
│                    SCIENTIFIC INTEGRITY VALIDATOR                        │
│  - Pre-Refinement ProtectedInventory (15 Categories)                     │
│  - Deterministic Discrepancy Engine (INFO / WARNING / FAIL)              │
│  - Strict "No Silent Approval" Policy                                    │
└──────────┬─────────────────────────────────────────────────────┬─────────┘
           │                                                     │
┌──────────▼──────────┐                               ┌──────────▼─────────┐
│    DOCX GENERATOR   │                               │ PERSISTENCE LAYER  │
│  - docx npm package │                               │ - PostgreSQL / RLS │
│  - Heading Hierarchy│                               │ - Encrypted Files  │
│  - Captions/Tables  │                               │ - Session States   │
└─────────────────────┘                               └────────────────────┘
```

---

## 3. End-to-End Processing Pipeline

The manuscript lifecycle executes in seven deterministic, auditable stages:

```
[1. Intake & Ingestion]
        │ DOCX, PDF, URL, Text (Checked against 15-page limit)
        ▼
[2. Section Decomposition]
        │ Decomposes into DocumentSection tree (Title, Abstract, Methods, etc.)
        ▼
[3. Protected Inventory Extraction]
        │ Extracts clinical outcomes, numbers, statistics, dosages, citations
        │ Stores as immutable baseline: ProtectedInventory
        ▼
[4. Writing Style Profiling]
        │ Evaluates rhythm, sentence length variation, and formulaic patterns
        ▼
[5. Contextual Chunk Refinement]
        │ Dispatches chunks to AI Orchestrator with section context
        │ Receives refined paragraphs with change flags
        ▼
[6. Scientific Integrity Verification]
        │ Independent validation of revised paragraphs against ProtectedInventory
        │ Generates structured ValidationReport with severity ratings
        ▼
[7. Diff Assembly & DOCX Export]
        │ Aligns original and revised text for side-by-side comparison
        │ Compiles final validated DOCX package with preserved styles
```

---

## 4. Module Boundary Specification

To prevent coupling and enforce single-responsibility boundaries, the system defines explicit import allowances and restrictions:

| Module | Allowed Imports | Strictly Forbidden Imports | Rationale |
| :--- | :--- | :--- | :--- |
| `document-parser` | `src/contracts/`, `src/lib/` | All other domain modules | Pure ingestion; must not depend on rewriting or validation logic. |
| `writing-profiler` | `src/contracts/`, `src/lib/`, `document-parser` (read-only) | `refinement-engine`, `integrity-validator`, `ai-orchestrator` | Profiling only evaluates structural metrics; cannot trigger AI execution. |
| `refinement-engine` | `src/contracts/`, `src/lib/`, `ai-orchestrator`, `document-parser` (read-only) | `integrity-validator`, `docx-generator` | Refinement must not be coupled to the validation engine or document rendering. |
| `integrity-validator` | `src/contracts/`, `src/lib/`, `document-parser` (read-only) | `refinement-engine`, `ai-orchestrator`, `docx-generator` | **Core Integrity Principle:** Validation must remain fully independent from the revision generator to eliminate confirmation bias. |
| `docx-generator` | `src/contracts/`, `src/lib/`, `document-parser` (read-only) | All other modules except `src/contracts/` | Pure document synthesis; must only read final verified data models. |
| `ai-orchestrator` | `src/contracts/`, `src/lib/` | All domain modules | Infrastructure utility managing LLM connections, retries, and telemetry. |

---

## 5. Failure Modes & Resilience Architecture

1. **AI Provider Outage or Degradation:**
   - The AI Orchestrator monitors provider health via ping latencies and error rates.
   - If the primary provider (`SH_AI_PRIMARY_PROVIDER`) fails or times out (default 60,000 ms), the system automatically attempts configured fallback providers (`SH_AI_FALLBACK_PROVIDERS`).
   - Every provider switch is recorded and explicitly communicated to the user for transparent consent.

2. **Integrity Validation Failures (`FAIL` Severity):**
   - If a numerical value, dosage, or clinical conclusion is modified without author authorization, the manuscript cannot be automatically exported as "Approved".
   - The UI displays persistent integrity warning banners directing the user to the exact paragraph coordinates.

3. **Malformed or Unsafe Intake Content:**
   - File uploads are validated by magic byte signatures and strict MIME typing.
   - Web URLs are scrutinized against RFC 1918 private IP ranges, loopbacks, and cloud metadata endpoints to prevent Server-Side Request Forgery (SSRF).
