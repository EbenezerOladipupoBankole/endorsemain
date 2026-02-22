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

export const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};