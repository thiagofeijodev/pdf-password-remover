import jsPDF from 'jspdf';

export async function toPDFDocument(pdfDocument) {
  const numPages = pdfDocument.numPages;
  let pdf = null;

  // Render each page and add to PDF
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2 }); // Higher scale for better quality

    // Create a temporary canvas for rendering
    const canvas = document.createElement('canvas');
    const canvasContext = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render the PDF page to canvas
    await page.render({
      canvasContext,
      viewport,
    }).promise;

    // Convert canvas to image and add to PDF
    const imgData = canvas.toDataURL('image/png');
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    if (pageNum === 1) {
      // Initialize jsPDF with the dimensions of the first page
      pdf = new jsPDF({
        orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [pageWidth, pageHeight],
      });
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    } else {
      // Add a new page with the same dimensions
      pdf.addPage([pageWidth, pageHeight]);
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    }
  }

  return pdf;
}
