import { httpsCallable } from '@/lib/callable';
import { functions } from '@/components/client';

export const isWordFile = (file: File) => /\.docx?$/i.test(file.name);

export const isPdfFile = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

/** Converts a .doc/.docx file to a PDF using the convertDocument Cloud Function. */
export const convertWordToPDF = async (file: File): Promise<Blob> => {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const convertDocument = httpsCallable(functions, 'convertDocument');
  // Same payload shape the File Conversion page uses; the function expects a `files` array.
  const result = await convertDocument({
    files: [{ base64, name: file.name, type: file.type }],
    targetFormat: 'pdf',
    toolId: 'word-to-pdf',
  });

  const data = result.data as { pdfBase64: string };
  return new Blob([Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0))], { type: 'application/pdf' });
};
