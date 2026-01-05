
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { DocumentKnowledge } from '../types';

/**
 * Generates and downloads a PDF summary of the document knowledge.
 */
export const downloadAsPDF = (doc: DocumentKnowledge) => {
  const pdf = new jsPDF();
  let yOffset = 20;
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Helper for text wrapping
  const addText = (text: string, fontSize = 10, isBold = false) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
    lines.forEach((line: string) => {
      if (yOffset > 270) {
        pdf.addPage();
        yOffset = 20;
      }
      pdf.text(line, margin, yOffset);
      yOffset += fontSize * 0.5 + 2;
    });
    yOffset += 4;
  };

  // Title
  addText(`Knowledge Export: ${doc.metadata.title || doc.fileName}`, 16, true);
  addText(`Category: ${doc.metadata.category}`, 10, true);
  yOffset += 5;

  // Executive Summary
  addText('Executive Summary', 14, true);
  addText(doc.metadata.summary);

  // Key Takeaways
  addText('Key Takeaways', 14, true);
  doc.metadata.keyPoints.forEach((point) => {
    addText(`• ${point}`);
  });

  // Sections
  addText('Extracted Sections', 14, true);
  doc.sections.forEach((section) => {
    addText(`${section.title} (Page ${section.pageNumber})`, 12, true);
    addText(section.content);
  });

  pdf.save(`${doc.fileName.replace('.pdf', '')}_insight.pdf`);
};

/**
 * Generates and downloads a Word (.docx) document of the knowledge base.
 */
export const downloadAsWord = async (doc: DocumentKnowledge) => {
  const sections = [];

  // Title and Metadata
  sections.push(
    new Paragraph({
      text: doc.metadata.title || doc.fileName,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Category: ", bold: true }),
        new TextRun(doc.metadata.category || "Uncategorized"),
      ],
    }),
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400 },
    }),
    new Paragraph({
      text: doc.metadata.summary,
    })
  );

  // Key Points
  sections.push(
    new Paragraph({
      text: "Key Takeaways",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400 },
    })
  );
  doc.metadata.keyPoints.forEach((point) => {
    sections.push(
      new Paragraph({
        text: point,
        bullet: { level: 0 },
      })
    );
  });

  // Table content
  if (doc.tables.length > 0) {
    sections.push(
      new Paragraph({
        text: "Extracted Tables",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400 },
      })
    );

    doc.tables.forEach((tableData) => {
      sections.push(new Paragraph({ text: tableData.summary, bold: true, spacing: { before: 200 } }));
      
      const rows = [
        new TableRow({
          children: tableData.headers.map(h => new TableCell({ children: [new Paragraph({ text: h, bold: true })] }))
        }),
        ...tableData.rows.map(r => new TableRow({
          children: r.map(cell => new TableCell({ children: [new Paragraph({ text: cell })] }))
        }))
      ];

      sections.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows
      }));
    });
  }

  // Content Sections
  sections.push(
    new Paragraph({
      text: "Detailed Sections",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400 },
    })
  );

  doc.sections.forEach((section) => {
    sections.push(
      new Paragraph({
        text: `${section.title} (Page ${section.pageNumber})`,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200 },
      }),
      new Paragraph({
        text: section.content,
      })
    );
  });

  const wordDoc = new Document({
    sections: [{
      children: sections,
    }],
  });

  const blob = await Packer.toBlob(wordDoc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.fileName.replace('.pdf', '')}_insight.docx`;
  link.click();
  URL.revokeObjectURL(url);
};
