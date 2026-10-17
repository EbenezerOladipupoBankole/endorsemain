import { useCallback, useEffect, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/components/client';

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export type ToolPanel = 'summarize' | 'search' | 'pages' | 'comments';

export interface DocComment {
  id: string;
  text: string;
  page: number;
  x: number;
  y: number;
  authorUid: string;
  authorName: string;
  createdAt: Date | null;
}

export type NewDocComment = Omit<DocComment, 'id' | 'createdAt'>;

/** Page, zoom, search and comment-placement state shared by the viewer and the tools rail. */
export function useViewerState() {
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panel, setPanel] = useState<ToolPanel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [commentMode, setCommentMode] = useState(false);
  const [pendingComment, setPendingComment] = useState<{ page: number; x: number; y: number } | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  const zoomIn = () => setZoom((z) => ZOOM_LEVELS.find((l) => l > z + 0.001) ?? z);
  const zoomOut = () => setZoom((z) => [...ZOOM_LEVELS].reverse().find((l) => l < z - 0.001) ?? z);

  /** Call when a different document is opened. */
  const reset = useCallback(() => {
    setPage(1);
    setNumPages(0);
    setZoom(1);
    setSearchQuery('');
    setCommentMode(false);
    setPendingComment(null);
    setActiveCommentId(null);
  }, []);

  return {
    page, setPage, numPages, setNumPages,
    zoom, setZoom, zoomIn, zoomOut,
    panel, setPanel,
    searchQuery, setSearchQuery,
    commentMode, setCommentMode,
    pendingComment, setPendingComment,
    activeCommentId, setActiveCommentId,
    reset,
  };
}

export type ViewerState = ReturnType<typeof useViewerState>;

/**
 * Comments on a document. With a documentId they live in Firestore
 * (documents/{id}/comments) and update live; without one they are kept in memory
 * until the document is sent (see SendAgreementModal's `comments` prop).
 */
export function useDocumentComments(documentId: string | null | undefined) {
  const [comments, setComments] = useState<DocComment[]>([]);

  useEffect(() => {
    setComments([]);
    if (!documentId) return;
    const q = query(collection(db, 'documents', documentId, 'comments'), orderBy('createdAt', 'asc'));
    return onSnapshot(
      q,
      (snap) =>
        setComments(
          snap.docs.map((d) => {
            const data = d.data({ serverTimestamps: 'estimate' });
            return {
              id: d.id,
              text: data.text,
              page: data.page,
              x: data.x,
              y: data.y,
              authorUid: data.authorUid,
              authorName: data.authorName,
              createdAt: data.createdAt?.toDate?.() ?? null,
            };
          })
        ),
      (err) => console.error('Error loading comments:', err)
    );
  }, [documentId]);

  const addComment = useCallback(
    async (c: NewDocComment) => {
      if (documentId) {
        await addDoc(collection(db, 'documents', documentId, 'comments'), { ...c, createdAt: serverTimestamp() });
      } else {
        setComments((prev) => [...prev, { ...c, id: crypto.randomUUID(), createdAt: new Date() }]);
      }
    },
    [documentId]
  );

  const deleteComment = useCallback(
    async (id: string) => {
      if (documentId) {
        await deleteDoc(doc(db, 'documents', documentId, 'comments', id));
      } else {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    },
    [documentId]
  );

  const clearComments = useCallback(() => setComments([]), []);

  return { comments, addComment, deleteComment, clearComments };
}

export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Text of each page of a PDF (index 0 = page 1). Loaded on demand so react-pdf stays out of the main bundle. */
export async function extractPdfText(file: File): Promise<string[]> {
  const [{ pdfjs }, { default: workerUrl }] = await Promise.all([
    import('react-pdf'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  if (!pdfjs.GlobalWorkerOptions.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' ').replace(/\s+/g, ' '));
  }
  await pdf.destroy();
  return pages;
}
