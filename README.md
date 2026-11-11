# Humanizer

**Scientific Humanizer – Premium Academic Writing Intelligence Platform**

A full‑stack, TypeScript‑first application that provides deterministic, chunk‑based manuscript refinement with AI‑provider failover, consent handling, and a rich UI for configuration and live progress monitoring.

---

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [API Reference](#api-reference)
8. [UI Overview](#ui-overview)
9. [Testing](#testing)
10. [Contributing](#contributing)
11. [License](#license)

---

## Overview

Humanizer implements **Phase 4** of the Scientific Humanizer roadmap. It takes a scientific manuscript, asks the user for consent, lets the user configure style and intensity, then streams refined text from a selectable LLM provider while preserving numbers, protected inventory items, and providing real‑time flags.

The system is built with **Next.js 14**, **TypeScript**, **Drizzle ORM** (SQLite), and a modular **AI Orchestrator** that supports OpenAI, Anthropic, Gemini, and OpenAI‑compatible adapters.

---

## Features
- **Two‑pass deterministic semantic chunking** (`src/modules/refinement-engine/chunker.ts`).
- **Adjacency summarizer** for cross‑chunk context (`adjacent-summarizer.ts`).
- **Prompt builder** combines base template, style profiles, intensity pre‑ambles, protected‑inventory pre‑amble, and optional injection (`prompt-builder.ts`).
- **Number guard** that protects numerical values from accidental alteration.
- **Flag detector** for ambiguous meaning, unsupported claims, style deviation, and protected‑item touches.
- **Streaming refinement engine** with provider failover, timeout handling, and SSE UI integration.
- **Consent modal** enforcing privacy before any manuscript data leaves the server.
- **Configuration drawer** (style, intensity, primary provider). 
- **Progress view** showing per‑chunk events, provider name, model, and cancel button.
- **Results view** with flags panel and disabled Phase 5/6 controls.
- **Refinement status badges** on manuscript list view.
- **SQLite schema** for jobs, chunks, and consent timestamps (`drizzle/schema`).

---

## Prerequisites
- **Node.js 20+**
- **pnpm** (or npm, but pnpm is recommended)
- **SQLite3** (bundled with `better-sqlite3`)
- API keys for at least one AI provider (OpenAI, Anthropic, or Gemini) if you want to run real refinements. Without keys the consent modal will block refinement gracefully.

---

## Installation
```bash
# Clone the repository (once you have pushed it to GitHub)
 git clone https://github.com/<YOUR_USERNAME>/Humanizer.git
 cd Humanizer

# Install dependencies
 pnpm install   # or `npm ci`
```

---

## Configuration
Create a `.env.local` (or copy `.env.example`) and set the required variables:
```dotenv
# AI provider keys – optional but required for real streaming
SH_AI_OPENAI_API_KEY=YOUR_OPENAI_KEY
SH_AI_GEMINI_API_KEY=YOUR_GEMINI_KEY
SH_AI_ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY
SH_AI_OPENAI_COMPATIBLE_API_KEY=YOUR_COMPATIBLE_KEY
SH_AI_OPENAI_COMPATIBLE_BASE_URL=https://your-compatible-endpoint.com/v1

# Orchestrator tuning (optional)
SH_AI_PRIMARY_PROVIDER=openai
SH_AI_FALLBACK_PROVIDERS=gemini,anthropic
SH_AI_TTFB_TIMEOUT_MS=15000
SH_AI_INTERCHUNK_TIMEOUT_MS=10000
SH_AI_TIMEOUT_MS=60000
```

---

## Running the Application
```bash
# Development server with hot reload
 pnpm dev   # or `npm run dev`

# Production build
 pnpm build && pnpm start
```
The app will be reachable at `http://localhost:3000`.

---

## API Reference
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/manuscripts/:id/consent` | Record user consent before refinement. |
| `POST` | `/api/manuscripts/:id/refine` | Plan a refinement job (style, intensity, provider). |
| `GET`  | `/api/manuscripts/:id/refine/status` | Retrieve `RefinementJobStatus`. |
| `GET`  | `/api/manuscripts/:id/refine/stream` | Server‑Sent Events stream of `RefinementProgressEvent`. |
| `GET`  | `/api/manuscripts/:id/refine/results` | Final `RefinementResult` after completion. |
| `GET`  | `/api/manuscripts/:id` | Get manuscript metadata (including `refinementConsentAt`). |

---

## UI Overview
- **Manuscripts list** – shows each manuscript with a refinement status badge (Pending, Refining, Completed, Failed).
- **Manuscript detail page** – consent modal appears if consent not yet recorded; otherwise the **Refinement Config Drawer** (style, intensity, provider) is available.
- **Refinement progress view** – live streaming text, per‑chunk progress bars, provider/model labels, and a cancel button.
- **Results view** – displays refined manuscript, flags panel, and disabled Phase 5/6 actions.

---

## Testing
```bash
# Lint & type‑check
 pnpm lint && pnpm type-check

# Unit tests (Jest/TS)
 pnpm test

# End‑to‑end test (uses a synthetic streaming adapter if no provider keys are set)
 npx tsx tests/test-refinement-e2e.ts
```
All tests should pass without external credentials.

---

## Contributing
Contributions are welcome! Please open an issue or PR. Follow the existing coding conventions (strict TypeScript, ESLint, no unused imports). When adding new AI adapters, respect the `CredentialSource` abstraction and register adapters only when credentials are present.

---

## License
MIT License – see `LICENSE` file.

---

*Generated from the Phase 4 implementation of the Scientific Humanizer.*