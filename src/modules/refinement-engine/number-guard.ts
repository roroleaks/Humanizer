/**
 * Regex-based Number Preservation Guard.
 * Conforms to Section 5.6 of Prompt 4:
 * Extracts numbers, ranges, percentages, and decimals from original and refined text.
 * Flags missing numbers with `protected_item_touched`.
 */

export interface NumberGuardResult {
  passed: boolean;
  missingNumbers: string[];
}

export interface NumberGuard {
  check(originalText: string, refinedText: string): NumberGuardResult;
}

/**
 * Extracts distinct numerical tokens from text:
 * - Decimals and integers: 12, 3.14, 1,000
 * - Percentages: 95%, 4.5%
 * - Ranges: 1.2-3.4, 10–20, 95% CI: 1.2-3.4
 */
export function extractNumbers(text: string): string[] {
  if (!text) return [];

  // Match:
  // 1. Ranges: e.g. 1.2-3.4 or 10–20%
  // 2. Percentages / decimals / integers: e.g. 95%, 0.05, 1,200, 42
  const rangeRegex = /\b\d+(?:\.\d+)?(?:%|‰)?\s*[-–—]\s*\d+(?:\.\d+)?(?:%|‰)?\b/g;
  const singleRegex = /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%?\b/g;

  const found = new Set<string>();

  const ranges = text.match(rangeRegex);
  if (ranges) {
    for (const r of ranges) {
      found.add(r.trim().replace(/\s+/g, ''));
    }
  }

  const singles = text.match(singleRegex);
  if (singles) {
    for (const s of singles) {
      found.add(s.trim());
    }
  }

  return Array.from(found);
}

export class RegexNumberGuard implements NumberGuard {
  check(originalText: string, refinedText: string): NumberGuardResult {
    if (!originalText || !originalText.trim()) {
      return { passed: true, missingNumbers: [] };
    }

    if (!refinedText || !refinedText.trim()) {
      return { passed: false, missingNumbers: extractNumbers(originalText) };
    }

    const originalNumbers = extractNumbers(originalText);
    const refinedNumbers = new Set(extractNumbers(refinedText));

    // Also check normalized inclusion in refined text to avoid minor formatting false positives
    const normalizedRefined = refinedText.replace(/[–—]/g, '-').replace(/,/g, '');

    const missing: string[] = [];

    for (const num of originalNumbers) {
      if (refinedNumbers.has(num)) {
        continue;
      }

      // Check without commas or with normalized dash
      const normNum = num.replace(/[–—]/g, '-').replace(/,/g, '');
      if (normalizedRefined.includes(normNum)) {
        continue;
      }

      // If it's a range like "1.2-3.4", check if both parts exist
      if (normNum.includes('-')) {
        const parts = normNum.split('-').map((p) => p.trim());
        const allPartsFound = parts.every((p) => normalizedRefined.includes(p));
        if (allPartsFound) {
          continue;
        }
      }

      missing.push(num);
    }

    return {
      passed: missing.length === 0,
      missingNumbers: missing,
    };
  }
}
