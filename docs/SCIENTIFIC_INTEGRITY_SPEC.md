# Scientific Integrity Specification — Scientific Humanizer

---

## 1. Core Mandate: Inviolable Research Integrity

The foundational premise of Scientific Humanizer is that **stylistic enhancement must never compromise scientific accuracy**. In clinical medicine, pharmacotherapy, and empirical sciences, minor textual perturbations can introduce catastrophic factual distortions. For instance:
- Changing `"0.05 mg"` to `"0.5 mg"` represents a tenfold dosage overdose.
- Altering `"p = 0.048"` to `"p > 0.05"` inverts statistical significance.
- Modifying `"associated with increased risk"` to `"causes increased risk"` transforms an observational correlation into an unproven causal assertion.
- Altering or omitting a citation breaks academic attribution and introduces plagiarism liabilities.

To eliminate these risks, the platform implements a deterministic two-phase integrity system:
1. **Pre-Refinement:** Compiles an immutable **Protected Inventory**.
2. **Post-Refinement:** Executes categorical discrepancy verification and enforces a strict **"No Silent Approval"** policy.

---

## 2. The 15 Protected Inventory Categories

Prior to dispatching any text to an AI provider adapter, the parser extracts and catalogs all sensitive entities into a `ProtectedInventory`:

| Item Category | Category Identifier | Scope & Extraction Examples |
| :--- | :--- | :--- |
| **A. Scientific Terminology** | `scientific_terminology` | IUPAC names, genetic loci (e.g., *BRCA1*, *EGFR* L858R), cellular receptors, taxonomic nomenclature (*Staphylococcus aureus*). |
| **B. Medical Terminology** | `medical_terminology` | ICD-10 diagnostic entities, surgical procedures (e.g., laparoscopy, percutaneous coronary intervention), pathology descriptors. |
| **C. Drug Names** | `drug_name` | Non-proprietary generic names (e.g., metformin, pembrolizumab, ramipril). |
| **D. Drug Dosages** | `drug_dosage` | Dosages, administration routes, and schedules (e.g., 500 mg BID, 10 mg/kg IV every 3 weeks). |
| **E. Numerical Data** | `numerical_data` | Cohort sizes ($N = 1,420$), percentages (42.8%), physical measurements (120/80 mmHg, 37.2 °C), laboratory units (mg/dL, mmol/L). |
| **F. Statistical Results** | `statistical_result` | P-values ($p < 0.001$), 95% Confidence Intervals (95% CI: 1.12–1.85), Hazard Ratios (HR 0.68), Odds Ratios, Relative Risks ($RR$). |
| **G. Study Design** | `study_design` | Methodological descriptors: randomized controlled trial, double-blind, retrospective cohort, crossover study. |
| **H. Research Population** | `research_population` | Inclusion/exclusion parameters, demographic distributions, age brackets (e.g., adults aged 18–65). |
| **I. Clinical Outcomes** | `clinical_outcome` | Primary/secondary endpoints, overall survival (OS), progression-free survival (PFS), adverse events, mortality rates. |
| **J. In-Text Citations** | `citation` | Numeric citation tags `[1]`, `[1-3]`, superscript indicators $^{12}$, and author-year citations `(Smith et al., 2021)`. |
| **K. Bibliographic References** | `bibliographic_reference` | Full reference list entries, author lists, journal titles, volume/issue numbers. |
| **L. DOI Identifiers** | `bibliographic_reference` | Digital Object Identifiers (`10.1016/j.jacc.2023.01.002`). |
| **M. Tables** | `table` | Tabular cell data, column headers, and structural alignments. |
| **N. Figure Captions** | `figure_caption` | Figure legends, sub-panel callouts (e.g., Figure 1A, Panel B), microscope magnification notes. |
| **O. Conclusions & Limitations**| `conclusion` / `limitation` | Explicit boundary statements, study weaknesses, and final author takeaways. |

---

## 3. Discrepancy Detection & Severity Classification

Following text revision, the `integrity-validator` module performs character- and semantic-level diffing between the revised text and the `ProtectedInventory`. Discrepancies are categorized into three severity tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DISCREPANCY SEVERITY TAXONOMY                        │
├────────────────────────────────────────────────────────────────────────┤
│  [INFO]     Stylistic adjustment of non-critical prose without        │
│             factual shift (e.g., active voice conversion).             │
│                                                                        │
│  [WARNING]  Ambiguity or minor phrasing drift requiring author review  │
│             (e.g., slight variation in limitation hedging).            │
│                                                                        │
│  [FAIL]     CRITICAL INTEGRITY BREACH:                                 │
│             - Altered numerical value or statistical metric            │
│             - Mutated medication name, unit, or dosage                 │
│             - Deleted or hallucinated citation                         │
│             - Shift from correlational to causal assertion             │
│             - Deletion of study limitation                             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. The 10 Categorical Validation Checks

The validation engine executes 10 distinct check algorithms, compiled into the `ValidationReport`:

1. **`numerical_consistency`**: Verifies that every integer, decimal, and unit in the source appears verbatim in the revised text.
2. **`statistical_consistency`**: Verifies exact matching of P-values, test statistics ($t, F, \chi^2$), confidence intervals, and effect estimates.
3. **`terminology_consistency`**: Checks that standardized MeSH terms, chemical names, and gene symbols have not been replaced with colloquial synonyms.
4. **`citation_preservation`**: Verifies that 100% of original citation markers remain in place and reference the correct bibliography items.
5. **`reference_preservation`**: Ensures the bibliography list is intact, in sequence, with uncorrupted DOIs.
6. **`drug_dosage_preservation`**: Strict zero-tolerance check ensuring no dosage number, unit, or schedule alteration.
7. **`study_design_consistency`**: Confirms that study methodology descriptors (e.g., "prospective", "post-hoc") remain uncorrupted.
8. **`clinical_outcome_consistency`**: Checks that primary endpoints, survival percentages, and adverse events are not overstated or minimized.
9. **`section_integrity`**: Ensures all document sections remain in proper order and no headings were lost.
10. **`missing_or_duplicated_content`**: Detects inadvertent paragraph drops or duplicated blocks during LLM chunk assembly.

---

## 5. The "No Silent Approval" Policy

- If a manuscript receives one or more `FAIL` ratings, the system **blocks automated one-click approval**.
- The export interface highlights the exact discrepancy in the dual-panel diff viewer.
- The author must explicitly inspect each flagged discrepancy and choose whether to revert to original phrasing or confirm the edit with an auditable acknowledgment.
- **Pass Status Clarification:** A status of `PASS` certifies **mechanical preservation** against the extracted inventory; it does not constitute clinical peer review or an endorsement of scientific truth.
