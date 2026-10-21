import { useState, useRef, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Minus, Plus, Trash2 } from "lucide-react";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Bundled with the app (same pdfjs-dist version react-pdf uses) rather than fetched from a CDN,
// so documents still load when unpkg is slow or blocked.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PlacedItem {
  id: string;
  type: "signature" | "initials" | "name" | "date" | "text" | "stamp";
  x: number;
  y: number;
  page: number;
  scale: number;
  data: string;
}

export interface CommentPin {
  id: string;
  page: number;
  x: number;
  y: number;
}

interface PDFViewerProps {
  file: File;
  activeStamp: { type: "signature" | "initials" | "name" | "date" | "text" | "stamp", data: string } | null;
  placedItems: PlacedItem[];
  onItemPlace: (item: Omit<PlacedItem, "id">) => void;
  onItemUpdate: (id: string, updates: Partial<PlacedItem>) => void;
  onItemDelete: (id: string) => void;
  /** 1 = fit to width. */
  zoom?: number;
  /** Controlled page number; the viewer manages its own page when omitted. */
  page?: number;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (numPages: number) => void;
  /** Matches are highlighted on the page. */
  searchQuery?: string;
  comments?: CommentPin[];
  activeCommentId?: string | null;
  onCommentClick?: (id: string) => void;
  /** When true, a click on the page places a comment instead of a field. */
  commentMode?: boolean;
  onCommentPlace?: (pos: { page: number; x: number; y: number }) => void;
}

// Font data for PDFs that use the standard 14 fonts (Helvetica, Times…) without embedding them,
// and character maps for CJK text. Without these, such documents render as garbled glyphs.
// Copied from pdfjs-dist into public/pdfjs by the copy-pdfjs-assets script.
export const documentOptions = {
  standardFontDataUrl: "/pdfjs/standard_fonts/",
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  // Use the bundled font data rather than guessing at a local system font, which can draw
  // the wrong glyphs (e.g. mixed-case letters squashed together).
  useSystemFonts: false,
};

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export const PDFViewer = ({
  file,
  activeStamp,
  placedItems,
  onItemPlace,
  onItemUpdate,
  onItemDelete,
  zoom = 1,
  page,
  onPageChange,
  onDocumentLoad,
  searchQuery,
  comments = [],
  activeCommentId,
  onCommentClick,
  commentMode = false,
  onCommentPlace,
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = page ?? internalPage;
  const setCurrentPage = (p: number) => (onPageChange ? onPageChange(p) : setInternalPage(p));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Render the page at the available width (max 800px) so it fits on phones, then apply zoom.
  // Placed fields use percentage positions and are scaled by the same ratio, so they stay in
  // place at any size.
  const [fitWidth, setFitWidth] = useState(800);
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setFitWidth(Math.max(240, Math.min(800, Math.floor(el.clientWidth))));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const pageWidth = Math.round(fitWidth * zoom);
  const displayScale = pageWidth / 800;
  const lastPlacementTime = useRef<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onDocumentLoad?.(numPages);
  };

  const query = searchQuery?.trim() ?? "";
  const textRenderer = useCallback(
    ({ str }: { str: string }) => {
      const safe = escapeHtml(str);
      if (!query) return safe;
      const pattern = new RegExp(escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      return safe.replace(pattern, (m) => `<mark>${m}</mark>`);
    },
    [query]
  );

  const handlePageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId) return; // Ignore click if we were dragging

    // Only respond to clicks directly on the container element itself, not bubbled events
    if (e.currentTarget !== containerRef.current) return;

    // If an item is selected, deselect it first
    if (selectedItemId) {
      setSelectedItemId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (commentMode) {
      onCommentPlace?.({ page: currentPage, x, y });
      return;
    }

    if (!activeStamp) return;

    // Debounce: prevent duplicate placements from rapid clicks
    const now = Date.now();
    if (now - lastPlacementTime.current < 500) return;
    lastPlacementTime.current = now;

    onItemPlace({
      type: activeStamp.type,
      data: activeStamp.data,
      x,
      y,
      page: currentPage,
      scale: 1,
    });
  }, [draggingId, selectedItemId, activeStamp, currentPage, onItemPlace, commentMode, onCommentPlace]);

  // Pointer events so fields can be dragged with a finger as well as a mouse.
  const handleDragStart = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    // Touch pointers are captured by the item; release so moves reach the page container.
    const target = e.target as Element;
    if (target.hasPointerCapture?.(e.pointerId)) target.releasePointerCapture(e.pointerId);
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
        const defaultWidth = 200 * displayScale;
        const defaultHeight = 80 * displayScale;

        return (
          <div
            key={item.id}
            className={`absolute cursor-move select-none ${isSelected ? "ring-2 ring-primary ring-offset-2 rounded" : ""}`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: `translate(-50%, -50%) scale(${item.scale})`,
              transformOrigin: "center",
              touchAction: "none",
              zIndex: isSelected ? 50 : 10,
            }}
            onPointerDown={(e) => handleDragStart(e, item.id)}
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
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-700 hover:bg-slate-100"
                  onClick={() => onItemUpdate(item.id, { scale: Math.max(0.5, item.scale - 0.1) })}
                  title="Decrease Size"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-700 hover:bg-slate-100"
                  onClick={() => onItemUpdate(item.id, { scale: Math.min(3, item.scale + 0.1) })}
                  title="Increase Size"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <div className="w-[1px] h-4 bg-border mx-1"></div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    onItemDelete(item.id);
                    setSelectedItemId(null);
                  }}
                  title="Delete field"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
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
                className={`min-w-[48px] border border-transparent rounded flex items-center p-1 cursor-text ${isSelected ? 'bg-white/50' : 'bg-transparent hover:border-primary/30'}`}
                style={{
                  color: "#0f172a",
                  fontFamily: '"Times New Roman", Times, Georgia, serif',
                  fontWeight: 600,
                }}
              >
                <input
                  type="text"
                  value={item.data}
                  onChange={(e) => onItemUpdate(item.id, { data: e.target.value })}
                  className="bg-transparent border-none outline-none w-full h-full text-slate-900 placeholder:text-slate-400 font-serif"
                  style={{ fontSize: `${Math.max(10, 16 * displayScale)}px`, fontFamily: '"Times New Roman", Times, Georgia, serif', minWidth: `${Math.max(48, item.data.length * 9 * Math.max(displayScale, 0.625))}px` }}
                  onPointerDown={(e) => {
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
    <div ref={wrapperRef} className="flex flex-col items-center select-none w-full max-w-full overflow-hidden">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground font-medium">
          Page {currentPage} of {numPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
          disabled={currentPage >= numPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrolls in both directions when zoomed past the available width */}
      <div className="w-full overflow-auto">
      <div
        ref={containerRef}
        className="pdf-page relative mx-auto w-fit border border-border bg-white shadow-xl rounded-sm overflow-hidden"
        style={{ cursor: commentMode || activeStamp ? "crosshair" : "default" }}
        onClick={handlePageClick}
        onPointerMove={handleDrag}
        onPointerUp={handleDragEnd}
        onPointerLeave={handleDragEnd}
      >
        <Document file={file} options={documentOptions} onLoadSuccess={onDocumentLoadSuccess} className="max-w-full">
          <Page
            pageNumber={currentPage}
            width={pageWidth}
            renderTextLayer={!!query}
            customTextRenderer={query ? textRenderer : undefined}
            renderAnnotationLayer={false}
            className="shadow-sm"
          />
        </Document>

        {renderPlacedItems()}

        {comments
          .filter((c) => c.page === currentPage)
          .map((c) => {
            const n = comments.indexOf(c) + 1;
            const active = activeCommentId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`absolute z-40 flex h-6 w-6 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full rounded-bl-none text-[11px] font-bold shadow-md ring-2 ring-white transition-transform ${
                  active ? "scale-125 bg-[#0A66C2] text-white" : "bg-[#FFC83D] text-slate-900 hover:scale-110"
                }`}
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentClick?.(c.id);
                }}
                aria-label={`Comment ${n}`}
              >
                {n}
              </button>
            );
          })}
      </div>
      </div>

      {/* Search highlights sit on react-pdf's (transparent) text layer, which must not take clicks. */}
      <style>{`
        .pdf-page .textLayer { pointer-events: none; }
        .pdf-page .textLayer mark { background: rgba(255, 200, 61, 0.55); color: transparent; border-radius: 2px; }
      `}</style>

      {commentMode && (
        <p className="mt-4 text-sm text-[#0A66C2] font-medium bg-blue-50 px-4 py-2 rounded-full">
          Click the page where you want to leave a comment
        </p>
      )}
      {!commentMode && !activeStamp && placedItems.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          Pick a field, then tap or click the page to place it
        </p>
      )}
      {!commentMode && activeStamp && (
        <p className="mt-4 text-sm text-primary font-medium bg-primary/10 px-4 py-2 rounded-full">
          Tap or click the page to place {activeStamp.type}
        </p>
      )}
    </div>
  );
};

