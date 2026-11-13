import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { httpsCallable } from '@/lib/callable';
import { convertWordToPDF } from '@/lib/wordToPdf';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, getDocs, orderBy, limit, deleteDoc, doc, onSnapshot, writeBatch, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions } from '@/components/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/components/AuthContext';
import { PDFUploader } from '@/components/esign/PDFUploader';
import SignatureModal from '@/components/SignatureModal';
import { SendAgreementModal } from '@/components/agreements/SendAgreementModal';
import type { AgreementTemplate } from '@/components/agreements/TemplateStudio';
import {
  type SignatureRecord,
  isSigned,
  displayName,
  isWhatsApp,
  formatDate,
  useSignatureDocuments,
  sendReminder,
  SigningProgress,
  SigningRecord,
} from '@/components/agreements/documentTracking';
import { signingLink } from '@/components/agreements/signingUtils';
import { AuditTrail } from '@/components/agreements/AuditTrail';
import { type Draft, createDraft, saveDraftItems, loadDraftFile, deleteDraft, useDrafts, editedAgo, MAX_DRAFT_BYTES } from '@/lib/drafts';
import { Logo } from '@/components/Logo';
import { APP_NAV, initialsOf } from '@/components/AppHeader';
import { DocumentTools } from '@/components/esign/DocumentTools';
import { useViewerState, useDocumentComments } from '@/components/esign/viewerTools';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { FREE_DOCUMENT_LIMIT, FREE_LIMIT_ENFORCED, tryClaimDocumentCredit, isOutOfFreeDocuments, planStatus } from '@/lib/plan';
import {
  Menu,
  Settings,
  Bell,
  ChevronDown,
  LogOut,
  HelpCircle,
  BookOpen,
  LifeBuoy,
  Terminal,
  Clock,
  Loader2,
  FileText,
  Activity,
  Trash2,
  Users,
  Palette,
  ChevronRight,
  AlertCircle,
  FileSignature,
  PenTool,
  X,
  Upload,
  Download,
  Printer,
  Search,
  Plus,
  Type,
  Stamp,
  Calendar,
  User,
  UserSquare,
  UserCircle,
  Mail,
  Briefcase,
  Sparkles,
  File as FileIcon,
  MessageSquare,
  ZoomIn,
  Award,
  Moon,
  Sun,
  Send,
  Copy,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Lazy load heavy components to reduce initial bundle size
const PDFViewer = lazy(() => import('@/components/esign/PDFViewer').then(module => ({ default: module.PDFViewer })));

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
  width: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile, isAdmin, loading: authLoading, signOut } = useAuth();

  // The profile is only loaded once, so keep the free-document count fresh after each claim.
  const [freeUsed, setFreeUsed] = useState<number | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const plan = planStatus(userProfile, isAdmin);
  const freeDocsUsed = Math.min(freeUsed ?? plan.freeUsed, FREE_DOCUMENT_LIMIT);

  const renderPlanCard = (className = '') => (
    <Card className={className}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Award className="h-4 w-4 text-black" />
          {plan.paid ? `${plan.name} plan` : 'Free plan'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {!FREE_LIMIT_ENFORCED && !plan.paid ? (
          <p className="text-xs text-muted-foreground">Unlimited signing and sending, free for now.</p>
        ) : plan.paid ? (
          <p className="text-xs text-muted-foreground">
            Unlimited signing and sending
            {plan.endsAt ? ` until ${plan.endsAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}.` : '.'}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {freeDocsUsed} of {FREE_DOCUMENT_LIMIT} free documents used
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={FREE_DOCUMENT_LIMIT} aria-valuenow={freeDocsUsed}>
              <div
                className={`h-full rounded-full ${freeDocsUsed >= FREE_DOCUMENT_LIMIT ? 'bg-[#FFC83D]' : 'bg-[#0A66C2]'}`}
                style={{ width: `${(freeDocsUsed / FREE_DOCUMENT_LIMIT) * 100}%` }}
              />
            </div>
            <Button asChild size="sm" className="mt-3 w-full bg-[#FFC83D] font-bold text-black hover:bg-[#e6b435]">
              <Link to="/payment?plan=pro">Upgrade</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [activeStampType, setActiveStampType] = useState<string | null>(null);
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [placedItems, setPlacedItems] = useState<any[]>([]);

  // Drafts: every upload is saved, and the placed fields are saved as you work.
  const drafts = useDrafts(user?.uid);
  const draftIdRef = useRef<string | null>(null);
  const [draftId, setDraftIdState] = useState<string | null>(null);
  const setDraftId = (id: string | null) => {
    draftIdRef.current = id;
    setDraftIdState(id);
  };
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [openingDraftId, setOpeningDraftId] = useState<string | null>(null);
  const skipNextSaveRef = useRef(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  // Same live source as the Send for Signature page, so the counts and the list always match.
  const { sent, received, loading: loadingDocs } = useSignatureDocuments(user?.email);
  const recentDocs = sent.slice(0, 5);
  const stats = {
    waitingOnYou: received.length,
    awaiting: sent.filter((r) => !isSigned(r)).length,
    completed: sent.filter(isSigned).length,
    total: sent.length,
  };
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFinishChoice, setShowFinishChoice] = useState(false);
  const [inviteDocument, setInviteDocument] = useState<AgreementTemplate | null>(null);
  const [isPreparingInvite, setIsPreparingInvite] = useState(false);
  // Summarize / search / pages / comments / zoom. Comments stay in memory until the document is sent.
  const viewer = useViewerState();
  const { comments, addComment, deleteComment, clearComments } = useDocumentComments(null);
  const { reset: resetViewer } = viewer;
  useEffect(() => {
    resetViewer();
    clearComments();
  }, [pdfFile, resetViewer, clearComments]);
  const [showSignatureModal, setShowSignatureModal] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const openTracking = (id: string, audit = false) => {
    setTrackingId(id);
    setShowAudit(audit);
  };
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const paymentSuccess = searchParams.get("payment") === "success" || searchParams.get("reference");
    if (paymentSuccess) {
      toast.success("Payment successful! Your plan has been updated.");
    }
  }, [searchParams]);

  // Fetch Notifications
  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db, "notifications"),
      where("recipientEmail", "==", user.email),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(items);
    }, (error) => {
      console.error("Notifications error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAllRead = async () => {
    const batch = writeBatch(db);
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    unread.forEach(n => {
      batch.update(doc(db, "notifications", n.id), { read: true });
    });

    try {
      await batch.commit();
      toast.success("Notifications marked as read");
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Free documents are counted when a signed copy is downloaded, not on upload.
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isWord = file.name.match(/\.(doc|docx)$/i) ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isPDF) {
      setPdfFile(file);
      setSignature(null);
      setPlacedItems([]);
      startDraft(file);
    } else if (isWord) {
      const toastId = toast.loading("Converting Word document to PDF...");
      try {
        const pdfBlob = await convertWordToPDF(file);
        const convertedFile = new File([pdfBlob], file.name.replace(/\.(doc|docx)$/i, '.pdf'), { type: 'application/pdf' });

        setPdfFile(convertedFile);
        setSignature(null);
        setPlacedItems([]);
        startDraft(convertedFile);
        toast.success("Document converted successfully", { id: toastId });
      } catch (error) {
        console.error("Conversion error:", error);
        toast.error("Failed to convert document. Please ensure you have a stable connection and try again.", { id: toastId });
      }
    } else {
      toast.error("Unsupported file format. Please upload PDF or Word documents.");
    }
  };

  const startDraft = async (file: File) => {
    setDraftId(null);
    if (!user?.uid) return;
    if (file.size > MAX_DRAFT_BYTES) {
      setSaveState('error');
      toast.info("This file is too large to save as a draft. Finish it in one go, or use a smaller file.");
      return;
    }
    setSaveState('saving');
    try {
      setDraftId(await createDraft(user.uid, file));
      setSaveState('saved');
    } catch (err) {
      console.warn('Could not save draft:', err);
      setSaveState('error');
    }
  };

  // Autosave the placed fields shortly after each change.
  useEffect(() => {
    if (!draftId) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    setSaveState('saving');
    const timer = setTimeout(() => {
      saveDraftItems(draftId, placedItems)
        .then((ok) => setSaveState(ok ? 'saved' : 'error'))
        .catch((err) => {
          console.warn('Draft autosave failed:', err);
          setSaveState('error');
        });
    }, 1000);
    return () => clearTimeout(timer);
  }, [placedItems, draftId]);

  /** The document is finished (downloaded or sent), so it's no longer a draft. */
  const finishDraft = () => {
    const id = draftIdRef.current;
    if (!id) return;
    setDraftId(null);
    setSaveState('idle');
    deleteDraft(id).catch((err) => console.warn('Could not remove finished draft:', err));
  };

  const openDraft = async (d: Draft) => {
    setOpeningDraftId(d.id);
    try {
      const file = await loadDraftFile(d);
      skipNextSaveRef.current = true;
      setPdfFile(file);
      setSignature(null);
      setInitials(null);
      setPlacedItems(d.placedItems ?? []);
      setDraftId(d.id);
      setSaveState('saved');
    } catch (err) {
      console.error('Could not open draft:', err);
      toast.error("This draft couldn't be opened. It may be incomplete. You can delete it and upload the file again.");
    } finally {
      setOpeningDraftId(null);
    }
  };

  const handleDeleteDraft = async (d: Draft) => {
    if (!window.confirm(`Delete the draft "${d.name}"? This can't be undone.`)) return;
    try {
      await deleteDraft(d.id);
      toast.success('Draft deleted');
    } catch (err) {
      console.error('Could not delete draft:', err);
      toast.error('Could not delete the draft. Please try again.');
    }
  };

  const handleModalSave = (signatureData: string, signatureType: "draw" | "type" | "upload") => {
    const isInitials = showSignatureModal === 'initials';
    if (isInitials) {
      setInitials(signatureData);
      setActiveStampType('initials');
    } else {
      setSignature(signatureData);
      setActiveStampType('signature');
    }
    // Put it on the page straight away so the user sees it; they can drag it into position.
    setPlacedItems(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      type: isInitials ? 'initials' : 'signature',
      data: signatureData,
      x: 50,
      y: 50,
      page: viewer.page,
      scale: 1,
    }]);
    toast.success(
      isInitials
        ? 'Initials added to the page. Drag them into place, or click elsewhere on the document to add more.'
        : 'Signature added to the page. Drag it into place, or click elsewhere on the document to add more.'
    );
    setIsPlacingSignature(true);
    setShowSignatureModal(null);
  };

  const handleItemPlace = (item: any) => {
    const newItem = { ...item, id: Math.random().toString(36).substring(7) };
    setPlacedItems(prev => [...prev, newItem]);
    setIsPlacingSignature(false); // Only deselect the tool, don't clear signature data
    toast.success('Item placed!');
  };

  const handleItemUpdate = (id: string, updates: any) => {
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleItemDelete = (id: string) => {
    setPlacedItems(prev => prev.filter(item => item.id !== id));
    toast.success('Item removed');
  };

  const handleDownload = async () => {
    if (!pdfFile || placedItems.length === 0) {
      toast.error('Please upload a document and place at least one item.');
      return;
    }

    setIsDownloading(true);
    try {
      // Dynamically import PDF utils only when the user clicks download
      const { embedItemsInPDF, downloadPDF } = await import('@/lib/pdfUtils');

      const signedPdfBytes = await embedItemsInPDF(pdfFile, placedItems);

      if (signedPdfBytes) {
        // Counts against the free documents (a no-op on paid plans); refused once they're used up.
        const credit = FREE_LIMIT_ENFORCED ? await tryClaimDocumentCredit('download') : null;
        if (credit && !credit.paid) setFreeUsed(credit.freeUsed);
        downloadPDF(signedPdfBytes, `signed_${pdfFile.name}`);
        finishDraft();
        toast.success(
          !credit || credit.paid ? 'Signed document downloaded!'
            : credit.remaining === 0 ? "Signed document downloaded! That was your last free document."
            : `Signed document downloaded! ${credit.remaining} free document${credit.remaining === 1 ? '' : 's'} left.`
        );
      }

      // Increment document count
      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
          documentsSigned: increment(1)
        });
      }
    } catch (error) {
      if (isOutOfFreeDocuments(error)) {
        setFreeUsed(FREE_DOCUMENT_LIMIT);
        setShowUpgrade(true);
      } else {
        console.error('Error downloading PDF:', error);
        toast.error('Failed to download signed document. Please try again.');
      }
    }
    setIsDownloading(false);
  };

  // Bakes the placed fields into the PDF so the people invited sign the already-signed copy.
  const handleInviteOthers = async () => {
    if (!pdfFile) return;
    setIsPreparingInvite(true);
    try {
      const { embedItemsInPDF } = await import('@/lib/pdfUtils');
      const bytes = await embedItemsInPDF(pdfFile, placedItems);
      const baseName = pdfFile.name.replace(/\.pdf$/i, '');
      const signedFile = new File([bytes as BlobPart], `${baseName}.pdf`, { type: 'application/pdf' });
      setInviteDocument({ title: baseName, category: 'Signed upload', description: '', content: '', fields: [], file: signedFile });
      setShowFinishChoice(false);
    } catch (error) {
      console.error('Error preparing document for signers:', error);
      toast.error('Could not prepare the document. Please try again.');
    } finally {
      setIsPreparingInvite(false);
    }
  };

  const handleReset = () => {
    // Save the latest fields straight away rather than waiting for the autosave timer.
    const id = draftIdRef.current;
    if (id) {
      saveDraftItems(id, placedItems).catch((err) => console.warn('Could not save draft on close:', err));
      toast.success('Saved to your drafts. Continue any time from the dashboard.');
    }
    setDraftId(null);
    setSaveState('idle');
    setPdfFile(null);
    setSignature(null);
    setInitials(null);
    setPlacedItems([]);
    setActiveStampType(null);
    setIsPlacingSignature(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };


  const handleDeleteDoc = async (e: React.MouseEvent, r: SignatureRecord) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${r.name}"? The signing link will stop working.`)) return;
    try {
      await deleteDoc(doc(db, 'documents', r.id));
      if (trackingId === r.id) setTrackingId(null);
      toast.success('Document deleted');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(`Failed to delete document: ${error.message || 'Unknown error'}`);
    }
  };

  const handleHiddenFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
      e.target.value = '';
    }
  };

  // ---- New Document upload modal state ----
  const [showUploadModal, setShowUploadModal] = useState(false);
  // ---- Agreement checkbox state ----
  const [agreedToTerms, setAgreedToTerms] = useState(false);


  const handleNewDocumentClick = () => {
    setShowUploadModal(true);
  };

  const handleUploadModalFileSelect = async (file: File) => {
    setShowUploadModal(false);
    await handleFileSelect(file);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  // ---- Endorse-style document editing view ----

  if (pdfFile) {
    return (
      <div className="h-screen flex flex-col bg-[#f5f5f5] font-sans overflow-hidden">
        {/* Top Bar - Brand Color #0A66C2 */}
        <header className="h-14 bg-[#0A66C2] text-white flex items-center justify-between gap-2 px-3 sm:px-6 shrink-0 z-50 shadow-md">
          <div className="flex min-w-0 items-center gap-4">
            {/* The logo's blue lettering needs a light backing on the blue bar. */}
            <Link to="/" aria-label="Endorse home" className="flex h-9 items-center rounded-lg bg-white px-2 shadow-sm">
              <Logo className="h-7" />
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {draftId && saveState !== 'idle' && (
              <span className="hidden text-xs text-white/80 sm:inline" aria-live="polite">
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Draft saved' : "Couldn't save draft"}
              </span>
            )}
            <button
              className={`min-h-[40px] whitespace-nowrap font-extrabold text-sm px-4 sm:px-5 rounded-full transition-all shadow-sm ${
                placedItems.length > 0
                  ? 'bg-[#FFC83D] text-black hover:bg-[#e6b435] hover:scale-105'
                  : 'bg-white/20 text-white/70 hover:bg-white/30'
              }`}
              onClick={() => {
                if (placedItems.length === 0) {
                  toast.info("Place at least one field on the document first.");
                } else {
                  setShowFinishChoice(true);
                }
              }}
            >
              Finish Document
            </button>
            <button
              onClick={handleReset}
              className="flex h-10 w-10 items-center justify-center hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
              title="Close editor"
              aria-label="Close editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - FIELDS */}
          <aside className="hidden w-44 bg-white border-r border-gray-200 md:flex flex-col shrink-0 overflow-y-auto">
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-[11px] font-extrabold text-gray-700 tracking-widest uppercase">Fields</h2>
            </div>

            {/* Signature Fields Group */}
            <div className="px-2 pb-2 space-y-0.5">
              {[
                { label: "Signature", icon: PenTool, type: "signature" as const, onClick: () => setShowSignatureModal("signature") },
                { label: "Initial", icon: Type, type: "initials" as const, onClick: () => setShowSignatureModal("initials") },
                { label: "Stamp", icon: Stamp, type: "stamp" as const, onClick: () => setActiveStampType("stamp") },
                { label: "Date Signed", icon: Calendar, type: "date" as const, onClick: () => setActiveStampType("date") },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left group ${
                      activeStampType === item.type ? 'bg-[#0A66C2]/10 text-[#0A66C2] font-bold' : 'hover:bg-gray-100 text-slate-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-slate-700 group-hover:text-[#0A66C2] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="mx-4 my-2 border-t border-gray-200"/>

            {/* Text / Info Fields Group */}
            <div className="px-2 pb-4 space-y-0.5">
              {[
                { label: "Full Name", icon: User, type: "name" as const },
                { label: "First Name", icon: UserSquare, type: "firstname" as const },
                { label: "Last Name", icon: UserCircle, type: "lastname" as const },
                { label: "Email Address", icon: Mail, type: "email" as const },
                { label: "Company", icon: Briefcase, type: "company" as const },
                { label: "Title", icon: FileText, type: "jobtitle" as const },
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.label + idx}
                    onClick={() => setActiveStampType(item.type)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left group ${
                      activeStampType === item.type ? 'bg-[#0A66C2]/10 text-[#0A66C2] font-bold' : 'hover:bg-gray-100 text-slate-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-slate-700 group-hover:text-[#0A66C2] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}

              <div className="mx-1 my-1 border-t border-gray-200"/>

              <button
                onClick={() => setActiveStampType("text")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left group ${
                  activeStampType === "text" ? 'bg-[#0A66C2]/10 text-[#0A66C2] font-bold' : 'hover:bg-gray-100 text-slate-700'
                }`}
              >
                <Type className="w-4 h-4 text-slate-700 group-hover:text-[#0A66C2] shrink-0" />
                <span>Text</span>
              </button>
            </div>

            {/* Sidebar Footer space */}
            <div className="mt-auto px-4 py-2" />
          </aside>

          {/* Main Document Area */}
          <main className="flex-1 overflow-auto bg-[#e8e8e8] flex items-start justify-center p-2 pb-24 sm:p-4 sm:pb-24 md:p-8">
            <div className="bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] w-full max-w-3xl md:min-h-[1000px] relative">
              <div className="hidden sm:block px-6 py-4 border-b border-gray-100 bg-gray-50/60 text-xs text-gray-400">
                Endorse Envelope ID: {Date.now().toString(16).toUpperCase()}-{Math.random().toString(16).slice(2,10).toUpperCase()}
              </div>
              <div className="p-2 sm:p-4">
                <Suspense fallback={
                  <div className="h-[600px] flex items-center justify-center bg-muted/10 rounded-lg">
                    Loading document...
                  </div>
                }>
                  <PDFViewer
                    file={pdfFile}
                    activeStamp={
                      activeStampType === "signature" && signature
                        ? { type: "signature", data: signature }
                        : activeStampType === "initials" && initials
                        ? { type: "signature", data: initials }
                        : activeStampType === "date"
                        ? { type: "text", data: new Date().toLocaleDateString() }
                        : activeStampType === "stamp"
                        ? { type: "text", data: "APPROVED" }
                        : activeStampType === "name"
                        ? { type: "text", data: user?.displayName || user?.email?.split('@')[0] || "Full Name" }
                        : activeStampType === "firstname"
                        ? { type: "text", data: user?.displayName?.split(' ')[0] || "First Name" }
                        : activeStampType === "lastname"
                        ? { type: "text", data: user?.displayName?.split(' ').slice(1).join(' ') || "Last Name" }
                        : activeStampType === "email"
                        ? { type: "text", data: user?.email || "Email Address" }
                        : activeStampType === "company"
                        ? { type: "text", data: "Company Name" }
                        : activeStampType === "jobtitle"
                        ? { type: "text", data: "Title" }
                        : activeStampType === "text"
                        ? { type: "text", data: "Text" }
                        : null
                    }
                    placedItems={placedItems}
                    onItemPlace={handleItemPlace}
                    onItemUpdate={handleItemUpdate}
                    onItemDelete={handleItemDelete}
                    zoom={viewer.zoom}
                    page={viewer.page}
                    onPageChange={viewer.setPage}
                    onDocumentLoad={viewer.setNumPages}
                    searchQuery={viewer.panel === 'search' ? viewer.searchQuery : ''}
                    comments={comments}
                    activeCommentId={viewer.activeCommentId}
                    onCommentClick={(id) => {
                      viewer.setPanel('comments');
                      viewer.setActiveCommentId(id);
                    }}
                    commentMode={viewer.commentMode}
                    onCommentPlace={(pos) => {
                      viewer.setPendingComment(pos);
                      viewer.setCommentMode(false);
                    }}
                  />
                </Suspense>
              </div>
            </div>
          </main>

          {/* Right Sidebar: document tools */}
          <DocumentTools
            viewer={viewer}
            file={pdfFile}
            documentName={pdfFile.name}
            comments={comments}
            onAddComment={(text, pos) =>
              addComment({
                text,
                ...pos,
                authorUid: user?.uid ?? '',
                authorName: user?.displayName || user?.email || 'You',
              })
            }
            onDeleteComment={deleteComment}
            canDeleteComment={() => true}
            footer={
              <button
                className="flex flex-col items-center gap-1.5 group mt-auto"
                onClick={handleReset}
              >
                <div className="w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-[10px] text-gray-500 group-hover:text-red-500">Close</span>
              </button>
            }
          >
            <button
              className="flex flex-col items-center gap-1.5 group"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <div className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <Download className="w-5 h-5 text-black" />
              </div>
              <span className="text-[10px] text-gray-700 group-hover:text-black">{isDownloading ? "..." : "Download"}</span>
            </button>

            <button className="flex flex-col items-center gap-1.5 group" onClick={() => window.print()}>
              <div className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <Printer className="w-5 h-5 text-black" />
              </div>
              <span className="text-[10px] text-gray-700 group-hover:text-black">Print</span>
            </button>
          </DocumentTools>
        </div>

        {/* Phones: fields as a scrollable bar along the bottom */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden"
          aria-label="Fields"
        >
          <div className="flex gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none]">
            {([
              { label: "Signature", icon: PenTool, type: "signature", onClick: () => setShowSignatureModal("signature") },
              { label: "Initial", icon: Type, type: "initials", onClick: () => setShowSignatureModal("initials") },
              { label: "Date", icon: Calendar, type: "date", onClick: () => setActiveStampType("date") },
              { label: "Name", icon: User, type: "name", onClick: () => setActiveStampType("name") },
              { label: "Email", icon: Mail, type: "email", onClick: () => setActiveStampType("email") },
              { label: "Text", icon: Type, type: "text", onClick: () => setActiveStampType("text") },
              { label: "Company", icon: Briefcase, type: "company", onClick: () => setActiveStampType("company") },
              { label: "Title", icon: FileText, type: "jobtitle", onClick: () => setActiveStampType("jobtitle") },
              { label: "Stamp", icon: Stamp, type: "stamp", onClick: () => setActiveStampType("stamp") },
            ] as const).map((f) => {
              const active = activeStampType === f.type;
              return (
                <button
                  key={f.label}
                  onClick={f.onClick}
                  className={`flex min-h-[48px] min-w-[64px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-semibold transition-colors ${
                    active ? 'bg-[#0A66C2] text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <f.icon className="h-4 w-4" />
                  {f.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Footer */}
        <footer className="hidden h-8 bg-white border-t border-gray-200 md:flex items-center justify-between px-6 text-[10px] text-gray-500 shrink-0">
          <div className="font-medium">
            <span className="flex items-center gap-1.5">Powered by <Logo className="h-4" /></span>
          </div>
          <div className="flex gap-4 items-center">
            <span className="cursor-pointer hover:text-gray-700">English (US) ▾</span>
            <span className="cursor-pointer hover:text-gray-700 hidden sm:inline">Terms of Use</span>
            <span className="cursor-pointer hover:text-gray-700 hidden sm:inline">Privacy</span>
          </div>
          <div className="hidden md:block">
            Copyright © {new Date().getFullYear()} Endorse, Inc. All rights reserved
          </div>
        </footer>

        {/* Finish: download, or send to others to sign */}
        {showFinishChoice && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4" onClick={() => setShowFinishChoice(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="finish-title"
              className="w-full max-w-md rounded-t-xl bg-white p-5 shadow-xl sm:rounded-xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="finish-title" className="text-lg font-semibold text-slate-900">Does anyone else need to sign?</h2>
              <p className="mt-1.5 text-sm text-slate-600">
                You can send <span className="font-medium text-slate-900">{pdfFile.name}</span> to others to sign, or download your signed copy now.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="h-10 text-sm"
                  disabled={isDownloading}
                  onClick={() => {
                    setShowFinishChoice(false);
                    handleDownload();
                  }}
                >
                  No, just download
                </Button>
                <Button
                  className="h-10 bg-[#0A66C2] text-sm font-medium text-white hover:bg-[#08519c]"
                  disabled={isPreparingInvite}
                  onClick={handleInviteOthers}
                >
                  {isPreparingInvite ? 'Preparing…' : 'Yes, send to others'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {inviteDocument && (
          <SendAgreementModal
            template={inviteDocument}
            lockDocument
            comments={comments}
            onClose={() => setInviteDocument(null)}
            onSuccess={() => {
              finishDraft();
              toast.success('Sent! Follow its progress under Recent documents on your dashboard.');
            }}
          />
        )}

        <UpgradeDialog open={showUpgrade} onClose={() => setShowUpgrade(false)} />

        {/* Signature Modal */}
        {showSignatureModal && (
          <SignatureModal
            document={{
              id: 'temp',
              name: pdfFile.name,
              status: 'pending',
              signature_data: null,
              signature_type: null,
            }}
            onClose={() => setShowSignatureModal(null)}
            onSave={handleModalSave}
            kind={showSignatureModal === "initials" ? "initials" : "signature"}
          />
        )}
      </div>
    );
  }


  // Signed-in navigation: the shared APP_NAV items plus Settings (and Branding for business/admin),
  // so the dashboard menu matches the AppHeader used on every other app page.
  const renderAppNav = (onNavigate?: () => void) => {
    const items = [
      ...APP_NAV,
      { label: 'Settings', to: '/settings', icon: Settings },
      ...((isAdmin || userProfile?.plan === 'business')
        ? [{ label: 'Branding', to: '/settings?tab=branding', icon: Palette }]
        : []),
    ];
    return (
      <nav className="space-y-1" aria-label="App">
        {items.map(({ label, to, icon: Icon }) => {
          const active = to === '/dashboard';
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                active ? 'bg-[#0A66C2]/10 text-[#0A66C2]' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-16">
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden h-10 w-10 -ml-2" aria-label="Open menu" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5 text-black" />
            </Button>
            <Link to="/dashboard" aria-label="Endorse dashboard" className="flex items-center">
              <Logo className="h-9 md:h-10 w-auto" />
            </Link>
            {loadingDocs && null}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme" className="w-10 h-10 p-0 hidden md:inline-flex">
              {theme === 'light' ? <Moon className="h-5 w-5 text-black" /> : <Sun className="h-5 w-5 text-black" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Help" className="w-10 h-10 hidden md:inline-flex">
                  <HelpCircle className="h-5 w-5 text-black" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-black" />
                    Documentation
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center">
                    <LifeBuoy className="mr-2 h-4 w-4 text-black" />
                    Support
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center">
                    <Terminal className="mr-2 h-4 w-4 text-black" />
                    API Reference
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative w-10 h-10">
                  <Bell className="h-5 w-5 text-black" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 border border-background" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                  <span className="font-semibold text-sm">Notifications</span>
                  <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary" onClick={handleMarkAllRead}>Mark all as read</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem key={notif.id} className="px-4 py-3 cursor-pointer flex flex-col items-start gap-1">
                      <div className="flex items-center justify-between w-full">
                        <span className={`font-medium text-sm ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message || notif.desc}</p>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" aria-label="Account menu" className="flex h-10 items-center gap-2 pl-0 hover:bg-transparent md:hover:bg-accent">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center overflow-hidden border border-border ml-2">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-medium text-xs text-accent-foreground">
                        {initialsOf(user?.displayName || userProfile?.displayName, user?.email)}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {user?.displayName || user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50 text-black" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4 text-black" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4 text-destructive" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto border-r bg-white p-4 shadow-lg animate-in slide-in-from-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pl-2">
              <Link to="/dashboard" aria-label="Endorse dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Logo className="h-8 w-auto" />
              </Link>
              <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Close menu" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5 text-black" />
              </Button>
            </div>
            {renderAppNav(() => setIsMobileMenuOpen(false))}
            <div className="mt-auto pt-8">
              {renderPlanCard()}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 flex items-start gap-6 lg:gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6 sticky top-24 text-sm">
          {renderAppNav()}

          {renderPlanCard('bg-white shadow-sm border-gray-200')}
        </aside>

        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Welcome & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-sm text-gray-500">Sign a document, invite others to sign, and follow each one until it's done.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="h-10 bg-white text-sm font-semibold" aria-label="Settings" onClick={() => navigate('/settings')}>
                  <Settings className="md:mr-1.5 h-4 w-4 text-black" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
                <Button
                  className="h-10 flex-1 sm:flex-none bg-[#FFC83D] hover:bg-[#e6b435] text-black font-semibold text-sm"
                  onClick={handleNewDocumentClick}
                >
                  <Plus className="mr-1.5 h-4 w-4 text-black" />
                  <span>New Document</span>
                </Button>
              </div>
            </div>

            {/* Waiting for the user's own signature */}
            {received.length > 0 && (
              <div className="rounded-xl border border-[#FFC83D] bg-[#FFF8E1] p-4 md:p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <PenTool className="h-4 w-4 text-[#0A66C2]" /> Waiting for your signature
                </h2>
                <ul className="mt-2 divide-y divide-[#FFE7A3]">
                  {received.slice(0, 3).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                        <p className="truncate text-xs text-slate-600">From {r.senderName || r.adminName || r.ownerEmail}</p>
                      </div>
                      <Button asChild size="sm" className="h-9 shrink-0 bg-[#0A66C2] text-xs text-white hover:bg-[#08519c]">
                        <Link to={`/sign/${r.id}`}>
                          Review &amp; sign <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { label: 'Waiting on you', value: stats.waitingOnYou, note: 'Need your signature', icon: PenTool, tone: stats.waitingOnYou > 0 ? 'text-[#0A66C2]' : 'text-gray-900' },
                { label: 'Waiting on others', value: stats.awaiting, note: 'Sent, not signed yet', icon: AlertCircle, tone: stats.awaiting > 0 ? 'text-orange-600' : 'text-gray-900' },
                { label: 'Completed', value: stats.completed, note: 'Signed and done', icon: FileSignature, tone: 'text-gray-900' },
                { label: 'Sent', value: stats.total, note: 'All documents sent', icon: Send, tone: 'text-gray-900' },
              ].map(({ label, value, note, icon: Icon, tone }) => (
                <Card key={label} className="bg-white shadow-sm border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-5 md:pb-2">
                    <CardTitle className="text-xs md:text-sm font-medium text-gray-600">{label}</CardTitle>
                    <Icon className="h-3 w-3 md:h-4 md:w-4 text-black" />
                  </CardHeader>
                  <CardContent className="p-3 pt-0 md:p-5 md:pt-0">
                    <div className={`text-xl md:text-2xl font-bold ${tone}`}>{loadingDocs ? '–' : value}</div>
                    <p className="text-xs text-gray-500 mt-1 hidden md:block">{note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Business Features Section */}
            {(isAdmin || userProfile?.plan === 'business') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Business Center</h2>
                  <span className="px-2 py-0.5 bg-[#0A66C2]/10 text-[#0A66C2] text-xs font-bold rounded-full uppercase tracking-wider">Business Plan</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => navigate('/team')}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-lg group-hover:bg-[#0A66C2] group-hover:text-white transition-colors">
                          <Users className="w-5 h-5" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                      <CardTitle className="text-base mt-4">Send for Signature</CardTitle>
                      <CardDescription>Send documents for signature, track status, and invite teammates.</CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => navigate('/settings?tab=branding')}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-[#FFC83D]/25 text-slate-900 rounded-lg group-hover:bg-[#FFC83D] transition-colors">
                          <Palette className="w-5 h-5" />
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                      <CardTitle className="text-base mt-4">Custom Branding</CardTitle>
                      <CardDescription>Upload your logo and set theme colors.</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors shadow-none">
              <CardContent className="pt-6">
                <PDFUploader onFileSelect={handleFileSelect} currentFile={pdfFile} />
              </CardContent>
            </Card>

            {/* Drafts */}
            {drafts.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="font-semibold text-gray-900">Drafts</h2>
                  <p className="mt-0.5 text-xs text-gray-500">Documents you've started but not finished. Your fields are saved as you work.</p>
                </div>
                <ul className="divide-y divide-gray-100">
                  {drafts.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 p-3 md:px-6 md:py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{d.name}</p>
                        <p className="text-xs text-gray-500">
                          Edited {editedAgo(d.updatedAt)}
                          {d.placedItems?.length ? ` · ${d.placedItems.length} field${d.placedItems.length === 1 ? '' : 's'} placed` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 text-sm text-gray-600 hover:text-red-600"
                          onClick={() => handleDeleteDraft(d)}
                          aria-label={`Delete draft ${d.name}`}
                        >
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          className="h-9 bg-[#0A66C2] text-sm text-white hover:bg-[#08519c]"
                          onClick={() => openDraft(d)}
                          disabled={openingDraftId === d.id}
                        >
                          {openingDraftId === d.id ? 'Opening…' : 'Continue'}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent Documents Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-3 bg-gray-50/50">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-black" />
                    Recent documents
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">Documents you've sent for signature. Click one to see its full history.</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-primary h-9 shrink-0 text-xs">
                  <Link to="/team">View all</Link>
                </Button>
              </div>

              <div className="divide-y divide-gray-100">
                {loadingDocs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recentDocs.length === 0 ? (
                  <div className="text-center py-12 px-4 text-muted-foreground animate-in fade-in">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-700">Nothing sent yet</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs">
                      Upload a document, sign it, then choose <span className="font-semibold">Invite others to sign</span>. You'll see when they open and sign it right here.
                    </p>
                  </div>
                ) : (
                  recentDocs.map((r) => (
                    <div
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openTracking(r.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTracking(r.id); } }}
                      className="flex items-center justify-between gap-2 p-3 md:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 ${isSigned(r) ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                          {isSigned(r)
                            ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                            : <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="font-medium text-gray-900 truncate text-sm">{r.name}</h3>
                          <p className="flex items-center gap-1 truncate text-xs text-gray-500">
                            {isWhatsApp(r) && <MessageCircle className="h-3 w-3 shrink-0" />}
                            To {displayName(r)} · {formatDate(r.createdAt)}
                          </p>
                          <SigningProgress record={r} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-9 h-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={(e) => { e.stopPropagation(); openTracking(r.id, true); }}
                          title="View audit trail"
                          aria-label={`View audit trail for ${r.name}`}
                        >
                          <Activity className="w-4 h-4 text-black" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-9 h-9 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDeleteDoc(e, r)}
                          title="Delete document"
                          aria-label={`Delete ${r.name}`}
                        >
                          <Trash2 className="w-4 h-4 text-black" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">New Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5 text-black" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">Upload a PDF or Word document to start signing.</p>
              <label
                htmlFor="modal-file-upload"
                className="block w-full border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors group"
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <p className="font-semibold text-gray-700 group-hover:text-blue-600">Click to browse or drag & drop</p>
                <p className="text-sm text-gray-400 mt-1">PDF, DOC, DOCX supported</p>
                <input
                  type="file"
                  id="modal-file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadModalFileSelect(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {trackingId && (() => {
        const r = sent.find((d) => d.id === trackingId);
        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setTrackingId(null)}>
            <div className={`flex max-h-[90vh] w-full flex-col bg-background rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 ${showAudit ? 'max-w-2xl' : 'max-w-lg'}`} onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{r?.name ?? 'Document'}</h3>
                  {r && <p className="truncate text-xs text-slate-500">To {displayName(r)}{isSigned(r) ? ` · Signed ${formatDate(r.signedAt)}` : ' · Awaiting signature'}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Close" onClick={() => setTrackingId(null)}>
                  <X className="w-4 h-4 text-black" />
                </Button>
              </div>
              {!r ? (
                <p className="p-6 text-sm text-slate-500">This document is no longer available.</p>
              ) : (
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    <SigningProgress record={r} />
                    {showAudit ? (
                      <AuditTrail record={r} />
                    ) : (
                      <>
                        <SigningRecord record={r} />
                        <Button variant="outline" size="sm" className="h-9 text-sm" onClick={() => setShowAudit(true)}>
                          View audit trail
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50 px-5 py-3">
                    {!isSigned(r) ? (
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => sendReminder(r)}>
                          <Send className="mr-1.5 h-3.5 w-3.5" /> Send reminder
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(signingLink(r.id, r.channel));
                            toast.success('Signing link copied');
                          }}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link
                        </Button>
                      </div>
                    ) : <span />}
                    <Button asChild size="sm" className="bg-[#0A66C2] text-xs text-white hover:bg-[#08519c]">
                      <Link to={`/team?doc=${r.id}`}>
                        {isSigned(r) ? 'View & download' : 'Open full details'} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
