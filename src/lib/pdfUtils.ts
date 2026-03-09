import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

export const embedSignatureInPDF = async (
  pdfFile: File,
  signatureImage: string,
  position: SignaturePosition & { width: number }
): Promise<Uint8Array> => {
  const existingPdfBytes = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const signatureBytes = await fetch(signatureImage).then(res => res.arrayBuffer());
  const signaturePng = await pdfDoc.embedPng(signatureBytes);

  const page = pdfDoc.getPage(position.page - 1);
  const { width, height } = page.getSize();

  // Convert percentage width to PDF points
  const sigWidth = (position.width / 100) * width;
  const sigHeight = (sigWidth / signaturePng.width) * signaturePng.height;

  page.drawImage(signaturePng, {
    x: (position.x / 100) * width - (sigWidth / 2),
    y: height - ((position.y / 100) * height) - (sigHeight / 2),
    width: sigWidth,
    height: sigHeight,
  });

  return pdfDoc.save();
};

export const embedItemsInPDF = async (
  pdfFile: File,
  items: any[]
): Promise<Uint8Array> => {
  const existingPdfBytes = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const item of items) {
    const page = pdfDoc.getPage(item.page - 1);
    const { width, height } = page.getSize();

    const xPos = (item.x / 100) * width;
    const yPos = height - ((item.y / 100) * height);

    if (['signature', 'initials', 'stamp'].includes(item.type)) {
      if (item.data.startsWith('data:image')) {
        const signatureBytes = await fetch(item.data).then(res => res.arrayBuffer());
        let image;
        if (item.data.includes('image/jpeg')) {
          image = await pdfDoc.embedJpg(signatureBytes);
        } else {
          try {
            image = await pdfDoc.embedPng(signatureBytes);
          } catch (e) {
            console.warn("Failed to embed PNG, falling back to general embed");
          }
        }

        if (image) {
          const defaultWidth = 200 * (item.scale || 1);
          const defaultHeight = 80 * (item.scale || 1);

          page.drawImage(image, {
            x: xPos - (defaultWidth / 2),
            y: yPos - (defaultHeight / 2),
            width: defaultWidth,
            height: defaultHeight,
          });
        }
      }
    } else {
      const fontSize = 16 * (item.scale || 1);
      page.drawText(item.data, {
        x: xPos - ((item.data.length * fontSize * 0.5) / 2),
        y: yPos - (fontSize / 2),
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.12, 0.16, 0.23), // match #1e293b approx
      });
    }
  }

  return pdfDoc.save();
};

export const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
  const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};