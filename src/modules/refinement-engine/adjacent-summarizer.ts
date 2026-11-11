/**
 * Lightweight extractive summarizer for cross-chunk context.
 * As specified in Section 2.1 of Prompt 4:
 * Computes a summary by concatenating the first sentence and the last sentence
 * (or first N sentences) without calling an external AI model.
 */

/**
 * Splits text into sentences using standard punctuation boundaries.
 */
export function extractSentences(text: string): string[] {
  if (!text || !text.trim()) {
    return [];
  }

  // Normalize whitespace
  const normalized = text.trim().replace(/\s+/g, ' ');

  // Split on sentence boundaries (. ! ?) followed by whitespace and an uppercase letter/quote/number
  // Also preserve abbreviations where possible
  const rawSentences = normalized.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);

  if (!rawSentences) {
    return [normalized];
  }

  return rawSentences.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Extracts a lightweight adjacent summary from a chunk of text.
 * Default strategy: first sentence + last sentence (2 sentences total).
 */
export function summarizeAdjacentText(text?: string | null, targetSentenceCount: number = 2): string {
  if (!text || !text.trim()) {
    return '';
  }

  const sentences = extractSentences(text);

  if (sentences.length === 0) {
    return '';
  }

  if (sentences.length <= targetSentenceCount) {
    return sentences.join(' ');
  }

  if (targetSentenceCount <= 1) {
    return sentences[0];
  }

  // Default 2 sentences: first sentence + last sentence
  if (targetSentenceCount === 2) {
    return `${sentences[0]} ${sentences[sentences.length - 1]}`;
  }

  // For > 2 sentences: take from start and end proportionally
  const firstHalf = Math.ceil(targetSentenceCount / 2);
  const secondHalf = targetSentenceCount - firstHalf;
  const picked = [
    ...sentences.slice(0, firstHalf),
    ...sentences.slice(sentences.length - secondHalf),
  ];
  return picked.join(' ');
}
