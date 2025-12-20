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
  signaturePosition: SignaturePosition | null;
  onSignaturePlace: (position: SignaturePosition) => void;
  onSignatureMove: (position: SignaturePosition) => void;
}

export const PDFViewer = ({
  file,
  signatureImage,
  signaturePosition,
  onSignaturePlace,
  onSignatureMove,
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!signatureImage || isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onSignaturePlace({ x, y, page: currentPage });
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !signaturePosition) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    onSignatureMove({ x, y, page: signaturePosition.page });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
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

        {signatureImage && signaturePosition && signaturePosition.page === currentPage && (
          <div
            className="absolute cursor-move select-none"
            style={{
              left: `${signaturePosition.x}%`,
              top: `${signaturePosition.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onMouseDown={handleDragStart}
          >
            <img
              src={signatureImage}
              alt="Signature"
              className="max-w-[200px] max-h-[80px] pointer-events-none"
              draggable={false}
            />
          </div>
        )}
      </div>

      {signatureImage && !signaturePosition && (
        <p className="mt-4 text-sm text-muted-foreground">
          Click on the document to place your signature
        </p>
      )}
    </div>
  );
};
