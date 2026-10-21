import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';

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

// Standard PDF fonts only cover WinAnsi (Western European) characters and pdf-lib
// throws on anything else, which would abort the whole export. Accented letters are
// reduced to their base letter; other unsupported characters are dropped.
const toEncodable = (font: PDFFont, value: string) =>
  Array.from(value.normalize('NFKD'))
    .filter((ch) => {
      try {
        font.encodeText(ch);
        return true;
      } catch {
        return false;
      }
    })
    .join('')
    .trim();

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
          // Same box the viewer uses (200x80 on an 800px-wide page), with the image's
          // aspect ratio kept, so the download matches what the user saw on screen.
          const boxWidth = width * (200 / 800) * (item.scale || 1);
          const boxHeight = width * (80 / 800) * (item.scale || 1);
          const fit = Math.min(1, boxWidth / image.width, boxHeight / image.height);
          const drawWidth = image.width * fit;
          const drawHeight = image.height * fit;

          page.drawImage(image, {
            x: xPos - (drawWidth / 2),
            y: yPos - (drawHeight / 2),
            width: drawWidth,
            height: drawHeight,
          });
        } else {
          console.warn("Could not embed signature image; it was left out of the PDF", item.id);
        }
      }
    } else {
      const fontSize = 16 * (item.scale || 1);
      const text = toEncodable(helveticaFont, item.data);
      if (!text) continue;
      page.drawText(text, {
        x: xPos - ((text.length * fontSize * 0.5) / 2),
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