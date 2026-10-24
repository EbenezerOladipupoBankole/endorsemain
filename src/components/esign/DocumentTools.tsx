import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import {
  Sparkles, Search, File as FileIcon, MessageSquare, ZoomIn, ZoomOut, X, Loader2, Trash2, Plus, AlertTriangle,
} from 'lucide-react';
import { functions } from '@/components/client';
import { extractPdfText, fileToBase64, type DocComment, type ToolPanel, type ViewerState } from './viewerTools';

const PageThumbnails = lazy(() => import('./PageThumbnails'));

interface Summary {
  overview: string;
  keyPoints: string[];
  parties: string[];
  dates: string[];
  amounts: string[];
  obligations: string[];
  watchOuts: string[];
}

interface SearchHit {
  page: number;
  before: string;
  match: string;
  after: string;
}

interface DocumentToolsProps {
  viewer: ViewerState;
  /** The PDF being viewed; null for HTML agreements (pass `text` instead). */
  file: File | null;
  /** Plain text of a non-PDF document, used by Summarize and Search. */
  text?: string;
  documentName?: string;
  comments: DocComment[];
  onAddComment: (text: string, pos: { page: number; x: number; y: number }) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  canDeleteComment: (c: DocComment) => boolean;
  /** Extra rail buttons (download, print…), shown under the tools. */
  children?: ReactNode;
  /** Pinned to the bottom of the rail. */
  footer?: ReactNode;
}

const PANEL_TITLES: Record<ToolPanel, string> = {
  summarize: 'Summary',
  search: 'Search',
  pages: 'Pages',
  comments: 'Comments',
};

const RailButton = ({ icon: Icon, label, active, disabled, onClick }: {
  icon: typeof Sparkles; label: string; active?: boolean; disabled?: boolean; onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className="flex flex-col items-center gap-1.5 group disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${active ? 'bg-[#0A66C2] text-white' : 'text-black group-hover:bg-gray-100'}`}>
      <Icon className="w-5 h-5" />
    </div>
    <span className={`text-[10px] ${active ? 'font-bold text-[#0A66C2]' : 'text-gray-700 group-hover:text-black'}`}>{label}</span>
  </button>
);

const SummaryList = ({ title, items }: { title: string; items: string[] }) =>
  items.length ? (
    <section>
      <h4 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      <ul className="space-y-1.5 text-sm text-slate-700">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#0A66C2]" />{item}</li>
        ))}
      </ul>
    </section>
  ) : null;

export const DocumentTools = ({
  viewer, file, text, documentName, comments, onAddComment, onDeleteComment, canDeleteComment, children, footer,
}: DocumentToolsProps) => {
  const { panel, setPanel } = viewer;

  // --- Summarize ---
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // --- Search ---
  const [pageTexts, setPageTexts] = useState<string[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [draftQuery, setDraftQuery] = useState(viewer.searchQuery);

  // --- Comments ---
  const [commentDraft, setCommentDraft] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  // A different document invalidates everything derived from the old one.
  useEffect(() => {
    setSummary(null);
    setSummaryError(null);
    setPageTexts(null);
    setDraftQuery('');
  }, [file, text]);

  const summarize = async () => {
    setSummarizing(true);
    setSummaryError(null);
    try {
      const payload = file ? { pdfBase64: await fileToBase64(file), name: documentName } : { text, name: documentName };
      const res = await httpsCallable<typeof payload, { summary: Summary }>(functions, 'summarizeDocument', { timeout: 300_000 })(payload);
      setSummary(res.data.summary);
    } catch (err: any) {
      console.error('Error summarizing document:', err);
      // A bare "internal" (no message from our function) means the service couldn't be reached at all.
      const bare = !err?.message || err.message.toLowerCase() === 'internal';
      setSummaryError(bare ? "Summaries aren't available right now. Please try again later." : err.message);
    } finally {
      setSummarizing(false);
    }
  };

  // Extract text the first time Search opens.
  useEffect(() => {
    if (panel !== 'search' || pageTexts || extracting) return;
    if (!file) {
      setPageTexts(text ? [text.replace(/\s+/g, ' ')] : []);
      return;
    }
    setExtracting(true);
    extractPdfText(file)
      .then(setPageTexts)
      .catch((err) => {
        console.error('Error reading document text:', err);
        toast.error('Could not read the text of this document.');
        setPageTexts([]);
      })
      .finally(() => setExtracting(false));
  }, [panel, file, text, pageTexts, extracting]);

  // Debounce typing into the highlight query.
  useEffect(() => {
    const t = setTimeout(() => viewer.setSearchQuery(draftQuery), 250);
    return () => clearTimeout(t);
  }, [draftQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const hits = useMemo<SearchHit[]>(() => {
    const q = viewer.searchQuery.trim().toLowerCase();
    if (!q || !pageTexts) return [];
    const out: SearchHit[] = [];
    pageTexts.forEach((t, i) => {
      const lower = t.toLowerCase();
      let idx = lower.indexOf(q);
      while (idx !== -1 && out.length < 200) {
        out.push({
          page: i + 1,
          before: (idx > 40 ? '…' : '') + t.slice(Math.max(0, idx - 40), idx),
          match: t.slice(idx, idx + q.length),
          after: t.slice(idx + q.length, idx + q.length + 40) + (idx + q.length + 40 < t.length ? '…' : ''),
        });
        idx = lower.indexOf(q, idx + q.length);
      }
    });
    return out;
  }, [viewer.searchQuery, pageTexts]);

  const commentCounts = useMemo(
    () => comments.reduce<Record<number, number>>((acc, c) => ({ ...acc, [c.page]: (acc[c.page] ?? 0) + 1 }), {}),
    [comments]
  );

  const togglePanel = (p: ToolPanel) => {
    const next = panel === p ? null : p;
    setPanel(next);
    if (next !== 'search') {
      viewer.setSearchQuery('');
      setDraftQuery('');
    }
    if (next !== 'comments') {
      viewer.setCommentMode(false);
      viewer.setPendingComment(null);
    }
  };

  const saveComment = async () => {
    const pos = viewer.pendingComment;
    if (!pos || !commentDraft.trim()) return;
    setSavingComment(true);
    try {
      await onAddComment(commentDraft.trim(), pos);
      setCommentDraft('');
      viewer.setPendingComment(null);
      viewer.setCommentMode(false);
    } catch (err) {
      console.error('Error saving comment:', err);
      toast.error('Could not save your comment.');
    } finally {
      setSavingComment(false);
    }
  };

  const hasDocument = !!file || !!text;

  return (
    <>
      {panel && (
        <aside className="hidden md:flex w-80 shrink-0 flex-col border-l border-gray-200 bg-white" aria-label={PANEL_TITLES[panel]}>
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="font-display text-base font-bold text-slate-900">{PANEL_TITLES[panel]}</h3>
            <button type="button" onClick={() => togglePanel(panel)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close panel">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {panel === 'summarize' && (
              <div className="space-y-5">
                {!summary && !summarizing && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">
                      Get a plain-language summary of the parties, key terms, dates, amounts and anything worth reading carefully before you sign.
                    </p>
                    <button
                      type="button"
                      onClick={summarize}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0A66C2] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#08519c]"
                    >
                      <Sparkles className="h-4 w-4" /> Summarize document
                    </button>
                    {summaryError && <p className="text-xs text-red-600">{summaryError}</p>}
                  </div>
                )}
                {summarizing && (
                  <div className="flex flex-col items-center gap-3 py-10 text-sm text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-[#0A66C2]" />
                    Reading the document…
                  </div>
                )}
                {summary && (
                  <>
                    <p className="rounded-lg bg-blue-50/70 p-3 text-sm leading-relaxed text-slate-800">{summary.overview}</p>
                    {summary.watchOuts.length > 0 && (
                      <section className="rounded-lg border-l-4 border-[#FFC83D] bg-[#FFF8E1] p-3">
                        <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                          <AlertTriangle className="h-3.5 w-3.5" /> Read carefully
                        </h4>
                        <ul className="list-disc space-y-1 pl-4 text-sm text-slate-700">
                          {summary.watchOuts.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </section>
                    )}
                    <SummaryList title="Key points" items={summary.keyPoints} />
                    <SummaryList title="Parties" items={summary.parties} />
                    <SummaryList title="Dates" items={summary.dates} />
                    <SummaryList title="Amounts" items={summary.amounts} />
                    <SummaryList title="Obligations" items={summary.obligations} />
                    <p className="border-t border-slate-100 pt-3 text-[11px] text-slate-400">AI-generated summary. Not legal advice. Always read the full document.</p>
                    <button type="button" onClick={summarize} className="text-xs font-semibold text-[#0A66C2] hover:underline">Regenerate</button>
                  </>
                )}
              </div>
            )}

            {panel === 'search' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    autoFocus
                    value={draftQuery}
                    onChange={(e) => setDraftQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && hits.length && file) {
                        const next = hits.find((h) => h.page > viewer.page) ?? hits[0];
                        viewer.setPage(next.page);
                      }
                    }}
                    placeholder="Search in document"
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20"
                  />
                </div>
                {extracting && <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /> Reading text…</p>}
                {!extracting && pageTexts && pageTexts.every((t) => !t.trim()) && (
                  <p className="text-xs text-slate-500">This document has no searchable text (it may be a scanned image).</p>
                )}
                {viewer.searchQuery.trim() && !extracting && (
                  <p className="text-xs font-semibold text-slate-500">
                    {hits.length === 0 ? 'No matches' : `${hits.length}${hits.length === 200 ? '+' : ''} match${hits.length === 1 ? '' : 'es'}`}
                  </p>
                )}
                <ul className="space-y-1">
                  {hits.map((h, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        disabled={!file}
                        onClick={() => viewer.setPage(h.page)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-xs leading-relaxed transition-colors enabled:hover:bg-slate-50 ${h.page === viewer.page && file ? 'bg-blue-50/60' : ''}`}
                      >
                        {file && <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-[#0A66C2]">Page {h.page}</span>}
                        <span className="text-slate-600">{h.before}</span>
                        <mark className="rounded bg-[#FFC83D]/60 px-0.5 text-slate-900">{h.match}</mark>
                        <span className="text-slate-600">{h.after}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {panel === 'pages' && file && viewer.numPages > 0 && (
              <Suspense fallback={<p className="text-xs text-slate-500">Loading pages…</p>}>
                <PageThumbnails
                  file={file}
                  numPages={viewer.numPages}
                  currentPage={viewer.page}
                  commentCounts={commentCounts}
                  onSelect={viewer.setPage}
                />
              </Suspense>
            )}

            {panel === 'comments' && (
              <div className="space-y-4">
                {file && !viewer.pendingComment && (
                  <button
                    type="button"
                    onClick={() => viewer.setCommentMode(!viewer.commentMode)}
                    className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-colors ${
                      viewer.commentMode ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-[#0A66C2] text-white hover:bg-[#08519c]'
                    }`}
                  >
                    {viewer.commentMode ? 'Cancel' : <><Plus className="h-4 w-4" /> Add comment</>}
                  </button>
                )}
                {!file && (
                  <p className="text-xs text-slate-500">Comments can be pinned to PDF documents.</p>
                )}

                {viewer.pendingComment && (
                  <div className="space-y-2 rounded-lg border border-[#0A66C2]/30 bg-blue-50/40 p-3">
                    <p className="text-[11px] font-semibold text-[#0A66C2]">New comment on page {viewer.pendingComment.page}</p>
                    <textarea
                      autoFocus
                      value={commentDraft}
                      maxLength={2000}
                      onChange={(e) => setCommentDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveComment();
                      }}
                      rows={3}
                      placeholder="Write a comment…"
                      className="w-full resize-none rounded-md border border-slate-200 bg-white p-2 text-sm outline-none focus:border-[#0A66C2]"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { viewer.setPendingComment(null); viewer.setCommentMode(false); setCommentDraft(''); }}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveComment}
                        disabled={!commentDraft.trim() || savingComment}
                        className="rounded-full bg-[#0A66C2] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#08519c] disabled:opacity-50"
                      >
                        {savingComment ? 'Saving…' : 'Comment'}
                      </button>
                    </div>
                  </div>
                )}

                {comments.length === 0 && !viewer.pendingComment && file && (
                  <p className="text-center text-xs text-slate-500">No comments yet.</p>
                )}
                <ul className="space-y-2">
                  {comments.map((c, i) => (
                    <li key={c.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => { viewer.setPage(c.page); viewer.setActiveCommentId(c.id); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { viewer.setPage(c.page); viewer.setActiveCommentId(c.id); } }}
                        className={`group cursor-pointer rounded-lg border p-3 transition-colors ${
                          viewer.activeCommentId === c.id ? 'border-[#0A66C2] bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFC83D] text-[10px] font-bold text-slate-900">{i + 1}</span>
                          <span className="truncate text-xs font-bold text-slate-800">{c.authorName}</span>
                          <span className="ml-auto shrink-0 text-[10px] text-slate-400">p. {c.page}</span>
                          {canDeleteComment(c) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteComment(c.id).catch(() => toast.error('Could not delete the comment.'));
                              }}
                              className="rounded p-0.5 text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100 focus:opacity-100"
                              aria-label="Delete comment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="whitespace-pre-line break-words text-sm text-slate-700">{c.text}</p>
                        {c.createdAt && (
                          <p className="mt-1 text-[10px] text-slate-400">{c.createdAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      )}

      <aside className="hidden w-[72px] bg-white border-l border-gray-200 md:flex flex-col items-center py-5 gap-6 shrink-0 overflow-y-auto">
        <RailButton icon={Sparkles} label="Summarize" active={panel === 'summarize'} disabled={!hasDocument} onClick={() => togglePanel('summarize')} />
        <RailButton icon={Search} label="Search" active={panel === 'search'} disabled={!hasDocument} onClick={() => togglePanel('search')} />
        <RailButton icon={FileIcon} label="View Pages" active={panel === 'pages'} disabled={!file} onClick={() => togglePanel('pages')} />
        <div className="relative">
          <RailButton icon={MessageSquare} label="Comment" active={panel === 'comments'} disabled={!hasDocument} onClick={() => togglePanel('comments')} />
          {comments.length > 0 && (
            <span className="pointer-events-none absolute -right-1 -top-1 rounded-full bg-[#FFC83D] px-1.5 text-[10px] font-bold text-slate-900">{comments.length}</span>
          )}
        </div>

        <div className="w-8 h-px bg-gray-200" />

        {children}

        {/* Zoom */}
        <div className="flex flex-col items-center gap-1">
          <button type="button" onClick={viewer.zoomIn} disabled={viewer.zoom >= 3} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-40" aria-label="Zoom in">
            <ZoomIn className="w-5 h-5 text-black" />
          </button>
          <button type="button" onClick={() => viewer.setZoom(1)} className="rounded px-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-100" title="Reset to fit width">
            {Math.round(viewer.zoom * 100)}%
          </button>
          <button type="button" onClick={viewer.zoomOut} disabled={viewer.zoom <= 0.5} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center disabled:opacity-40" aria-label="Zoom out">
            <ZoomOut className="w-5 h-5 text-black" />
          </button>
        </div>

        {footer}
      </aside>
    </>
  );
};
