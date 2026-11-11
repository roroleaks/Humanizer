# Document Processing Architecture — Scientific Humanizer

---

## 1. Multi-Channel Intake Overview

Scientific manuscripts arrive in varied formats. The Document Processing subsystem standardizes these inputs into a uniform, typed structural representation (`ParsedDocument`) while enforcing strict size boundaries, security checks, and page constraints.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FOUR INTAKE CHANNELS                            │
├───────────────┬─────────────────┬──────────────────┬───────────────────┤
│ 1. Word DOCX  │ 2. PDF Document │ 3. Public URL    │ 4. Pasted Text    │
│ (Mammoth / XML│ (unpdf / PDF.js)│ (SSRF-Guarded)   │ (Plain / Markdown)│
└───────┬───────┴────────┬────────┴────────┬─────────┴─────────┬─────────┘
        │                │                 │                   │
        ▼                ▼                 ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     VALIDATION & SECURITY GATEWAY                      │
│ - MIME type verification & Magic Byte validation                       │
│ - SSRF IP filtering (Reject 127.0.0.1, 10.0.0.0/8, 169.254.169.254)   │
│ - Page-count limit enforcement (Max 15 pages)                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     SECTION DECOMPOSITION ENGINE                       │
│ - Classify headings (Title, Abstract, Methods, Results, Discussion)   │
│ - Map hierarchical subheadings (H1, H2, H3)                            │
│ - Compute character & paragraph coordinates (DocumentLocation)         │
│ - OCR Requirement Detection for image-based PDFs                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
                 Standardized ParsedDocument Model
```

---

## 2. Ingestion Channel Specifications

### 2.1 Microsoft Word (.docx)
- **Extraction Library:** `mammoth` (HTML/Markdown extraction) coupled with OpenXML parsing.
- **Structural Retention:** Retains bold/italics, subscript/superscript (essential for chemical formulas and isotope markers like $^{14}\text{C}$ or $\text{H}_2\text{O}$), table structures, figure captions, and in-text citation markers.
- **Page Count Determination:** Checks OpenXML app properties (`docProps/app.xml` `<Pages>`). If unavailable, calculates word count divided by `SH_PAGE_WORD_DENSITY` and flags as `estimated`.

### 2.2 Portable Document Format (.pdf)
- **Extraction Library:** `unpdf` and `pdfjs-dist` (pure JavaScript, server-side Node execution without external binaries).
- **Physical Page Calculation:** Evaluates exact physical page count (`pdfDoc.numPages`).
- **Scanned PDF & OCR Detection:** Calculates the text-density ratio per page (characters per square inch). If average extracted characters per page is below 150, the document is classified as a scanned raster image requiring OCR.
- **Pluggable OCR Interface:** Surfaces an actionable notification prompting the user to enable OCR preprocessing via cloud OCR or local Tesseract adapter.

### 2.3 Public URL Retrieval & SSRF Mitigation
Researchers frequently link to preprints (e.g., bioRxiv, medRxiv, arXiv) or open-access journal articles.
- **SSRF Defense Rules:**
  - Enforces HTTP/HTTPS protocols only.
  - Resolves domain DNS prior to connection and validates IP against blacklisted private ranges:
    * Loopback: `127.0.0.0/8`, `::1`
    * Private Networks: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
    * Link-Local & Cloud Metadata: `169.254.169.254`, `fe80::/10`
  - Validates HTTP redirects; terminates connection if a redirect points to a restricted IP.
- **Content Sanitization:** Strips navigation menus, header/footer boilerplate, and advertisement tracking scripts, preserving the scientific article body.

### 2.4 Direct Text Paste
- Accepts formatted markdown or raw text.
- Paragraph boundaries detected via double-linebreaks.
- Page count estimated via `SH_PAGE_WORD_DENSITY`.

---

## 3. The 15-Page Capacity Rule & Calculation Engine

To maintain high refinement precision and avoid token exhaustion, manuscripts are strictly capped at **15 pages**.

| Intake Modality | Page Count Metric | Confidence Rating |
| :--- | :--- | :--- |
| **PDF** | Physical page count (`numPages`) | `verified` |
| **DOCX** | `docProps/app.xml` page count | `verified` (if present) / `estimated` |
| **URL Article** | Word Count / `SH_PAGE_WORD_DENSITY` (500 words) | `estimated` |
| **Pasted Text** | Word Count / `SH_PAGE_WORD_DENSITY` (500 words) | `estimated` |

### 3.1 Enforcement Actions
- **Page Count <= 15:** Manuscript is accepted for processing. UI displays verified or estimated count badge.
- **Page Count > 15:** Processing is halted at intake. The user receives a clear explanation stating the detected page count and requesting that the manuscript be divided into sections or trimmed before submission.

---

## 4. Section Decomposition & Non-IMRAD Structures

While biomedical research typically uses IMRAD (Introduction, Methods, Results, and Discussion), the parser must never assume this rigid layout. It supports:
- **Systematic Reviews & Meta-Analyses:** PRISMA structures, Search Strategy, Study Selection, Risk of Bias Assessment.
- **Clinical Case Reports:** Patient History, Clinical Presentation, Diagnostic Assessment, Therapeutic Interventions, Follow-up.
- **Review Articles:** Thematic headings, Historical Perspective, Mechanistic Overviews.
- **Brief Communications & Letters:** Unstructured single-body manuscripts.

Each parsed section is assigned:
- A unique `id` (UUID).
- A normalized `DocumentSectionType`.
- Sequential `order` index.
- Precise `DocumentLocation` (section ID, paragraph index, character start, and character end).
- Hierarchy tracking (`children` array for nested subheadings).
