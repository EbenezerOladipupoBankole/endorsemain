import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, getDocs, orderBy, limit, deleteDoc, doc, onSnapshot, writeBatch, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions } from '@/components/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/components/AuthContext';
import { PDFUploader } from '@/components/esign/PDFUploader';
import { AuditTrail } from '@/components/AuditTrail';
import SignatureModal from '@/components/SignatureModal';
import { SendAgreementModal } from '@/components/agreements/SendAgreementModal';
import type { AgreementTemplate } from '@/components/agreements/TemplateStudio';
import { Logo } from '@/components/Logo';
import { APP_NAV } from '@/components/AppHeader';
import { DocumentTools } from '@/components/esign/DocumentTools';
import { useViewerState, useDocumentComments } from '@/components/esign/viewerTools';
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

// Helper to convert Word to PDF via Cloud Function
const convertWordToPDF = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const convertDocument = httpsCallable(functions, 'convertDocument');

        const result = await convertDocument({
          file: base64,
          filename: file.name,
          mimeType: file.type
        });

        const data = result.data as { pdfBase64: string };
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        resolve(new Blob([byteArray], { type: 'application/pdf' }));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile, isAdmin, loading: authLoading, signOut } = useAuth();


  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [activeStampType, setActiveStampType] = useState<string | null>(null);
  const [isPlacingSignature, setIsPlacingSignature] = useState(false);
  const [placedItems, setPlacedItems] = useState<any[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, signed: 0, pending: 0 });
  const [loadingDocs, setLoadingDocs] = useState(true);
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
  const [selectedDocForAudit, setSelectedDocForAudit] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchRecentDocs = async () => {
      if (!user?.email) return;

      try {
        const getStatsFn = httpsCallable(functions, 'getUserStats');
        const getDocsFn = httpsCallable(functions, 'getUserDocuments');

        const [statsResult, docsResult] = await Promise.all([
          getStatsFn(),
          getDocsFn()
        ]);

        const statsData = statsResult.data as any;
        const docsData = docsResult.data as any;

        setStats({
          total: statsData.total || 0,
          signed: statsData.signed || 0,
          pending: statsData.pending || 0
        });
        setRecentDocs((docsData.documents || []).slice(0, 5));
      } catch (error) {
        console.error("Error fetching data from Postgres:", error);
        // Fallback to Firestore during transition if needed
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchRecentDocs();
  }, [user]);

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
    // Check limits for free plan (Bypassed: product is free for now)
    const isPro = true;
    const documentsSigned = userProfile?.documentsSigned || 0;

    if (!isPro && documentsSigned >= 3) {
      toast.error("You have reached the limit of 3 free documents. Redirecting to upgrade...");
      navigate('/settings?tab=billing');
      return;
    }

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isWord = file.name.match(/\.(doc|docx)$/i) ||
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (isPDF) {
      setPdfFile(file);
      setSignature(null);
      setPlacedItems([]);
    } else if (isWord) {
      const toastId = toast.loading("Converting Word document to PDF...");
      try {
        const pdfBlob = await convertWordToPDF(file);
        const convertedFile = new File([pdfBlob], file.name.replace(/\.(doc|docx)$/i, '.pdf'), { type: 'application/pdf' });

        setPdfFile(convertedFile);
        setSignature(null);
        setPlacedItems([]);
        toast.success("Document converted successfully", { id: toastId });
      } catch (error) {
        console.error("Conversion error:", error);
        toast.error("Failed to convert document. Please ensure you have a stable connection and try again.", { id: toastId });
      }
    } else {
      toast.error("Unsupported file format. Please upload PDF or Word documents.");
    }
  };

  const handleModalSave = (signatureData: string, signatureType: "draw" | "type" | "upload") => {
    if (showSignatureModal === 'initials') {
      setInitials(signatureData);
      setActiveStampType('initials');
      toast.success('Initials created! Click on the document to place them.');
    } else {
      setSignature(signatureData);
      setActiveStampType('signature');
      toast.success('Signature created! Click on the document to place it.');
    }
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

    // Check limits for free plan (Bypassed: product is free for now)
    const isPro = true;
    const documentsSigned = userProfile?.documentsSigned || 0;

    if (!isPro && documentsSigned >= 3) {
      toast.error("You have reached the limit of 3 free documents. Redirecting to upgrade...");
      navigate('/settings?tab=billing');
      return;
    }

    setIsDownloading(true);
    try {
      // Dynamically import PDF utils only when the user clicks download
      const { embedItemsInPDF, downloadPDF } = await import('@/lib/pdfUtils');

      const signedPdfBytes = await embedItemsInPDF(pdfFile, placedItems);

      if (signedPdfBytes) {
        downloadPDF(signedPdfBytes, `signed_${pdfFile.name}`);
        toast.success('Signed document downloaded!');
      }

      // Increment document count
      if (user?.uid) {
        await updateDoc(doc(db, "users", user.uid), {
          documentsSigned: increment(1)
        });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download signed document. Please try again.');
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


  const handleDeleteDoc = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    const toastId = toast.loading("Deleting document...");
    try {
      // 1. Delete from Postgres via Cloud Function
      const deleteDocFn = httpsCallable(functions, 'deleteDocument');
      await deleteDocFn({ documentId: docId });

      // 2. Also try to delete from Firestore if it exists there (legacy support)
      try {
        await deleteDoc(doc(db, "documents", docId));
      } catch (fErr) {
        // Silently fail if not in Firestore, as Postgres is the primary source now
      }

      // 3. Update local state
      setRecentDocs((prev) => prev.filter((d) => d.id !== docId));
      
      // 4. Update stats
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));

      toast.success("Document deleted successfully", { id: toastId });
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error(`Failed to delete document: ${error.message || "Unknown error"}`, { id: toastId });
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
            <span className="text-base font-extrabold tracking-wide text-[#FFC83D] flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-[#FFC83D] text-black font-black flex items-center justify-center text-xs shadow-sm">E</span>
              <span className="hidden sm:inline">Endorse</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
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
            Powered by <span className="font-bold text-blue-600">Endorse</span>
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

        {/* Finish: download, or invite others to sign */}
        {showFinishChoice && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={() => setShowFinishChoice(false)}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">You're done signing</h3>
                  <p className="mt-1 text-sm text-slate-500">Does anyone else need to sign {pdfFile.name}?</p>
                </div>
                <button onClick={() => setShowFinishChoice(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 grid gap-3">
                <button
                  onClick={handleInviteOthers}
                  disabled={isPreparingInvite}
                  className="flex items-start gap-3 rounded-xl border-2 border-[#0A66C2] bg-blue-50/50 p-4 text-left transition-colors hover:bg-blue-50 disabled:opacity-60"
                >
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#0A66C2]" />
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{isPreparingInvite ? 'Preparing…' : 'Invite others to sign'}</span>
                    <span className="block text-xs text-slate-600">Send it by email or WhatsApp. They sign on Endorse and you get the completed copy.</span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    setShowFinishChoice(false);
                    handleDownload();
                  }}
                  disabled={isDownloading}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  <Download className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
                  <span>
                    <span className="block text-sm font-bold text-slate-900">Just download the signed PDF</span>
                    <span className="block text-xs text-slate-600">No one else needs to sign.</span>
                  </span>
                </button>
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
            onSuccess={() => setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }))}
          />
        )}

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
                        {user?.email?.substring(0, 2).toUpperCase()}
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
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-black" />
                    {isAdmin ? 'Business' : userProfile?.plan === 'business' ? 'Business' : userProfile?.plan === 'pro' ? 'Pro Plan' : 'Free Tier (Unlimited)'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    All features are free! Enjoy unlimited documents.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 flex items-start gap-6 lg:gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6 sticky top-24 text-sm">
          {renderAppNav()}

          <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-black" />
                {isAdmin ? 'Business' : userProfile?.plan === 'business' ? 'Business' : userProfile?.plan === 'pro' ? 'Pro Plan' : 'Free Tier (Unlimited)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-xs text-muted-foreground mb-3">
                All features are free! Enjoy unlimited documents.
              </p>
            </CardContent>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Welcome & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-sm text-gray-500">Manage your documents and signatures.</p>
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

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Total</CardTitle>
                  <FileText className="h-3 w-3 md:h-4 md:w-4 text-black" />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.total}</div>
                  <p className="text-xs text-gray-500 mt-1 hidden md:block">All documents</p>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Signed</CardTitle>
                  <FileSignature className="h-3 w-3 md:h-4 md:w-4 text-black" />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.signed}</div>
                  <p className="text-xs text-gray-500 mt-1 hidden md:block">Completed</p>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-sm border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Pending</CardTitle>
                  <AlertCircle className="h-3 w-3 md:h-4 md:w-4 text-black" />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-xl md:text-2xl font-bold text-gray-900">{stats.pending}</div>
                  <p className="text-xs text-orange-600 font-medium mt-1 hidden md:block">Action required</p>
                </CardContent>
              </Card>
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

            {/* Recent Documents Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black" />
                  Recent Documents
                </h2>
                <Button variant="ghost" size="sm" className="text-primary h-8 text-xs">View All</Button>
              </div>

              <div className="divide-y divide-gray-100">
                {loadingDocs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recentDocs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground animate-in fade-in">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>No recent documents found</p>
                  </div>
                ) : (
                  recentDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate text-sm">{doc.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                            <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              doc.status === 'completed' ? 'bg-green-100 text-green-700' :
                              doc.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {doc.status || 'draft'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={(e) => { e.stopPropagation(); setSelectedDocForAudit(doc.id); }}
                          title="View Audit Trail"
                        >
                          <Activity className="w-4 h-4 text-black" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDeleteDoc(e, doc.id)}
                          title="Delete document"
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

      {selectedDocForAudit && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDocForAudit(null)}>
          <div className="w-full max-w-lg bg-background rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">Document Audit Trail</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDocForAudit(null)}>
                <X className="w-4 h-4 text-black" />
              </Button>
            </div>
            <div className="p-6">
              <AuditTrail documentId={selectedDocForAudit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
