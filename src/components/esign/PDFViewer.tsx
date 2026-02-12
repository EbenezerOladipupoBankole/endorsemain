import { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

interface PDFViewerProps {
  file: File;
  signatureImage: string | null;
  signaturePositions: SignaturePosition[];
  onSignaturePlace: (position: SignaturePosition) => void;
  onSignatureMove: (position: SignaturePosition, index: number) => void;
  onSignatureDelete?: (index: number) => void;
}

export const PDFViewer = ({
  file,
  signatureImage,
  signaturePositions,
  onSignaturePlace,
  onSignatureMove,
  onSignatureDelete,
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDragEndTime = useRef<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent placement if we just finished dragging
    if (Date.now() - lastDragEndTime.current < 200) return;

    // Also check if we clicked on an existing signature (safety net)
    if ((e.target as HTMLElement).closest('.signature-item')) return;

    if (!signatureImage || draggedIndex !== null) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onSignaturePlace({ x, y, page: currentPage });
  };

  const handleDragStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedIndex(index);
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedIndex === null || !signaturePositions) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    onSignatureMove({ x, y, page: signaturePositions[draggedIndex].page }, draggedIndex);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      lastDragEndTime.current = Date.now();
    }
    setDraggedIndex(null);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {numPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={containerRef}
        className="relative border border-border rounded-lg overflow-hidden cursor-crosshair"
        onClick={handlePageClick}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
          <Page
            pageNumber={currentPage}
            width={600}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>

        {signatureImage && signaturePositions && signaturePositions.map((pos, index) => (
          pos.page === currentPage && (
            <div
              key={index}
              className="absolute cursor-move select-none group z-50 signature-item"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              onMouseDown={(e) => handleDragStart(e, index)}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={signatureImage}
                alt="Signature"
                className="max-w-[200px] max-h-[80px] pointer-events-none"
                draggable={false}
              />
              {onSignatureDelete && (
                <button
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSignatureDelete(index);
                  }}
                  title="Remove signature"
                >
                  <span className="text-xs font-bold leading-none">&times;</span>
                </button>
              )}
            </div>
          )
        ))}
      </div>

      {signatureImage && (!signaturePositions || signaturePositions.length === 0) && (
        <p className="mt-4 text-sm text-muted-foreground">
          Click on the document to place your signature
        </p>
      )}
    </div>
  );
};
