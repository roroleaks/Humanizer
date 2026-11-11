# Technology Stack & Tooling Rationale — Scientific Humanizer

---

## 1. Stack Overview & Architecture Matrix

| Layer | Selected Technology | Version | Rationale & Trade-off Analysis |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | 14.2.15 | Unified full-stack framework providing server-side API routes, streaming responses, and optimized client rendering without separate backend infrastructure. |
| **Language** | TypeScript (Strict) | 5.6.3 | Comprehensive type safety, compile-time contract enforcement, zero tolerance for untyped `any` in domain modules. |
| **Styling & Design** | Tailwind CSS | 3.4.14 | Rapid, utility-first styling with custom clinical and scientific tokens. Eliminates stylesheet bloat and guarantees responsive behavior. |
| **UI Components** | shadcn/ui + Radix Primitives | Latest | Accessible, headless primitives styled with custom tokens. Fully accessible (WAI-ARIA compliant), zero vendor lock-in. |
| **Icons** | Lucide React | 0.454.0 | Clean, lightweight, consistent icon set with minimal bundle footprint. |
| **DOCX Extraction** | Mammoth | 1.8.0 | Robust extraction of semantic document structure, headings, bold/italic markup, and tables without Word runtime dependencies. |
| **PDF Extraction** | unpdf / pdfjs-dist | Latest | Fast, lightweight server-side PDF text extraction and physical page count calculation without native binary dependencies. |
| **OCR Adapter** | Pluggable Adapter (Tesseract / Cloud) | Interface | Abstracts optical character recognition for scanned manuscripts; keeps core build lightweight. |
| **DOCX Generation** | `docx` (npm) | 8.5.0 | Complete programmatic control over Word XML structure, table layouts, margins, styles, and hierarchical headers. |
| **AI SDKs** | OpenAI, Google GenAI, Anthropic | Latest | Encapsulated in provider-agnostic adapters (`AIProviderAdapter`) to prevent vendor lock-in. |
| **Database** | PostgreSQL / Supabase | 15+ | Robust relational model for manuscripts, revisions, and protected inventories with Row-Level Security (RLS). |
| **File Storage** | Local Disk / S3 / Supabase Storage | Dynamic | Encrypted private file storage with strict retention policies and zero public access. |
| **Linting & Quality** | ESLint + Prettier | 8.57.1 | Strict linting with `next/core-web-vitals` enforcing code cleanliness and zero build warnings. |

---

## 2. Deep-Dive Technology Choices

### 2.1 Why Next.js 14 App Router?
- **Server Components & Streaming:** Refinement of long manuscripts (up to 15 pages) requires long-running operations. Next.js supports Server-Sent Events (SSE) and chunked transfer encoding directly to the client.
- **Server-Side API Security:** Next.js Route Handlers guarantee that AI API keys, file decoders, and database credentials remain strictly within server memory.
- **Zero-Friction Deployment:** Native compatibility with Vercel, Docker containers, and standard Node.js server environments.

### 2.2 Why Not Python for Parsing?
- Python tools (like PyMuPDF or python-docx) are common in data science, but introducing a dual-runtime (Node.js + Python) introduces Docker build overhead, cold-start latency, and deployment complexity.
- Modern TypeScript libraries (`mammoth`, `pdfjs-dist`, `docx`) achieve parity for scientific document parsing and generation while preserving a unified, single-language codebase.

### 2.3 Why `docx` (npm) for Word Generation?
- Academic journals and reviewers require genuine `.docx` files conforming to Microsoft Open XML specifications.
- The `docx` library allows granular manipulation of document styles, heading levels, paragraph spacing, header/footer elements, and table borders, ensuring publication-grade output matching author guidelines.

### 2.4 Why Multi-Provider AI Abstraction?
- Scientific institutions and corporate research labs maintain varying compliance restrictions regarding cloud AI providers (e.g., enterprise BAA with OpenAI vs. Google Cloud Vertex AI vs. Anthropic AWS Bedrock).
- A unified adapter interface (`AIProviderAdapter`) isolates the scientific prompt logic and chunking engine from provider-specific SDK idiosyncrasies.

---

## 3. Package Management & Environment Standard

- **Runtime:** Node.js v24.19.0 (LTS compatibility verified).
- **Package Manager:** npm v11.17.0.
- **Lockfile Strategy:** `package-lock.json` checked into source control to guarantee reproducible continuous integration builds.
- **Environment Isolation:** Zero reliance on global packages; all dependencies reside locally in `node_modules/`.
