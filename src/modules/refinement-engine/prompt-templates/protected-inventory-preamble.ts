export const PROTECTED_INVENTORY_PREAMBLE = `[IMMUTABLE SCIENTIFIC DATA POLICY]
You are refining a peer-reviewed scientific manuscript. You must preserve the following items verbatim:
- All numerical values (sample sizes, ages, measurements, doses, concentrations, percentages, ratios).
- All statistical results (P-values, confidence intervals, odds ratios, hazard ratios, t/F statistics).
- All medication/drug generic and trade names, dosage amounts, frequencies, and administration routes.
- All laboratory and scientific units (e.g., mg/dL, mmHg, mL/min/1.73m², μmol/L).
- All citation bracket markers (e.g., [1], [2-4]) and parenthetical author-date citations.
- All formal bibliographic entries and DOI identifiers.
- All figure references, table designations, and caption text.
CRITICAL CONSTRAINT: Do not alter, reformat, round, or paraphrase any of these elements. If you cannot refine the prose without altering an immutable item, leave that specific passage unchanged.`;
