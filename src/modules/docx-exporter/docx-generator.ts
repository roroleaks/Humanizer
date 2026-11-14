/**
 * DOCX Exporter Module
 * 
 * Formats and generates publication-grade Microsoft Word (.docx) documents
 * for refined scientific manuscripts adhering to the word-document-styling skill:
 * - High-contrast palette: Navy (#0F172A), Accent Teal (#0D9488), Slate Dark (#334155), Muted Slate (#64748B)
 * - Typography: Arial across all runs, strict hierarchy
 * - Layout: Standard 1-inch margins (1440 dxa), table width 9500 dxa
 * - Running headers and footers with page numbering
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  HeadingLevel,
} from 'docx';
import { ManuscriptWithRelations } from '@/contracts/manuscript';
import { TableData, TableCell as ParsedTableCell } from '@/contracts/document-section';
import { RefinementResult } from '@/contracts/refinement';

const COLORS = {
  navy: '0F172A',
  teal: '0D9488',
  tealLight: 'F0FDFA',
  slateDark: '334155',
  slateMuted: '64748B',
  borderGray: 'CBD5E1',
  white: 'FFFFFF',
};

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 6, color: COLORS.borderGray },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.borderGray },
  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLORS.borderGray },
  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
};

const CELL_MARGINS = {
  top: 140,
  bottom: 140,
  left: 180,
  right: 180,
};

export async function generateManuscriptDocx(
  manuscript: ManuscriptWithRelations,
  refinementResult?: RefinementResult | null
): Promise<Buffer> {
  const title = manuscript.title || 'Scientific Manuscript';
  const paragraphs: Paragraph[] = [];

  // 1. Document Title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: title,
          font: 'Arial',
          size: 48, // 24pt
          bold: true,
          color: COLORS.navy,
        }),
      ],
    })
  );

  // 2. Subtitle / Genre Tag
  const genreLabel = manuscript.styleProfile.replace('_', ' ').toUpperCase();
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 280 },
      children: [
        new TextRun({
          text: `SCIENTIFIC HUMANIZER PUBLICATION DRAFT • ${genreLabel}`,
          font: 'Arial',
          size: 20, // 10pt
          bold: true,
          color: COLORS.teal,
        }),
      ],
    })
  );

  // 3. Metadata Table (Overview Card)
  const metaTable = new Table({
    width: { size: 9500, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            margins: CELL_MARGINS,
            shading: { fill: COLORS.tealLight },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Source Ingestion', font: 'Arial', size: 18, bold: true, color: COLORS.slateDark })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 7000, type: WidthType.DXA },
            margins: CELL_MARGINS,
            children: [
              new Paragraph({
                children: [new TextRun({ text: `${manuscript.sourceType.toUpperCase()} (${manuscript.wordCount.toLocaleString()} words, ${manuscript.pageCount} page(s))`, font: 'Arial', size: 18, color: COLORS.slateDark })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2500, type: WidthType.DXA },
            margins: CELL_MARGINS,
            shading: { fill: COLORS.tealLight },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Refinement Status', font: 'Arial', size: 18, bold: true, color: COLORS.slateDark })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 7000, type: WidthType.DXA },
            margins: CELL_MARGINS,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: refinementResult
                      ? `Refined via ${refinementResult.providerName.toUpperCase()} (${refinementResult.modelUsed}) • Style: ${genreLabel}`
                      : 'Original Manuscript Draft',
                    font: 'Arial',
                    size: 18,
                    color: COLORS.slateDark,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // Collect refined paragraph mapping if available
  const refinedMap = new Map<string, string>();
  if (refinementResult) {
    const list = refinementResult.refinedParagraphs || refinementResult.paragraphs || [];
    for (const p of list) {
      refinedMap.set(p.id, p.refinedText);
    }
  }

  // 4. Build Document Sections
  const sortedSections = [...manuscript.sections].sort((a, b) => a.orderIndex - b.orderIndex);

  const sectionElements: (Paragraph | Table)[] = [];

  for (const section of sortedSections) {
    // Section Heading
    sectionElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 320, after: 120 },
        children: [
          new TextRun({
            text: section.title,
            font: 'Arial',
            size: 32, // 16pt
            bold: true,
            color: COLORS.navy,
          }),
        ],
      })
    );

    // If section contains structured scientific table
    if (section.tableData && section.tableData.cells && section.tableData.cells.length > 0) {
      sectionElements.push(buildDocxTable(section.tableData));
      if (section.content && section.content.trim().length > 0) {
        sectionElements.push(
          new Paragraph({
            spacing: { before: 80, after: 140 },
            children: [
              new TextRun({
                text: section.content,
                font: 'Arial',
                size: 18,
                italics: true,
                color: COLORS.slateMuted,
              }),
            ],
          })
        );
      }
    } else {
      // Body Text: check for refined prose or original content
      const contentText = refinedMap.get(section.id) || section.content;
      const paragraphsInContent = contentText.split(/\n\n+/);

      for (const pText of paragraphsInContent) {
        const trimmed = pText.trim();
        if (!trimmed) continue;

        sectionElements.push(
          new Paragraph({
            spacing: { before: 0, after: 140, line: 276 }, // 1.15 line spacing
            children: [
              new TextRun({
                text: trimmed,
                font: 'Arial',
                size: 22, // 11pt
                color: COLORS.slateDark,
              }),
            ],
          })
        );
      }
    }
  }

  // 5. Construct Document with Sections, Headers, and Footers
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 0, after: 80 },
                children: [
                  new TextRun({
                    text: `${title.substring(0, 45)}... • Scientific Humanizer`,
                    font: 'Arial',
                    size: 16,
                    color: COLORS.slateMuted,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 80, after: 0 },
                children: [
                  new TextRun({
                    text: 'Scientific Humanizer • Page ',
                    font: 'Arial',
                    size: 16,
                    color: COLORS.slateMuted,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Arial',
                    size: 16,
                    bold: true,
                    color: COLORS.slateMuted,
                  }),
                  new TextRun({
                    text: ' of ',
                    font: 'Arial',
                    size: 16,
                    color: COLORS.slateMuted,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Arial',
                    size: 16,
                    bold: true,
                    color: COLORS.slateMuted,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...paragraphs,
          metaTable,
          new Paragraph({ spacing: { before: 200, after: 100 }, children: [] }),
          ...sectionElements,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function buildDocxTable(tableData: TableData): Table {
  const colCount = Math.max(...tableData.cells.map((r: ParsedTableCell[]) => r.length), 1);
  const colWidth = Math.floor(9500 / colCount);

  const tableRows: TableRow[] = tableData.cells.map((row: ParsedTableCell[], rIdx: number) => {
    const isHeaderRow = rIdx === 0 || row.some((c: ParsedTableCell) => c.headerScope !== null);

    return new TableRow({
      tableHeader: isHeaderRow,
      cantSplit: true,
      children: row.map((cell: ParsedTableCell) => {
        return new TableCell({
          width: { size: colWidth * (cell.colSpan || 1), type: WidthType.DXA },
          margins: CELL_MARGINS,
          shading: isHeaderRow ? { fill: COLORS.navy } : undefined,
          children: [
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: cell.text,
                  font: 'Arial',
                  size: 19, // 9.5pt
                  bold: isHeaderRow,
                  color: isHeaderRow ? COLORS.white : COLORS.slateDark,
                }),
              ],
            }),
          ],
        });
      }),
    });
  });

  return new Table({
    width: { size: 9500, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    rows: tableRows,
  });
}
