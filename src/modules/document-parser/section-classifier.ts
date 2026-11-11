import { DocumentSectionType } from '@/contracts/document-section';

interface ClassificationRule {
  type: DocumentSectionType;
  patterns: RegExp[];
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    type: 'abstract',
    patterns: [/^abstract$/i, /^structured\s+abstract$/i, /^summary$/i, /^synopsis$/i],
  },
  {
    type: 'keywords',
    patterns: [/^keywords?$/i, /^index\s+terms$/i, /^mesh\s+terms$/i],
  },
  {
    type: 'introduction',
    patterns: [
      /^introduction$/i,
      /^background(\s+and\s+rationale)?$/i,
      /^overview$/i,
    ],
  },
  {
    type: 'materials_and_methods',
    patterns: [
      /^materials?\s+(and|&|\+)\s+methods?$/i,
      /^patients?\s+(and|&|\+)\s+methods?$/i,
      /^subjects?\s+(and|&|\+)\s+methods?$/i,
    ],
  },
  {
    type: 'methods',
    patterns: [
      /^methods?$/i,
      /^methodology$/i,
      /^study\s+design$/i,
      /^experimental\s+(procedures?|methods?|design)$/i,
      /^methods?\s+(and|&|\+)\s+study\s+design$/i,
    ],
  },
  {
    type: 'results',
    patterns: [
      /^results?$/i,
      /^findings?$/i,
      /^observations?$/i,
    ],
  },
  {
    type: 'discussion',
    patterns: [
      /^discussion$/i,
      /^clinical\s+implications?$/i,
      /^interpretation$/i,
    ],
  },
  {
    type: 'conclusion',
    patterns: [
      /^conclusions?$/i,
      /^concluding\s+remarks$/i,
      /^summary\s+and\s+conclusions?$/i,
    ],
  },
  {
    type: 'funding',
    patterns: [
      /^funding(\s+information|\s+source(s)?)?$/i,
      /^financial\s+disclosure$/i,
      /^grant\s+support$/i,
    ],
  },
  {
    type: 'acknowledgements',
    patterns: [
      /^acknowledg(e)?ments?$/i,
      /^ethics\s+statement$/i,
      /^ethical\s+approval$/i,
      /^institutional\s+review\s+board$/i,
      /^informed\s+consent$/i,
      /^data\s+availability(\s+statement)?$/i,
      /^author\s+contributions?$/i,
    ],
  },
  {
    type: 'conflict_of_interest',
    patterns: [
      /^conflict(s)?\s+of\s+interest(s)?$/i,
      /^competing\s+interests?$/i,
      /^disclosure(s)?$/i,
      /^declaration\s+of\s+interest(s)?$/i,
    ],
  },
  {
    type: 'references',
    patterns: [
      /^references?$/i,
      /^bibliography$/i,
      /^literature\s+cited$/i,
      /^works\s+cited$/i,
    ],
  },
  {
    type: 'figure_caption',
    patterns: [/^figure\s+\d+/i, /^fig\.\s*\d+/i, /^figure\s+legends?$/i],
  },
  {
    type: 'supplementary_reference',
    patterns: [
      /^supplementary(\s+material|\s+information|\s+appendix)?$/i,
      /^appendix$/i,
    ],
  },
  {
    type: 'table',
    patterns: [/^table\s+\d+/i],
  },
];

/**
 * Classifies a raw section heading into a canonical DocumentSectionType.
 * Strips leading numbering (e.g. "1. ", "2.1 ", "IV. ") and normalizes spacing.
 */
export function classifySectionHeading(rawHeading: string): DocumentSectionType {
  let normalized = rawHeading.trim().replace(/\s+/g, ' ');
  // Strip trailing colons or periods
  normalized = normalized.replace(/[:.]+$/, '').trim();

  // Try matching directly first
  for (const rule of CLASSIFICATION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        return rule.type;
      }
    }
  }

  // Strip leading section numbers e.g. "1. ", "2.1 ", "IV. ", "Section 2: "
  const stripped = normalized
    .replace(/^(section\s+)?((\d+(\.\d+)*)|([IVXLCDM]+))[\.\:\s\-]+/i, '')
    .trim();

  if (stripped && stripped !== normalized) {
    for (const rule of CLASSIFICATION_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(stripped)) {
          return rule.type;
        }
      }
    }
  }

  return 'unknown';
}
