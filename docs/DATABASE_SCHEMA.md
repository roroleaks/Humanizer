# Database Schema Specification — Scientific Humanizer

---

## 1. Overview & Relational Design

The Scientific Humanizer database schema is engineered for PostgreSQL (native Supabase support) with strict relational integrity, foreign key cascading, and Row-Level Security (RLS). The design cleanly models the manuscript intake, immutable protected inventory, chunk-level refinement artifacts, and validation reports.

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    MANUSCRIPTS ||--o{ DOCUMENT_SECTIONS : contains
    MANUSCRIPTS ||--o| PROTECTED_INVENTORIES : has
    PROTECTED_INVENTORIES ||--o{ PROTECTED_ITEMS : catalogs
    MANUSCRIPTS ||--o{ REFINEMENT_CHUNKS : generates
    MANUSCRIPTS ||--o{ VALIDATION_REPORTS : produces
    VALIDATION_REPORTS ||--o{ VALIDATION_CHECKS : evaluates
    VALIDATION_REPORTS ||--o{ DISCREPANCIES : flags
    PROTECTED_ITEMS ||--o{ DISCREPANCIES : referenced_by

    MANUSCRIPTS {
        uuid id PK
        uuid user_id
        text title
        text_array authors
        varchar status
        varchar source_type
        varchar original_file_path
        varchar revised_file_path
        integer page_count
        integer word_count_original
        integer word_count_revised
        varchar style_profile
        jsonb metadata
        timestamptz created_at
        timestamptz updated_at
    }

    DOCUMENT_SECTIONS {
        uuid id PK
        uuid manuscript_id FK
        uuid parent_id FK
        varchar section_type
        text title
        integer order_index
        text content
        integer char_start
        integer char_end
        timestamptz created_at
    }

    PROTECTED_INVENTORIES {
        uuid id PK
        uuid manuscript_id FK
        timestamptz created_at
    }

    PROTECTED_ITEMS {
        uuid id PK
        uuid inventory_id FK
        uuid manuscript_id FK
        varchar category
        text original_value
        uuid section_id FK
        integer paragraph_index
        integer char_start
        integer char_end
        text notes
    }

    REFINEMENT_CHUNKS {
        uuid id PK
        uuid manuscript_id FK
        uuid section_id FK
        integer chunk_index
        text original_text
        text refined_text
        varchar change_level
        varchar provider_used
        varchar model_used
        integer tokens_used
        timestamptz created_at
    }

    VALIDATION_REPORTS {
        uuid id PK
        uuid manuscript_id FK
        varchar status
        timestamptz generated_at
    }

    VALIDATION_CHECKS {
        uuid id PK
        uuid report_id FK
        varchar category
        varchar status
        text detail
    }

    DISCREPANCIES {
        uuid id PK
        uuid report_id FK
        uuid protected_item_id FK
        text original_value
        text revised_value
        varchar severity
        text reason
        uuid location_section_id FK
        boolean resolved_by_author
    }
```

---

## 3. Data Dictionary

### 3.1 `manuscripts` Table
Core record tracking manuscript ingestion, processing lifecycle, and file locations.
- `id` (UUID, Primary Key): Unique manuscript identifier.
- `user_id` (UUID, Nullable): Author/owner identifier for multi-tenant access control.
- `title` (TEXT): Title extracted from manuscript metadata or provided by user.
- `authors` (TEXT[]): Array of author names extracted from manuscript.
- `status` (VARCHAR(32)): Current lifecycle stage (`uploaded`, `parsed`, `inventory_extracted`, `profiled`, `refining`, `refined`, `validated`, `completed`, `failed`).
- `source_type` (VARCHAR(16)): Ingestion channel (`docx`, `pdf`, `url`, `text`).
- `original_file_path` (TEXT): Encrypted storage reference for original uploaded manuscript.
- `revised_file_path` (TEXT): Encrypted storage reference for compiled revised DOCX.
- `page_count` (INTEGER): Calculated manuscript page count.
- `word_count_original` (INTEGER): Word count of source manuscript.
- `word_count_revised` (INTEGER, Nullable): Word count of refined manuscript.
- `style_profile` (VARCHAR(32)): Selected academic genre profile (`original_research`, etc.).
- `metadata` (JSONB): Parsed document metadata (DOI, journal, OCR flags, extraction timestamp).
- `created_at` (TIMESTAMPTZ): Ingestion timestamp.
- `updated_at` (TIMESTAMPTZ): Last activity timestamp.

### 3.2 `document_sections` Table
Decomposed section nodes capturing hierarchical structure.
- `id` (UUID, Primary Key): Section identifier.
- `manuscript_id` (UUID, Foreign Key -> `manuscripts.id` ON DELETE CASCADE).
- `parent_id` (UUID, Foreign Key -> `document_sections.id`, Nullable): Hierarchical parent section.
- `section_type` (VARCHAR(32)): Classified section taxonomy (`introduction`, `methods`, `results`, `discussion`, etc.).
- `title` (TEXT): Section heading text.
- `order_index` (INTEGER): Sequence order within document.
- `content` (TEXT): Text content of section.
- `char_start` / `char_end` (INTEGER): Character coordinate bounds within raw document.

### 3.3 `protected_inventories` & `protected_items` Tables
Immutable pre-refinement baseline of protected scientific items.
- `inventory_id` (UUID, Foreign Key -> `protected_inventories.id` ON DELETE CASCADE).
- `category` (VARCHAR(32)): One of the 15 protected categories (`statistical_result`, `drug_dosage`, `numerical_data`, etc.).
- `original_value` (TEXT): Exact verbatim text or numerical expression extracted.
- `location`: Paragraph and character coordinates.
- `notes` (TEXT, Nullable): Contextual classification notes.

### 3.4 `validation_reports` & `discrepancies` Tables
Audit reports verifying revised text against the protected inventory.
- `report_id` (UUID, Primary Key).
- `status` (VARCHAR(16)): `PASS`, `WARNING`, or `FAIL`.
- `severity` (VARCHAR(16)): Discrepancy severity classification (`INFO`, `WARNING`, `FAIL`).
- `reason` (TEXT): Mechanistic explanation of detected divergence.
- `resolved_by_author` (BOOLEAN): Explicit author review flag (defaults to `false`).

---

## 4. Privacy, Retention & Deletion Architecture

1. **Configurable Retention Windows:** Managed by `SH_STORAGE_RETENTION_DAYS` (default: 30 days). A daily scheduled routine automatically purges records and file blobs older than the retention threshold.
2. **Author-Controlled Hard Purge:** When a user initiates document deletion, an atomic database cascade deletes all associated records from `manuscripts`, `document_sections`, `protected_inventories`, `protected_items`, `refinement_chunks`, and `validation_reports`, followed by immediate unlinking of physical storage blobs.
3. **Audit Trail Anonymization:** System logs store operation status, timestamps, and token volumes only. Manuscript content and author text are strictly excluded from logging tables.
