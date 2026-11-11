/**
 * Canonical refinement prompt skeleton following Section 5.5 of Prompt 4.
 */

export interface BaseTemplateParams {
  protectedInventoryPreamble: string;
  styleProfileText: string;
  intensityText: string;
  promptInjectionPreamble: string;
  chunkText: string;
  sectionType: string;
  styleProfileName: string;
  adjacentSummaryBefore?: string;
  adjacentSummaryAfter?: string;
}

export function renderBaseTemplate(params: BaseTemplateParams): string {
  const preceding = params.adjacentSummaryBefore?.trim() || 'None (start of section or document)';
  const following = params.adjacentSummaryAfter?.trim() || 'None (end of section or document)';

  return `${params.protectedInventoryPreamble}

${params.styleProfileText}

${params.intensityText}

${params.promptInjectionPreamble}

[TASK]
Refine the following scientific manuscript chunk for academic readability, natural sentence construction, paragraph coherence, and scientific expression. Preserve the author's intended meaning. Do not add references, new findings, or unsupported interpretations. Where the meaning is ambiguous, leave the passage unchanged and flag it.

<manuscript_chunk>
${params.chunkText}
</manuscript_chunk>

[CONTEXT]
This chunk is from the "${params.sectionType}" section of a ${params.styleProfileName} manuscript.
Preceding context: ${preceding}
Following context: ${following}

[OUTPUT]
Return only the refined chunk text. Do not include explanations, commentary, or metadata.`;
}
