import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Captures an HTML report and exports it as a pixel-perfect A4 PDF file.
 * Waits for fonts to be ready and applies exact A4 print layout tokens.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename: string = 'study-plan-report.pdf'
): Promise<void> {
  // Ensure all fonts and assets are loaded before snapshot
  if (document.fonts) {
    await document.fonts.ready;
  }

  const scale = 2;
  const a4WidthPx = 794; // Standard A4 width at 96 DPI
  let sectionCutPoints: number[] = [];

  // Capture the cloned element styled identically to an A4 print sheet
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: 794,
    onclone: (clonedDoc, clonedElement) => {
      // Force light theme
      clonedDoc.documentElement.classList.remove('dark');
      clonedDoc.documentElement.classList.add('light');
      clonedElement.classList.remove('dark');

      // Apply exact A4 print dimensions and reset screen card artifacts
      clonedElement.style.width = `${a4WidthPx}px`;
      clonedElement.style.maxWidth = `${a4WidthPx}px`;
      clonedElement.style.minWidth = `${a4WidthPx}px`;
      clonedElement.style.padding = '24px 28px';
      clonedElement.style.boxSizing = 'border-box';
      clonedElement.style.backgroundColor = '#ffffff';
      clonedElement.style.color = '#111827';
      clonedElement.style.borderRadius = '0px';
      clonedElement.style.border = 'none';
      clonedElement.style.boxShadow = 'none';

      // Measure section bottom boundaries directly on the cloned element
      const clonedRect = clonedElement.getBoundingClientRect();
      const sections = Array.from(
        clonedElement.querySelectorAll<HTMLElement>('.pdf-section, .semester-card, .signature-section')
      );

      sectionCutPoints = sections
        .map((sec) => {
          const secRect = sec.getBoundingClientRect();
          return Math.round((secRect.bottom - clonedRect.top) * scale);
        })
        .filter((y) => y > 0);
    },
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidthMm = 210;
  const pdfHeightMm = 297;

  // Maximum canvas height corresponding to one A4 page
  const maxPageCanvasHeight = Math.floor((canvas.width * pdfHeightMm) / pdfWidthMm);

  // Calculate page split points based on measured section boundaries
  const pageCuts: { startY: number; endY: number }[] = [];
  let currentStartY = 0;

  while (currentStartY < canvas.height) {
    const targetEndY = currentStartY + maxPageCanvasHeight;

    if (targetEndY >= canvas.height) {
      // Last page: from currentStartY to end of canvas
      pageCuts.push({ startY: currentStartY, endY: canvas.height });
      break;
    }

    // Find the best section cut point that is <= targetEndY and > currentStartY
    const candidateCuts = sectionCutPoints.filter(
      (cutY) => cutY > currentStartY + 80 && cutY <= targetEndY
    );

    let chosenCutY: number;
    if (candidateCuts.length > 0) {
      // Pick the largest cut point that fits within the page
      chosenCutY = candidateCuts[candidateCuts.length - 1];
    } else {
      // Fallback: if a single section is taller than an entire page, cut at targetEndY
      chosenCutY = Math.floor(targetEndY);
    }

    pageCuts.push({ startY: currentStartY, endY: chosenCutY });
    currentStartY = chosenCutY;
  }

  // Render each page slice to PDF with 1:1 A4 scaling
  for (let i = 0; i < pageCuts.length; i++) {
    const { startY, endY } = pageCuts[i];
    const sliceHeight = endY - startY;

    if (sliceHeight <= 0) continue;

    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;

    const ctx = pageCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      ctx.drawImage(
        canvas,
        0, startY, canvas.width, sliceHeight,
        0, 0, canvas.width, sliceHeight
      );

      const sliceImgData = pageCanvas.toDataURL('image/png');
      const sliceHeightMm = (sliceHeight * pdfWidthMm) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        sliceImgData,
        'PNG',
        0,
        0,
        pdfWidthMm,
        Math.min(sliceHeightMm, pdfHeightMm)
      );
    }
  }

  pdf.save(filename);
}
