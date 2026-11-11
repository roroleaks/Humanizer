# UI/UX Design System Specification — Scientific Humanizer

---

## 1. Design Philosophy & Academic Aesthetic

Scientific Humanizer is built for high-stakes academic and clinical environments. Its interface must project **quiet authority, scientific precision, and cognitive clarity**.

### 1.1 Aesthetic Principles
- **Clinical Seriousness:** Avoid consumer chatbot tropes, playful gradients, neon accents, and cartoon illustrations.
- **Deep Navy & Clinical White Palette:** Communicates institutional trustworthiness, academic rigor, and clean clinical workspace standards.
- **Information Density with Generous Whitespace:** Balances comprehensive data display (statistics, P-values, word counts) with ample breathing room to prevent cognitive fatigue during manuscript review.
- **Subdued, Purpose-Driven Motion:** Animations are restricted to functional feedback (state transitions, drawer slides, accordion expansions); purely decorative motion is prohibited.

---

## 2. Color System & Design Tokens

```
┌────────────────────────────────────────────────────────────────────────┐
│                        COLOR TOKEN PALETTE                             │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ Token Name        │ Hex Code          │ UI Semantic Application        │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ `navyDark`        │ `#061323`         │ Top navigation bar, root shell │
│ `navyPrimary`     │ `#0B2545`         │ Primary headers, brand surfaces│
│ `tealPrimary`     │ `#13818B`         │ Primary buttons, active tabs   │
│ `tealHover`       │ `#0E636A`         │ Interactive hover states       │
│ `pureWhite`       │ `#FFFFFF`         │ Reading canvas, card surfaces  │
│ `clinicalBackdrop`│ `#F8FAFC`         │ Background canvas, neutral area│
│ `borderSubtle`    │ `#E2E8F0`         │ Card dividers, panel borders   │
│ `textPrimary`     │ `#0F172A`         │ Body text, headings, citations │
│ `textMuted`       │ `#6B7280`         │ Captions, metadata, subtitles  │
│ `integrityPass`   │ `#2E7D32`         │ Verified integrity status only │
│ `integrityWarning`│ `#ED6C02`         │ Review required banner/badge   │
│ `integrityFail`   │ `#D32F2F`         │ Detected discrepancy alert     │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 3. Typography & Hierarchy

- **Body & Headings:** `Inter` or `Source Sans 3` (clean geometric sans-serif offering high legibility across small statistical notations and parenthetical citations).
- **Monospace & Code:** `JetBrains Mono` (used for P-values, confidence intervals, raw XML snippets, and character coordinate displays).

| Level | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 2.25rem (36px) | Bold (700) | 1.25 | Landing hero, dashboard titles |
| **Heading 1** | 1.875rem (30px) | SemiBold (600) | 1.3 | Main view headers, document title |
| **Heading 2** | 1.5rem (24px) | SemiBold (600) | 1.35 | Section headings (Abstract, Methods) |
| **Heading 3** | 1.125rem (18px) | Medium (500) | 1.4 | Card headers, subsection titles |
| **Body Large** | 1.0rem (16px) | Regular (400) | 1.65 | Primary manuscript reading canvas |
| **Body Small** | 0.875rem (14px) | Regular (400) | 1.5 | Metadata labels, drawer contents |
| **Caption** | 0.75rem (12px) | Medium (500) | 1.4 | Badges, coordinates, timestamps |

---

## 4. Application Route Structure (Planned for Phase 1)

```
scientific-humanizer/
├── /                     # Dashboard: active drafts, recent validations, platform stats
├── /new                  # Intake Flow: file dropzone, URL fetcher, profile selector
├── /manuscripts          # Repository: filterable workspace library of manuscripts
├── /manuscripts/[id]     # Dual-Panel Review: synchronized diff, validation report
├── /history              # Processing History: auditable timeline of completed jobs
├── /providers            # AI Infrastructure: latency benchmarks, key status, health
├── /settings             # Preferences: retention policies, default style profile
└── /help                 # Academic Guide: integrity rules, citation standards
```

---

## 5. Dual-Panel Comparison Interface (Phase 6 Architecture)

The flagship interface of the platform is the **Dual-Panel Synchronized Manuscript Viewer**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [← Back]  Manuscript: "Efficacy of SGLT2 Inhibitors"   [Export DOCX ▼]     │
│ Status: VALIDATED (3 Warnings, 0 Failures)   Style Profile: original_research│
├─────────────────────────────────────┬──────────────────────────────────────┤
│ ORIGINAL MANUSCRIPT (Left Panel)     │ REVISED MANUSCRIPT (Right Panel)     │
├─────────────────────────────────────┼──────────────────────────────────────┤
│ SECTION: Introduction               │ SECTION: Introduction                │
│ Paragraph 1:                        │ Paragraph 1:                         │
│ In recent years, numerous clinical  │ Over the past decade, extensive      │
│ trials have demonstrated that SGLT2 │ clinical investigations have         │
│ inhibitors produce remarkable cardio│ established that SGLT2 inhibitors    │
│ vascular benefits in patients with  │ confer substantial cardioprotective  │
│ type 2 diabetes [1, 2].             │ effects in type 2 diabetes [1, 2].   │
│                                     │                                      │
│                                     │ [Change: Minor] [Preserved: [1,2]]   │
│ ─────────────────────────────────── │ ──────────────────────────────────── │
│ SECTION: Results                    │ SECTION: Results                     │
│ Paragraph 4:                        │ Paragraph 4:                         │
│ The primary outcome occurred in     │ The primary composite endpoint was   │
│ 142 of 2,100 patients (6.8%) in the │ observed in 142 of 2,100 patients    │
│ treatment cohort compared to 210 of │ (6.8%) in the intervention cohort    │
│ 2,098 (10.0%) in the placebo arm    │ versus 210 of 2,098 (10.0%) in the   │
│ (HR 0.67; 95% CI: 0.54-0.82;        │ control group (HR 0.67; 95% CI:      │
│ p < 0.001).                         │ 0.54-0.82; p < 0.001).               │
│                                     │                                      │
│                                     │ [Change: Minor]                      │
│                                     │ [✔ All Statistics 100% Verified]     │
└─────────────────────────────────────┴──────────────────────────────────────┘
```

### 5.1 Diff Interaction Mechanics
- **Scroll Synchronization:** Lock-step bidirectional scrolling ensures that when an author scrolls either panel, the corresponding paragraphs remain strictly aligned.
- **Micro-Diff Visualization:** Within modified paragraphs, deletions are shown in subdued red strikeout, while insertions are rendered in subtle green highlights.
- **Inline Discrepancy Anchors:** Any paragraph containing a `WARNING` or `FAIL` discrepancy is highlighted with an interactive amber/red callout detailing the exact reason and providing a single-click `"Revert to Original"` action.
