/**
 * PDF tools that run entirely in the browser: no upload, so they're fast and work for any size
 * the device can handle. pdf.js (already bundled via react-pdf) reads text; pdf-lib merges.
 */

const loadPdfJs = async () => {
  const [{ pdfjs }, { default: workerUrl }] = await Promise.all([
    import('react-pdf'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  if (!pdfjs.GlobalWorkerOptions.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
};

const readError = (err: unknown, name: string) => {
  const kind = (err as { name?: string })?.name;
  if (kind === 'PasswordException') return new Error(`"${name}" is password-protected. Remove the password and try again.`);
  return new Error(`Could not read "${name}". It may be damaged or not a real PDF.`);
};

// ---------- Merge ----------

export const mergePdfs = async (files: File[]): Promise<Blob> => {
  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();
  for (const file of files) {
    let pdf;
    try {
      // ignoreEncryption lets owner-restricted PDFs (no open password) be merged.
      pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    } catch (err) {
      throw readError(err, file.name);
    }
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return new Blob([await merged.save()], { type: 'application/pdf' });
};

// ---------- PDF to Word ----------

interface Line {
  text: string;
  y: number;
  height: number;
  bold: boolean;
}

/** Groups pdf.js text items into lines (same baseline), then lines into paragraphs by vertical gaps. */
const pageParagraphs = (items: Array<{ str: string; transform: number[]; height: number; fontName: string; hasEOL?: boolean }>, styles: Record<string, { fontFamily?: string }>) => {
  const lines: Line[] = [];
  let current: Line | null = null;
  for (const item of items) {
    const y = item.transform[5];
    const height = Math.abs(item.height || item.transform[3] || 10);
    const bold = /bold|black|heavy/i.test(`${item.fontName} ${styles[item.fontName]?.fontFamily ?? ''}`);
    if (!current || Math.abs(current.y - y) > height * 0.5) {
      if (current) lines.push(current);
      current = { text: '', y, height, bold };
    }
    current.text += item.str;
    current.height = Math.max(current.height, height);
    current.bold = current.bold && bold;
    if (item.hasEOL) {
      lines.push(current);
      current = null;
    }
  }
  if (current) lines.push(current);

  const paragraphs: { text: string; size: number; bold: boolean }[] = [];
  let prev: Line | null = null;
  for (const line of lines) {
    const text = line.text.replace(/\s+/g, ' ').trim();
    if (!text) {
      prev = null;
      continue;
    }
    const gap = prev ? prev.y - line.y : 0;
    const sameParagraph = prev && gap > 0 && gap < line.height * 1.8 && Math.abs(prev.height - line.height) < 1;
    if (sameParagraph) {
      const last = paragraphs[paragraphs.length - 1];
      last.text = last.text.endsWith('-') ? last.text.slice(0, -1) + text : `${last.text} ${text}`;
    } else {
      paragraphs.push({ text, size: line.height, bold: line.bold });
    }
    prev = line;
  }
  return paragraphs;
};

const xmlEscape = (s: string) =>
  s
    // Characters XML 1.0 forbids; Word refuses to open a file containing them.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const paragraphXml = (text: string, sizePt: number, bold: boolean, pageBreakBefore: boolean) => {
  // Word sizes are half-points; keep body text readable and headings proportional.
  const halfPoints = Math.round(Math.min(Math.max(sizePt, 9), 28) * 2);
  return (
    `<w:p><w:pPr>${pageBreakBefore ? '<w:pageBreakBefore/>' : ''}<w:spacing w:after="160"/></w:pPr>` +
    `<w:r><w:rPr>${bold ? '<w:b/>' : ''}<w:sz w:val="${halfPoints}"/></w:rPr>` +
    `<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`
  );
};

/** Converts a text-based PDF to an editable .docx. Scanned (image-only) PDFs have no text to extract. */
export const pdfToDocx = async (file: File): Promise<Blob> => {
  const pdfjs = await loadPdfJs();
  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (err) {
    throw readError(err, file.name);
  }

  const body: string[] = [];
  let totalChars = 0;
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      const items = content.items.filter((it): it is typeof it & { str: string; transform: number[]; height: number; fontName: string } => 'str' in it);
      const paragraphs = pageParagraphs(items, content.styles);
      paragraphs.forEach((p, idx) => {
        totalChars += p.text.length;
        body.push(paragraphXml(p.text, p.size, p.bold, i > 1 && idx === 0));
      });
    }
  } finally {
    await pdf.destroy();
  }

  if (totalChars < 5) {
    throw new Error('This PDF looks like a scanned image, so there is no text to put in a Word document.');
  }

  const documentXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    body.join('') +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>' +
    '</w:body></w:document>';

  return zip(
    [
      {
        name: '[Content_Types].xml',
        data:
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
          '</Types>',
      },
      {
        name: '_rels/.rels',
        data:
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
          '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
          '</Relationships>',
      },
      { name: 'word/document.xml', data: documentXml },
    ],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
};

// ---------- Minimal zip writer (stored, no compression) ----------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const zip = (entries: { name: string; data: string }[], type: string): Blob => {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = enc.encode(entry.name);
    const data = enc.encode(entry.data);
    const crc = crc32(data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint16(8, 0, true); // stored
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);

    const cd = new Uint8Array(46 + name.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    cd.set(name, 46);

    parts.push(local, data);
    central.push(cd);
    offset += local.length + data.length;
  }

  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  return new Blob([...parts, ...central, end], { type });
};
