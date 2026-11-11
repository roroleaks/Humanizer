# Antigravity State — Phase 3

## Phase
3 — Multi-Provider AI Orchestration Engine

## Status
COMPLETE

## Phase 2 Open Decisions — Resolved in Phase 3
1. **API Key Management:** Decoupled credential source architecture implemented via `CredentialSource` interface (`credential-source.ts`). Server-side environment variables (`EnvVarCredentialSource`) provide credentials in Phase 3. A typed stub interface (`byok-credential-source.ts`) is established for Phase 9 without runtime entanglement. Missing credentials immediately trigger typed `MissingCredentialError` and set `ProviderHealth.status = 'unavailable'` without performing network calls.
2. **Two-Tier Streaming Failover Thresholds:** 
   - `SH_AI_TTFB_TIMEOUT_MS` (15,000 ms default): Time-to-first-token silence ceiling. Stalled initial responses trigger immediate failover to the next provider in the orchestration chain.
   - `SH_AI_INTERCHUNK_TIMEOUT_MS` (10,000 ms default): Inter-chunk silence ceiling. Mid-stream pauses exceeding 10 seconds abort the stalled stream and cascade to fallback.
   - Hard request timeout maintained at `SH_AI_TIMEOUT_MS` (60,000 ms default).
   - Variables added to `.env.example`.

## Architecture & Implementation Summary

### 1. Unified Provider Adapters (`src/modules/ai-orchestrator/adapters/`)
All four adapters implement `StreamingAIProviderAdapter` with native or simulated streaming, 60-second health caching, error translation, and custom User-Agent headers (`ScientificHumanizer/0.1`):
- `OpenAIAdapter`: Uses official `openai` SDK, native streaming (`stream: true`), `models.list()` health probe.
- `AnthropicAdapter`: Uses official `@anthropic-ai/sdk`, native streaming (`stream: true`), 1-token synthetic probe.
- `GeminiAdapter`: Uses official `@google/generative-ai`, native streaming (`generateContentStream`), 1-token synthetic probe.
- `OpenAICompatibleAdapter`: Uses `openai` SDK targeted at `SH_AI_OPENAI_COMPATIBLE_BASE_URL` with native/simulated streaming fallback.

### 2. Resilience, Retry & Circuit Breaker Engine
- **Typed Error Hierarchy:** `ProviderError`, `RateLimitError` (with `retryAfterMs`), `AuthenticationError`, `TimeoutError`, `ProviderUnavailableError`, `MissingCredentialError`, `OrchestrationError`.
- **Retry Policy (`retry-policy.ts`):** `ExponentialBackoffWithJitterPolicy` implementing base 500ms delay, factor 2, ±25% jitter, honoring explicit `retryAfterMs` headers. Fresh retry budget allocated on failover.
- **Circuit Breaker (`circuit-breaker.ts`):** `InMemoryCircuitBreaker` tracking per-provider states (`CLOSED`, `OPEN`, `HALF_OPEN`). Opens after 5 failures in 60s; transitions to `HALF_OPEN` after 60s open duration; closes on first probe success.
- **Health Monitor (`health-monitor.ts`):** Periodic 60s background probe, in-memory cache, manual refresh handler, 5-second initial boot delay.

### 3. Orchestration Engine (`orchestrator.ts`)
- Manages cascade from `SH_AI_PRIMARY_PROVIDER` to `SH_AI_FALLBACK_PROVIDERS`.
- Skips OPEN circuits automatically.
- Enforces two-tier streaming timeouts (`ttfbTimeoutMs`, `interChunkTimeoutMs`).
- Discloses the actual provider serving the request in the initial streaming chunk (`providerName`, `modelUsed`).
- Sends identical, unmutated `RefinementRequest` (context, instructions, text, protected inventory) upon failover.
- Strictly logs zero manuscript content or request bodies in operational events.

### 4. API Routes & UI Telemetry
- `GET /api/providers`: Returns active provider metadata, configured status, health cache, circuit state, and orchestration hierarchy.
- `POST /api/providers/health-check`: Triggers immediate background probe refresh, rate-limited to 1 req / 10s per IP.
- `/providers` Page: Real-time telemetry dashboard showing health dots, latency metrics, circuit states, and manual refresh button. Removed Phase 1 `FeatureStatus` badge.
- `/settings` Page: Added read-only "AI Provider Credentials" section detailing environment-managed status.
- `/help` Page: Updated `#privacy` section detailing 4 supported enterprise providers, zero-training agreements, and transparent failover disclosure.

## Verification Suite Results
- **Automated Verification (`tests/verify-phase3.ts`):** 35 PASSED, 0 FAILED
  - Exponential backoff with jitter (500/1000/2000 ms): PASS
  - RateLimitError `retryAfterMs` override: PASS
  - Circuit breaker state transitions (CLOSED -> OPEN -> HALF_OPEN -> CLOSED & OPEN): PASS
  - Health monitor cache hits and refresh: PASS
  - Primary success and disclosure: PASS
  - Retry on transient error (3 attempts): PASS
  - Failover cascade with actual provider disclosure: PASS
  - All-providers-fail `OrchestrationError` without content leakage: PASS
  - Native streaming chunk emission: PASS
  - Two-tier TTFB timeout failover: PASS
  - Missing credential error handling: PASS
  - Provider integration tests skipped gracefully when keys absent: PASS
- **Type Checking (`npm run type-check`):** PASS (0 errors)
- **Linting (`npm run lint`):** PASS (0 warnings, 0 errors)
- **Production Build (`npm run build`):** PASS (10 static pages, 8 dynamic routes)

## Strict Commitments Maintained (Forbidden Actions Checked)
- [x] NO real manuscript refinement executed (Phase 4).
- [x] NO prompt templates or chunking algorithms implemented (Phase 4).
- [x] NO protected inventory building executed (Phase 5).
- [x] NO comparison, diff, or DOCX generation executed (Phase 6).
- [x] NO manuscript content or prompt text logged in operational telemetry.
- [x] NO API keys hardcoded anywhere in the codebase.
- [x] Synthetic test payloads strictly used and clearly labeled.
- [x] User-Agent `ScientificHumanizer/0.1` applied to outbound calls.

## Open Questions for Phase 4 (Scientific Refinement Engine)
1. **Section-Specific Chunking Strategy:** For long sections (e.g. Results > 1,500 words), should chunking split strictly by paragraph boundaries or by thematic subsections (e.g., table reference blocks)?
2. **Refinement Intensity Level:** Should the refinement engine offer author-selectable intensity levels (e.g., "Conservative Editorial Polish" vs. "High-Impact Natural Fluency") in the UI configuration panel?
