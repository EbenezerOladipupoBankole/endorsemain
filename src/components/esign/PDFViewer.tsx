import { useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PlacedItem {
  id: string;
  type: "signature" | "initials" | "name" | "date" | "text" | "stamp";
  x: number;
  y: number;
  page: number;
  scale: number;
  data: string;
}

interface PDFViewerProps {
  file: File;
  activeStamp: { type: "signature" | "initials" | "name" | "date" | "text" | "stamp", data: string } | null;
  placedItems: PlacedItem[];
  onItemPlace: (item: Omit<PlacedItem, "id">) => void;
  onItemUpdate: (id: string, updates: Partial<PlacedItem>) => void;
  onItemDelete: (id: string) => void;
}

export const PDFViewer = ({
  file,
  activeStamp,
  placedItems,
  onItemPlace,
  onItemUpdate,
  onItemDelete,
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPlacementTime = useRef<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handlePageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId) return; // Ignore click if we were dragging

    // Only respond to clicks directly on the container element itself, not bubbled events
    if (e.currentTarget !== containerRef.current) return;

    // If an item is selected, deselect it first
    if (selectedItemId) {
      setSelectedItemId(null);
      return;
    }

    if (!activeStamp) return;

    // Debounce: prevent duplicate placements from rapid clicks
    const now = Date.now();
    if (now - lastPlacementTime.current < 500) return;
    lastPlacementTime.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onItemPlace({
      type: activeStamp.type,
      data: activeStamp.data,
      x,
      y,
      page: currentPage,
      scale: 1,
    });
  }, [draggingId, selectedItemId, activeStamp, currentPage, onItemPlace]);

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(id);
    setSelectedItemId(id);
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    onItemUpdate(draggingId, { x, y });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const renderPlacedItems = () => {
    return placedItems
      .filter((item) => item.page === currentPage)
      .map((item) => {
        const isSelected = selectedItemId === item.id;
        // Default box width & height
        const defaultWidth = 200;
        const defaultHeight = 80;

        return (
          <div
            key={item.id}
            className={`absolute cursor-move select-none ${isSelected ? "ring-2 ring-primary ring-offset-2 rounded" : ""}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%, -50%) scale(${item.scale})`,
              transformOrigin: "center",
              zIndex: isSelected ? 50 : 10,
            }}
            onMouseDown={(e) => handleDragStart(e, item.id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItemId(item.id);
            }}
          >
            {/* Toolbar for selected item */}
            {isSelected && !draggingId && (
              <div
                className="absolute flex items-center gap-1 bg-white border border-border shadow-md rounded-md p-1"
                style={{
                  top: '-40px',
                  left: '50%',
                  transform: `translateX(-50%) scale(${1 / item.scale})`, // keep toolbar size constant regardless of item scale
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onItemUpdate(item.id, { scale: Math.max(0.5, item.scale - 0.1) })}
                  title="Decrease Size"
                >
                  <Type className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onItemUpdate(item.id, { scale: Math.min(3, item.scale + 0.1) })}
                  title="Increase Size"
                >
                  <Type className="h-4 w-4" />
                </Button>
                <div className="w-[1px] h-4 bg-border mx-1"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    onItemDelete(item.id);
                    setSelectedItemId(null);
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {["signature", "initials", "stamp"].includes(item.type) ? (
              <img
                src={item.data}
                alt={item.type}
                style={{
                  maxWidth: `${defaultWidth}px`,
                  maxHeight: `${defaultHeight}px`,
                }}
                className="pointer-events-none"
                draggable={false}
              />
            ) : (
              <div
                className={`min-w-[80px] border border-transparent rounded flex items-center p-1 cursor-text ${isSelected ? 'bg-white/50' : 'bg-transparent hover:border-primary/30'}`}
                style={{
                  color: "#1e293b",
                  fontFamily: "sans-serif"
                }}
              >
                <input
                  type="text"
                  value={item.data}
                  onChange={(e) => onItemUpdate(item.id, { data: e.target.value })}
                  className="bg-transparent border-none outline-none w-full h-full text-foreground placeholder:text-muted-foreground"
                  style={{ fontSize: "16px", minWidth: `${Math.max(80, item.data.length * 9)}px` }}
                  onMouseDown={(e) => {
                    if (isSelected) e.stopPropagation();
                  }}
                  readOnly={!isSelected}
                  placeholder={item.type === "text" ? "Type here..." : item.type}
                />
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground font-medium">
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
        className="relative border border-border bg-white shadow-xl rounded-sm overflow-hidden"
        style={{ cursor: activeStamp ? "crosshair" : "default" }}
        onClick={handlePageClick}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess} className="max-w-full">
          <Page
            pageNumber={currentPage}
            width={800}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-sm"
          />
        </Document>

        {renderPlacedItems()}
      </div>

      {!activeStamp && placedItems.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          Select a tool from the left panel to start signing
        </p>
      )}
      {activeStamp && (
        <p className="mt-4 text-sm text-primary font-medium bg-primary/10 px-4 py-2 rounded-full">
          Click anywhere on the document to place {activeStamp.type}
        </p>
      )}
    </div>
  );
};

