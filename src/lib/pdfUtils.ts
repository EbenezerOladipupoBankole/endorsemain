import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

export const embedSignatureInPDF = async (
  pdfFile: File,
  signatureImage: string,
  position: SignaturePosition
): Promise<Uint8Array> => {
  const existingPdfBytes = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const signatureBytes = await fetch(signatureImage).then(res => res.arrayBuffer());
  const signaturePng = await pdfDoc.embedPng(signatureBytes);

  const page = pdfDoc.getPage(position.page - 1);
  const { width, height } = page.getSize();

  page.drawImage(signaturePng, {
    x: (position.x / 100) * width - 100, // Center the image on the x-coordinate
    y: height - ((position.y / 100) * height) - 40, // Center the image on the y-coordinate
    width: 200,
    height: 80,
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