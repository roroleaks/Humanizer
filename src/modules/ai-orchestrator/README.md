# AI Orchestrator Module

## Responsibility
Responsible for multi-provider LLM abstraction and execution:
- Providing unified adapter contracts for OpenAI, Google Gemini, Anthropic Claude, and OpenAI-compatible endpoints.
- Server-side credential management (strictly preventing client-side key exposure).
- Fallback orchestration and automatic retry mechanisms on transient provider failures.
- Health monitoring and latency telemetry.
- Strict data privacy enforcement: sanitizing logs to prevent manuscript text leakage and respecting user provider disclosures.

## Public Interface
- `orchestrateRefinementStub(request: RefinementRequest): Promise<RefinementResponse>`: Phase 0 typed stub. Real provider adapter integration will be implemented in Phase 3.

## Boundary Rules
- **May import from:** `src/contracts/`, `src/lib/`
- **FORBIDDEN to import from:** All domain modules (`document-parser`, `writing-profiler`, `refinement-engine`, `integrity-validator`, `docx-generator`).
