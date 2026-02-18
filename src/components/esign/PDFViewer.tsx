import { useState, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
}

interface PDFViewerProps {
  file: File;
  signatureImage: string | null;
  signaturePositions: SignaturePosition[];
  onSignaturePlace: (position: Omit<SignaturePosition, 'width'>) => void;
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
  const [resizingState, setResizingState] = useState<{ index: number; initialX: number; initialWidth: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDragEndTime = useRef<number>(0);
  const isDraggingRef = useRef(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent placement if we are currently dragging or just finished (sync check)
    if (isDraggingRef.current) return;

    // Prevent placement if we just finished dragging (timestamp check fallback)
    if (Date.now() - lastDragEndTime.current < 500) return;

    // Also check if we clicked on an existing signature (safety net)
    if ((e.target as HTMLElement).closest('.signature-item')) return;

    if (!signatureImage || draggedIndex !== null) return;

    // Additional check: valid coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Ignore clicks outside reasonable bounds (optional but good)
    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    onSignaturePlace({ x, y, page: currentPage });
  };

  const handleDragStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    setDraggedIndex(index);
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggedIndex === null || !signaturePositions) return;

    // Use specific container for reference dimensions
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const newPosition = { ...signaturePositions[draggedIndex], x, y };
    onSignatureMove(newPosition, draggedIndex);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null || isDraggingRef.current) {
      lastDragEndTime.current = Date.now();
    }
    setDraggedIndex(null);
    // Keep ref true for a safety window to block subsequent clicks
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 500);
  };

  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;

    setResizingState({
      index,
      initialX: e.clientX,
      initialWidth: (signaturePositions[index].width / 100) * containerRef.current.offsetWidth,
    });
  };

  const handleResize = (e: React.MouseEvent) => {
    if (!resizingState || !containerRef.current) return;

    const dx = e.clientX - resizingState.initialX;
    const newWidthPx = resizingState.initialWidth + dx;
    const containerWidth = containerRef.current.offsetWidth;

    let newWidthPercent = (newWidthPx / containerWidth) * 100;

    // Constraints
    newWidthPercent = Math.max(10, Math.min(80, newWidthPercent));

    const { index } = resizingState;
    const newPosition = { ...signaturePositions[index], width: newWidthPercent };
    onSignatureMove(newPosition, index);
  };

  const handleResizeEnd = () => {
    setResizingState(null);
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
                width: `${pos.width}%`,
              }}
              onMouseDown={(e) => handleDragStart(e, index)}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={signatureImage}
                alt="Signature"
                className="w-full h-auto pointer-events-none"
                draggable={false}
              />
              {onSignatureDelete && (
                <button
                  className="absolute -top-2.5 -right-2.5 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSignatureDelete(index);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Remove signature"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {/* Resize Handle */}
              <div
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white cursor-se-resize z-20"
                onMouseDown={(e) => handleResizeStart(e, index)}
              />
            </div>
          )
        ))}

        {/* Global Drag/Resize Overlay */}
        {(draggedIndex !== null || resizingState !== null) && (
          <div
            className="fixed inset-0 z-[100]"
            style={{ cursor: resizingState !== null ? 'se-resize' : 'grabbing', touchAction: 'none' }}
            onMouseMove={(e) => {
              if (draggedIndex !== null) handleDrag(e);
              if (resizingState !== null) handleResize(e);
            }}
            onMouseUp={() => {
              if (draggedIndex !== null) handleDragEnd();
              if (resizingState !== null) handleResizeEnd();
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => {
              if (draggedIndex !== null) handleDragEnd();
              if (resizingState !== null) handleResizeEnd();
            }}
          />
        )}
      </div>

      {signatureImage && (!signaturePositions || signaturePositions.length === 0) && (
        <p className="mt-4 text-sm text-muted-foreground">
          Click on the document to place your signature
        </p>
      )}
    </div>
  );
};
