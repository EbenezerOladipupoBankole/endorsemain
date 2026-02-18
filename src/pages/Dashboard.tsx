import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, getDocs, orderBy, limit, deleteDoc, doc, onSnapshot, writeBatch, updateDoc, increment, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, functions } from '@/components/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthContext';
import { PDFUploader } from '@/components/esign/PDFUploader';
import { SignerManager } from '@/components/esign/SignerManager';
import type { Signer } from '@/components/esign/SignerManager';
import SignatureModal from '@/components/SignatureModal';
import { Logo } from '@/components/Logo';
import {
  FileSignature,
  Download,
  RefreshCw,
  LogOut,
  Loader2,
  User,
  ChevronDown,
  PenTool,
  Sun,
  Moon,
  Clock,
  MoreVertical,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Settings,
  LayoutDashboard,
  CreditCard,
  Shield,
  Menu,
  X,
  Bell,
  HelpCircle,
  MessageCircle,
  Code
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
  const { user, userProfile, loading: authLoading, signOut } = useAuth();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signaturePositions, setSignaturePositions] = useState<SignaturePosition[]>([]);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [usageCount, setUsageCount] = useState(userProfile?.documentsSigned || 0);
  const [stats, setStats] = useState({ total: 0, signed: 0, pending: 0 });
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      toast.success("Payment successful! Your plan is updated. Refreshing page...");
      // We replace the URL to prevent a refresh loop and then reload the page
      // to ensure the new user profile (with the updated plan) is fetched.
      navigate('/dashboard', { replace: true });
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Delay for user to see the toast
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const fetchRecentDocs = async () => {
      if (!user?.email) return;

      try {
        const q = query(
          collection(db, "documents"),
          where("ownerEmail", "==", user.email),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const total = docs.length;
        const signed = docs.filter((d: any) => ['signed', 'completed', 'Signed'].includes(d.status)).length;
        const pending = total - signed;

        setStats({ total, signed, pending });
        setRecentDocs(docs.slice(0, 5));
      } catch (error) {
        console.error("Error fetching recent docs:", error);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchRecentDocs();
  }, [user]);

  // Real-time listener for usage count
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setUsageCount(data.documentsSigned || 0);
        }
      }, (error) => {
        console.error("Error listening to usage count:", error);
      });
      return () => unsubscribe();
    }
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
      console.log("Notifications error:", error);
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
    // Check limits for free plan
    const isPro = userProfile?.plan === 'pro' || userProfile?.plan === 'business';
    const documentsSigned = usageCount || userProfile?.documentsSigned || 0;

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
      setSignaturePositions([]);
      setSigners([]);
    } else if (isWord) {
      const toastId = toast.loading("Converting Word document to PDF...");
      try {
        const pdfBlob = await convertWordToPDF(file);
        const convertedFile = new File([pdfBlob], file.name.replace(/\.(doc|docx)$/i, '.pdf'), { type: 'application/pdf' });

        setPdfFile(convertedFile);
        setSignature(null);
        setSignaturePositions([]);
        setSigners([]);
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
    setSignature(signatureData);
    setShowSignatureModal(false);
    toast.success('Signature created! Click on the document to place it.');
  };

  const handleSignaturePlace = (position: Omit<SignaturePosition, 'width'>) => {
    setSignaturePositions(prev => [...prev, { ...position, width: 20 }]); // Default width 20%
    toast.success('Signature placed!');
  };

  const handleSignatureMove = (position: SignaturePosition, index: number) => {
    setSignaturePositions(prev => {
      const newPositions = [...prev];
      if (index >= 0 && index < newPositions.length) {
        newPositions[index] = position;
      }
      return newPositions;
    });
  };

  const handleDownload = async () => {
    if (!pdfFile || !signature || signaturePositions.length === 0) {
      toast.error('Please upload a document and place at least one signature.');
      return;
    }

    // Check limits for free plan
    const isPro = userProfile?.plan === 'pro' || userProfile?.plan === 'business';
    const documentsSigned = usageCount || userProfile?.documentsSigned || 0;

    if (!isPro && documentsSigned >= 3) {
      toast.error("You have reached the limit of 3 free documents. Redirecting to upgrade...");
      navigate('/settings?tab=billing');
      return;
    }

    setIsDownloading(true);
    try {
      // Dynamically import PDF utils only when the user clicks download
      const { embedSignatureInPDF, downloadPDF } = await import('@/lib/pdfUtils');

      let currentFile = pdfFile;
      let signedPdfBytes = null;

      for (const position of signaturePositions) {
        signedPdfBytes = await embedSignatureInPDF(
          currentFile,
          signature,
          position
        );
        currentFile = new File([signedPdfBytes], pdfFile.name, { type: 'application/pdf' });
      }

      if (signedPdfBytes) {
        downloadPDF(signedPdfBytes, `signed_${pdfFile.name}`);
        toast.success('Signed document downloaded!');

        // Increment document count - Fire and forget to prevent blocking UI
        if (user?.uid) {
          setDoc(doc(db, "users", user.uid), {
            documentsSigned: increment(1)
          }, { merge: true }).then(() => {
          }).catch((dbError) => {
            console.error("Background update failed (non-critical):", dbError);
          });
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download signed document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleApplySignature = async () => {
    if (!pdfFile || !signature || signaturePositions.length === 0) return;

    setIsApplying(true);
    try {
      // Dynamically import PDF utils
      const { embedSignatureInPDF } = await import('@/lib/pdfUtils');

      let currentFile = pdfFile;
      let signedPdfBytes = null;

      for (const position of signaturePositions) {
        signedPdfBytes = await embedSignatureInPDF(
          currentFile,
          signature,
          position
        );
        currentFile = new File([signedPdfBytes], pdfFile.name, { type: 'application/pdf' });
      }

      if (signedPdfBytes) {
        setPdfFile(currentFile);
        setSignature(null);
        setSignaturePositions([]);
        toast.success('Signatures applied. You can now add another signature.');
      }
    } catch (error) {
      console.error('Error applying signature:', error);
      toast.error('Failed to apply signature.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setSignature(null);
    setSignaturePositions([]);
    setSigners([]);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSendInvites = async () => {
    if (!pdfFile || signers.length === 0) {
      toast.error("Please upload a document and add at least one signer.");
      return;
    }

    // Check if user is on a paid plan (Bypass for admin email or localhost)
    const isPro = userProfile?.plan === 'pro' || userProfile?.plan === 'business';
    const isAdmin = user?.email === 'bankoleebenezer111@gmail.com';
    const isLocal = window.location.hostname === 'localhost';

    if (!isPro && !isAdmin && !isLocal) {
      toast.error("Inviting signers is a Pro feature. Please upgrade your plan.");
      return;
    }

    // Firestore has a 1MB limit per document. Base64 adds ~33% overhead.
    // We limit file size to 600KB to ensure successful upload.
    if (pdfFile.size > 600 * 1024) {
      toast.error("Document is too large. Please use a file smaller than 600KB.");
      return;
    }

    const toastId = toast.loading("Processing document and sending invitations...");

    try {
      // 1. Convert PDF to Base64 (simple solution for now, ideally upload to Storage)
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(pdfFile);
      });

      // 2. Create the document in Firestore immediately
      // Wrap in a timeout to prevent hanging
      const createDocPromise = addDoc(collection(db, "documents"), {
        name: pdfFile.name,
        status: 'pending',
        ownerEmail: user?.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        pdfBase64: pdfBase64, // Storing base64 for simplicity in this demo. For prod, use Storage.
        signers: signers.map(s => ({
          email: s.email,
          role: s.role || 'signer',
          status: 'pending'
        })),
        invitedBy: user?.uid,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database operation timed out. The file might be too large or connection is slow.")), 60000)
      );

      const docRef = await Promise.race([createDocPromise, timeoutPromise]) as any;


      // 3. Send invites with the new document ID
      const sendInvites = httpsCallable(functions, 'sendSignerInvites');

      const invitePromise = sendInvites({
        signers: signers,
        documentName: pdfFile.name,
        uploaderName: user?.displayName || user?.email?.split('@')[0] || 'A user',
        uploaderEmail: user?.email,
        documentId: docRef.id, // Pass the ID effectively
        signingLink: `${window.location.origin}/sign/${docRef.id}`, // Explicit link
      });

      const inviteTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Email service timed out. Document saved, but invites might not have sent.")), 40000)
      );

      await Promise.race([invitePromise, inviteTimeoutPromise]);

      // Small delay to let user see 100%
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Invitations sent successfully!', { id: toastId });

      // Update local stats
      setStats(prev => ({ ...prev, total: prev.total + 1, pending: prev.pending + 1 }));
    } catch (error: any) {
      console.error("Error sending invitations:", error);
      let msg = "Failed to send invitations.";
      if (error?.message) msg = error.message;
      if (error?.code === 'resource-exhausted') msg = "File too large for database.";
      if (error?.code === 'permission-denied') msg = "Permission denied.";

      toast.error(msg, { id: toastId });
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };


  const handleDeleteDoc = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDoc(doc(db, "documents", docId));
        setRecentDocs((prev) => prev.filter((d) => d.id !== docId));
        toast.success("Document deleted successfully");
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Failed to delete document");
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen gradient-subtle flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 h-16">
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Logo className="h-12 md:h-16 w-auto" />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-9 h-9 p-0 hidden md:inline-flex">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 hidden md:inline-flex">
                  <HelpCircle className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Documentation
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Support
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#" className="cursor-pointer flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    API Reference
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative w-9 h-9">
                  <Bell className="w-5 h-5" />
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
                        <span className="text-[10px] text-muted-foreground">
                          {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message || notif.desc}</p>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {pdfFile && signature && signaturePositions.length > 0 && (
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="gradient-primary text-primary-foreground shadow-soft hover:shadow-medium transition-shadow"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download Signed PDF
              </Button>
            )}

            {pdfFile && (
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-0 hover:bg-transparent md:hover:bg-accent">
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
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
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
          <div className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-white p-6 shadow-lg animate-in slide-in-from-left" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <Logo className="h-8 w-auto" />
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-1">
              <Button variant="secondary" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
            <div className="mt-auto pt-8">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {userProfile?.plan === 'business' ? 'Business' : userProfile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {(userProfile?.plan === 'free' || !userProfile?.plan) && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span>Free Usage</span>
                        <span>{usageCount || userProfile?.documentsSigned || 0}/3 used</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#FFC83D] transition-all duration-500 ease-out" style={{ width: `${Math.min(((usageCount || userProfile?.documentsSigned || 0) / 3) * 100, 100)}%` }} />
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mb-3">
                    {userProfile?.plan === 'free' || !userProfile?.plan
                      ? 'Upgrade to unlock unlimited documents.'
                      : 'Your plan is active.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 flex items-start gap-8">
        {/* Sidebar - Only show when not editing a PDF */}
        {!pdfFile && (
          <aside className="hidden lg:block w-64 shrink-0 space-y-6 sticky top-24 text-sm">
            <div className="space-y-1">
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>

            <Card className="bg-white shadow-sm border-gray-200">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {userProfile?.plan === 'business' ? 'Business' : userProfile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {(userProfile?.plan === 'free' || !userProfile?.plan) && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span>Free Usage</span>
                      <span>{usageCount || userProfile?.documentsSigned || 0}/3 used</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#FFC83D] transition-all duration-500 ease-out" style={{ width: `${Math.min(((usageCount || userProfile?.documentsSigned || 0) / 3) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mb-3">
                  {userProfile?.plan === 'free' || !userProfile?.plan
                    ? 'Upgrade to unlock unlimited documents.'
                    : 'Your plan is active.'}
                </p>
              </CardContent>
            </Card>
          </aside>
        )}

        <main className="flex-1 min-w-0">
          {!pdfFile ? (
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Welcome & Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                  <p className="text-gray-500">Manage your documents and signatures.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="bg-white">
                    <Settings className="w-4 h-4 mr-2" /> Settings
                  </Button>
                  <label htmlFor="new-doc-upload-input" className="cursor-pointer">
                    <Button className="bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-medium pointer-events-none">
                      <PenTool className="w-4 h-4 mr-2" />
                      New Document
                    </Button>
                  </label>
                  <input
                    id="new-doc-upload-input"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white shadow-sm border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <p className="text-xs text-gray-500 mt-1">All documents</p>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Signed</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.signed}</div>
                    <p className="text-xs text-gray-500 mt-1">Completed documents</p>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm border-gray-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                    <p className="text-xs text-orange-600 font-medium mt-1">Action required</p>
                  </CardContent>
                </Card>
              </div>

              {/* Upload Area */}
              <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors shadow-none">
                <CardContent className="pt-6">
                  <PDFUploader onFileSelect={handleFileSelect} currentFile={pdfFile} accept=".pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                </CardContent>
              </Card>

              {/* Recent Documents Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
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
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p>No recent documents found</p>
                    </div>
                  ) : (
                    recentDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{doc.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{doc.createdAt?.seconds ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown date'}</span>
                              <span>•</span>
                              <span>{doc.ownerEmail}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 pl-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${doc.status === 'Signed' || doc.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                            doc.status === 'Pending' || doc.status === 'pending' ? 'bg-orange-500/10 text-orange-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                            {doc.status || 'Draft'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => handleDeleteDoc(e, doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* PDF Viewer */}
              <div className="lg:col-span-2">
                <div className="gradient-card rounded-2xl border border-border/50 shadow-soft overflow-hidden">
                  <div className="p-4 border-b border-border/50 bg-muted/30">
                    <h2 className="font-display font-semibold flex items-center gap-2">
                      <FileSignature className="w-5 h-5 text-primary" />
                      {pdfFile.name}
                    </h2>
                  </div>
                  <div className="p-4">
                    <Suspense fallback={
                      <div className="h-[600px] flex items-center justify-center bg-muted/10 rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    }>
                      <PDFViewer
                        file={pdfFile}
                        signatureImage={signature}
                        signaturePositions={signaturePositions}
                        onSignaturePlace={handleSignaturePlace}
                        onSignatureMove={handleSignatureMove}
                        onSignatureDelete={(index) => {
                          setSignaturePositions(prev => prev.filter((_, i) => i !== index));
                        }}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>

              {/* Signature Pad */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="border-border/60 shadow-sm">
                    <CardContent className="p-6 space-y-6">
                      <h3 className="font-semibold flex items-center gap-2"><PenTool className="w-4 h-4" /> Signature Tools</h3>
                      <Button onClick={() => setShowSignatureModal(true)} className="w-full" variant="outline">
                        <PenTool className="w-4 h-4 mr-2" />
                        Create Signature
                      </Button>
                      {signaturePositions.length > 0 && (
                        <>
                          <Button
                            className="w-full mb-2 bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleApplySignature}
                            disabled={isApplying}
                          >
                            {isApplying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Apply & Add Another
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { setSignaturePositions([]); toast.info("All signature placements have been cleared."); }}
                          >
                            Clear All Placements
                          </Button>
                        </>
                      )}
                      <Separator />
                      <SignerManager signers={signers} setSigners={setSigners} onSendInvites={handleSendInvites} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showSignatureModal && pdfFile && (
        <SignatureModal
          document={{
            id: 'temp',
            name: pdfFile.name,
            status: 'pending',
            signature_data: null,
            signature_type: null,
          }}
          onClose={() => setShowSignatureModal(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default Dashboard;
