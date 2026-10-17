import { Document, Page, pdfjs } from 'react-pdf';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PageThumbnailsProps {
  file: File;
  numPages: number;
  currentPage: number;
  /** Pages that have comments, to badge their thumbnails. */
  commentCounts?: Record<number, number>;
  onSelect: (page: number) => void;
}

const PageThumbnails = ({ file, numPages, currentPage, commentCounts = {}, onSelect }: PageThumbnailsProps) => (
  <Document file={file} loading={<p className="p-4 text-xs text-slate-500">Loading pages…</p>}>
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onSelect(n)}
          className="group flex flex-col items-center gap-1"
          aria-label={`Go to page ${n}`}
          aria-current={n === currentPage ? 'page' : undefined}
        >
          <div
            className={`relative overflow-hidden rounded border-2 bg-white shadow-sm transition-colors ${
              n === currentPage ? 'border-[#0A66C2]' : 'border-transparent group-hover:border-slate-300'
            }`}
          >
            <Page pageNumber={n} width={112} renderTextLayer={false} renderAnnotationLayer={false} />
            {commentCounts[n] > 0 && (
              <span className="absolute right-1 top-1 rounded-full bg-[#FFC83D] px-1.5 text-[10px] font-bold text-slate-900">
                {commentCounts[n]}
              </span>
            )}
          </div>
          <span className={`text-[11px] ${n === currentPage ? 'font-bold text-[#0A66C2]' : 'text-slate-600'}`}>{n}</span>
        </button>
      ))}
    </div>
  </Document>
);

export default PageThumbnails;
