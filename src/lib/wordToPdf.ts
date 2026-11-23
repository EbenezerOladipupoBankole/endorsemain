import { httpsCallable } from '@/lib/callable';
import { functions } from '@/components/client';

export const isWordFile = (file: File) => /\.docx?$/i.test(file.name);

export const isPdfFile = (file: File) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

const PX_TO_PT = 0.75;
const SCALE = 2; // render at 2x for crisp text

/**
 * Y positions (px, relative to the page) where the page can be cut without slicing through
 * a line of text, a table row or an image: the bottom of every rendered line box.
 */
const safeCutPoints = (page: HTMLElement): number[] => {
  const top = page.getBoundingClientRect().top;
  const points = new Set<number>();
  const range = document.createRange();
  const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    range.selectNodeContents(walker.currentNode);
    for (const r of Array.from(range.getClientRects())) points.add(Math.ceil(r.bottom - top));
  }
  page.querySelectorAll('tr, img, svg, canvas').forEach((el) => {
    points.add(Math.ceil(el.getBoundingClientRect().bottom - top));
  });
  return Array.from(points).sort((a, b) => a - b);
};

/**
 * docx-preview only breaks pages where Word saved a page break, so a page may come out taller
 * than the paper. Splits such a page into paper-sized slices, cutting between lines, and
 * returns the [start, end) ranges in px.
 */
const pageSlices = (page: HTMLElement, paperHeight: number): [number, number][] => {
  const total = page.offsetHeight;
  if (total <= paperHeight + 2) return [[0, total]];

  const style = getComputedStyle(page);
  const padTop = parseFloat(style.paddingTop) || 0;
  const padBottom = parseFloat(style.paddingBottom) || 0;
  const cuts = safeCutPoints(page);

  const slices: [number, number][] = [];
  let start = 0;
  let first = true;
  while (start < total - padBottom - 1) {
    // The first slice already includes the top margin; later ones get it added back when drawn.
    const room = paperHeight - padBottom - (first ? 0 : padTop);
    const limit = start + room;
    if (limit >= total - padBottom) {
      slices.push([start, total - padBottom]);
      break;
    }
    const candidates = cuts.filter((c) => c > start && c <= limit);
    const end = candidates.length ? candidates[candidates.length - 1] : limit;
    slices.push([start, end]);
    start = end;
    first = false;
  }
  return slices;
};

/**
 * Renders a .docx in the browser with docx-preview, so it keeps the Word layout: page size,
 * margins, fonts, headings, alignment, lists, tables, images, headers and footers. Each
 * rendered page then becomes one PDF page.
 */
const convertDocxInBrowser = async (file: File): Promise<Blob> => {
  const [{ renderAsync }, { toCanvas }, { jsPDF }] = await Promise.all([
    import('docx-preview'),
    import('html-to-image'),
    import('jspdf'),
  ]);

  // Off-screen host: it has to be in the DOM to be laid out and captured. Text without an
  // explicit font in the document falls back to Word's default rather than the app's font.
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:-100000px;top:0;pointer-events:none;' +
    "font-family:Calibri,Carlito,Arial,sans-serif;font-size:11pt;line-height:normal;color:#000;";
  document.body.appendChild(host);

  try {
    await renderAsync(await file.arrayBuffer(), host, undefined, {
      inWrapper: true,
      breakPages: true,
      ignoreWidth: false,
      ignoreHeight: false,
      ignoreLastRenderedPageBreak: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true, // inline images so they can be drawn onto the canvas
      experimental: true, // tab stops
    });
    await document.fonts?.ready;

    const pages = Array.from(host.querySelectorAll<HTMLElement>('section.docx'));
    if (pages.length === 0) throw new Error('The Word document has no pages to render.');

    let pdf: InstanceType<typeof jsPDF> | null = null;
    for (const page of pages) {
      page.style.boxShadow = 'none';
      page.style.margin = '0';

      // Paper size comes from the document's section settings (docx-preview sets them in pt).
      const width = page.offsetWidth;
      const declared = parseFloat(page.style.minHeight);
      const paperHeight = declared > 0 ? declared / PX_TO_PT : page.offsetHeight;
      const padTop = parseFloat(getComputedStyle(page).paddingTop) || 0;
      const slices = pageSlices(page, paperHeight);

      // html-to-image has the browser draw the page itself (SVG foreignObject), so text,
      // justification and tables look exactly as they do on screen.
      const full = await toCanvas(page, {
        pixelRatio: SCALE,
        backgroundColor: '#ffffff',
        width,
        height: page.offsetHeight,
        skipFonts: true, // Word documents use installed fonts; skip fetching the app's web fonts
      });

      slices.forEach(([start, end], i) => {
        const offset = i === 0 ? 0 : padTop;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * SCALE);
        canvas.height = Math.round(paperHeight * SCALE);
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const h = Math.min(end - start, paperHeight - offset);
        ctx.drawImage(full, 0, start * SCALE, full.width, h * SCALE, 0, offset * SCALE, canvas.width, h * SCALE);

        const w = width * PX_TO_PT;
        const ph = paperHeight * PX_TO_PT;
        const orientation = w > ph ? 'landscape' : 'portrait';
        if (!pdf) pdf = new jsPDF({ unit: 'pt', format: [w, ph], orientation, compress: true });
        else pdf.addPage([w, ph], orientation);
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, ph);
      });
    }

    return pdf!.output('blob');
  } finally {
    host.remove();
  }
};

/** Server conversion (text only). Used for legacy .doc files, which the browser can't render. */
const convertWordOnServer = async (file: File): Promise<Blob> => {
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

/** Converts a .doc/.docx file to a PDF that looks like the Word document. */
export const convertWordToPDF = async (file: File): Promise<Blob> => {
  if (/\.docx$/i.test(file.name)) {
    try {
      return await convertDocxInBrowser(file);
    } catch (err) {
      console.warn('In-browser Word conversion failed, falling back to the server:', err);
    }
  }
  return convertWordOnServer(file);
};
