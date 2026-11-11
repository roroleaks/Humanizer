/**
 * Two-pass semantic chunking engine.
 * Conforms to Section 2.1 & 5.4 of Prompt 4:
 * Pass 1: Structural split by paragraphs with hard 800-word sentence-boundary overflow splitting.
 * Pass 2: Semantic grouping targeting 400-600 words, preserving adjacent paragraphs sharing reference markers.
 */

import { DocumentSection } from '@/contracts/document-section';
import { RefinementChunkPlan } from '@/contracts/refinement';
import { extractSentences, summarizeAdjacentText } from './adjacent-summarizer';

export interface ManuscriptContext {
  manuscriptId: string;
  manuscriptTitle?: string;
  adjacentSections?: {
    preceding?: DocumentSection;
    following?: DocumentSection;
  };
}

export interface Chunker {
  plan(section: DocumentSection, manuscriptContext: ManuscriptContext): RefinementChunkPlan[];
}

export interface ChunkerConfig {
  targetWords: number;
  maxWords: number;
  minGroupWords: number;
  maxGroupWords: number;
}

const DEFAULT_CONFIG: ChunkerConfig = {
  targetWords: 500,
  maxWords: 800,
  minGroupWords: 400,
  maxGroupWords: 600,
};

export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Extracts reference markers:
 * - Table references (e.g., "Table 1", "Tab. 2")
 * - Figure references (e.g., "Figure 1", "Fig. 2")
 * - Citations (e.g., "[Smith 2020]", "[1]", "(Smith et al., 2020)", "(1)")
 */
export function extractReferenceMarkers(text: string): string[] {
  if (!text) return [];
  const markers = new Set<string>();

  // Tables
  const tableMatches = text.match(/\b(?:Table|Tab\.)\s+[0-9A-Za-z-]+/gi);
  if (tableMatches) {
    for (const m of tableMatches) markers.add(m.trim());
  }

  // Figures
  const figureMatches = text.match(/\b(?:Figure|Fig\.)\s+[0-9A-Za-z-]+/gi);
  if (figureMatches) {
    for (const m of figureMatches) markers.add(m.trim());
  }

  // Bracket citations [1], [Smith 2020], [1, 2], [1-3]
  const bracketMatches = text.match(/\[[A-Za-z0-9\s,.;:-]+\]/g);
  if (bracketMatches) {
    for (const m of bracketMatches) markers.add(m.trim());
  }

  // Parenthetical author-year citations: (Smith et al., 2020), (Doe, 2019)
  const parenMatches = text.match(/\([A-Z][A-Za-z\s]+(?:et\s+al\.?)?,?\s*(?:19|20)\d{2}[a-z]?\)/g);
  if (parenMatches) {
    for (const m of parenMatches) markers.add(m.trim());
  }

  return Array.from(markers);
}

/**
 * Splits a single paragraph that exceeds maxWords at sentence boundaries.
 */
function splitOverflowParagraph(paragraphText: string, maxWords: number): string[] {
  const words = countWords(paragraphText);
  if (words <= maxWords) {
    return [paragraphText];
  }

  const sentences = extractSentences(paragraphText);
  if (sentences.length <= 1) {
    // Cannot split at sentence boundary; must keep as single slice
    return [paragraphText];
  }

  const slices: string[] = [];
  let currentSliceSentences: string[] = [];
  let currentSliceWords = 0;

  for (const sentence of sentences) {
    const sWords = countWords(sentence);
    if (currentSliceWords + sWords > maxWords && currentSliceSentences.length > 0) {
      slices.push(currentSliceSentences.join(' '));
      currentSliceSentences = [sentence];
      currentSliceWords = sWords;
    } else {
      currentSliceSentences.push(sentence);
      currentSliceWords += sWords;
    }
  }

  if (currentSliceSentences.length > 0) {
    slices.push(currentSliceSentences.join(' '));
  }

  return slices;
}

interface IntermediateParagraph {
  id: string;
  text: string;
  wordCount: number;
  markers: string[];
}

export class SemanticChunker implements Chunker {
  private config: ChunkerConfig;

  constructor(customConfig?: Partial<ChunkerConfig>) {
    const targetWords = customConfig?.targetWords ??
      (process.env.SH_REFINE_TARGET_CHUNK_WORDS ? parseInt(process.env.SH_REFINE_TARGET_CHUNK_WORDS, 10) : DEFAULT_CONFIG.targetWords);
    const maxWords = customConfig?.maxWords ??
      (process.env.SH_REFINE_MAX_CHUNK_WORDS ? parseInt(process.env.SH_REFINE_MAX_CHUNK_WORDS, 10) : DEFAULT_CONFIG.maxWords);

    this.config = {
      targetWords: isNaN(targetWords) ? DEFAULT_CONFIG.targetWords : targetWords,
      maxWords: isNaN(maxWords) ? DEFAULT_CONFIG.maxWords : maxWords,
      minGroupWords: 400,
      maxGroupWords: 600,
      ...customConfig,
    };
  }

  plan(section: DocumentSection, manuscriptContext: ManuscriptContext): RefinementChunkPlan[] {
    const content = section.content || '';
    if (!content.trim()) {
      return [];
    }

    // PASS 1: Structural split into paragraphs
    const rawParagraphs = content
      .split(/\r?\n\s*\r?\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (rawParagraphs.length === 0) {
      return [];
    }

    const structuredParagraphs: IntermediateParagraph[] = [];
    let pCounter = 0;

    for (const rawP of rawParagraphs) {
      const pWords = countWords(rawP);
      if (pWords > this.config.maxWords) {
        // Split overflow paragraph at sentence boundary
        const splitParts = splitOverflowParagraph(rawP, this.config.maxWords);
        for (const part of splitParts) {
          structuredParagraphs.push({
            id: `p_${section.id}_${pCounter++}`,
            text: part,
            wordCount: countWords(part),
            markers: extractReferenceMarkers(part),
          });
        }
      } else {
        structuredParagraphs.push({
          id: `p_${section.id}_${pCounter++}`,
          text: rawP,
          wordCount: pWords,
          markers: extractReferenceMarkers(rawP),
        });
      }
    }

    // PASS 2: Semantic grouping into 400-600 words, hard ceiling 800
    const rawChunks: Array<{
      paragraphs: IntermediateParagraph[];
      sharedMarkers: string[];
    }> = [];

    let currentGroup: IntermediateParagraph[] = [];
    let currentGroupWords = 0;
    let currentGroupMarkers = new Set<string>();

    for (let i = 0; i < structuredParagraphs.length; i++) {
      const p = structuredParagraphs[i];

      if (currentGroup.length === 0) {
        currentGroup.push(p);
        currentGroupWords = p.wordCount;
        p.markers.forEach((m) => currentGroupMarkers.add(m));
        continue;
      }

      const projectedWords = currentGroupWords + p.wordCount;

      // Check for shared reference markers with current group
      const sharedWithCurrent = p.markers.filter((m) => currentGroupMarkers.has(m));
      const hasSharedMarker = sharedWithCurrent.length > 0;

      // Grouping rules:
      // 1. If projected <= maxGroupWords (600), always group
      // 2. If projected > 600 but <= maxWords (800), group IF they share a reference marker
      // 3. If projected > maxWords (800) or (projected > 600 without shared marker): close chunk and start new
      if (projectedWords <= this.config.maxGroupWords) {
        currentGroup.push(p);
        currentGroupWords = projectedWords;
        p.markers.forEach((m) => currentGroupMarkers.add(m));
      } else if (projectedWords <= this.config.maxWords && hasSharedMarker) {
        currentGroup.push(p);
        currentGroupWords = projectedWords;
        p.markers.forEach((m) => currentGroupMarkers.add(m));
      } else {
        // Find shared markers within the group being closed
        const allMarkers = currentGroup.flatMap((x) => x.markers);
        const markerCounts = new Map<string, number>();
        allMarkers.forEach((m) => markerCounts.set(m, (markerCounts.get(m) || 0) + 1));
        const shared = Array.from(markerCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([marker]) => marker);

        rawChunks.push({
          paragraphs: currentGroup,
          sharedMarkers: shared,
        });

        currentGroup = [p];
        currentGroupWords = p.wordCount;
        currentGroupMarkers = new Set(p.markers);
      }
    }

    if (currentGroup.length > 0) {
      const allMarkers = currentGroup.flatMap((x) => x.markers);
      const markerCounts = new Map<string, number>();
      allMarkers.forEach((m) => markerCounts.set(m, (markerCounts.get(m) || 0) + 1));
      const shared = Array.from(markerCounts.entries())
        .filter(([_, count]) => count > 1)
        .map(([marker]) => marker);

      rawChunks.push({
        paragraphs: currentGroup,
        sharedMarkers: shared,
      });
    }

    // Now construct RefinementChunkPlan[] with cross-chunk context summaries
    const plans: RefinementChunkPlan[] = [];

    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i];
      const chunkText = chunk.paragraphs.map((p) => p.text).join('\n\n');
      const paragraphIds = chunk.paragraphs.map((p) => p.id);
      const wordCount = countWords(chunkText);

      // Summaries for preceding and following chunk
      let precedingSummary = '';
      if (i > 0) {
        const prevText = rawChunks[i - 1].paragraphs.map((p) => p.text).join('\n\n');
        precedingSummary = summarizeAdjacentText(prevText);
      } else if (manuscriptContext.adjacentSections?.preceding?.content) {
        precedingSummary = summarizeAdjacentText(manuscriptContext.adjacentSections.preceding.content);
      }

      let followingSummary = '';
      if (i < rawChunks.length - 1) {
        const nextText = rawChunks[i + 1].paragraphs.map((p) => p.text).join('\n\n');
        followingSummary = summarizeAdjacentText(nextText);
      } else if (manuscriptContext.adjacentSections?.following?.content) {
        followingSummary = summarizeAdjacentText(manuscriptContext.adjacentSections.following.content);
      }

      plans.push({
        id: `chunk_${section.id}_${i}`,
        manuscriptId: manuscriptContext.manuscriptId,
        sectionId: section.id,
        chunkIndex: i,
        paragraphIds,
        originalText: chunkText,
        wordCount,
        context: {
          manuscriptTitle: manuscriptContext.manuscriptTitle,
          sectionType: section.type,
          precedingSectionSummary: precedingSummary || undefined,
          followingSectionSummary: followingSummary || undefined,
          protectedInventory: {
            terms: [],
            units: [],
            numbers: [],
            citations: [],
          },
        },
        sharedReferenceMarkers: chunk.sharedMarkers,
      });
    }

    return plans;
  }
}
