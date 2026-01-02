import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { collection, query, where, getDocs, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/components/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/AuthContext';
import { PDFUploader } from '@/components/esign/PDFUploader';
import { PDFViewer } from '@/components/esign/PDFViewer';
import { SignerManager } from '@/components/esign/SignerManager';
import type { Signer } from '@/components/esign/SignerManager';
import { embedSignatureInPDF, downloadPDF } from '@/lib/pdfUtils';
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
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading, signOut } = useAuth();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
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
    const fetchRecentDocs = async () => {
      if (!user?.email) return;
      
      try {
        const q = query(
          collection(db, "documents"),
          where("ownerEmail", "==", user.email),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRecentDocs(docs);
      } catch (error) {
        console.error("Error fetching recent docs:", error);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchRecentDocs();
  }, [user]);

  const handleFileSelect = (file: File) => {
    setPdfFile(file);
    setSignature(null);
    setSignaturePosition(null);
    setSigners([]);
  };

  const handleModalSave = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignatureModal(false);
    toast.success('Signature created! Click on the document to place it.');
  };

  const handleSignaturePlace = (position: SignaturePosition) => {
    setSignaturePosition(position);
    toast.success('Signature placed! You can drag to reposition.');
  };

  const handleSignatureMove = (position: SignaturePosition) => {
    setSignaturePosition(position);
  };

  const handleDownload = async () => {
    if (!pdfFile || !signature || !signaturePosition) {
      toast.error('Please upload a document and place your signature first.');
      return;
    }

    setIsDownloading(true);
    try {
      const signedPdfBytes = await embedSignatureInPDF(
        pdfFile,
        signature,
        signaturePosition
      );
      
      downloadPDF(signedPdfBytes, `signed_${pdfFile.name}`);
      toast.success('Signed document downloaded!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download signed document. Please try again.');
    }
    setIsDownloading(false);
  };

  const handleReset = () => {
    setPdfFile(null);
    setSignature(null);
    setSignaturePosition(null);
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

    // Check if user is on a paid plan
    if (userProfile?.plan !== 'pro' && userProfile?.plan !== 'business') {
      toast.error("Inviting signers is a Pro feature. Please upgrade your plan.");
      return;
    }

    const promise = async () => {
      const functions = getFunctions();
      const sendInvites = httpsCallable(functions, 'sendSignerInvites');
      
      await sendInvites({
        signers: signers,
        documentName: pdfFile.name,
        uploaderName: user?.email?.split('@')[0] || 'A user',
        uploaderEmail: user?.email,
        signingLink: `${window.location.origin}/dashboard`,
      });
    };

    toast.promise(promise(), {
      loading: 'Sending invitations...',
      success: 'Invitations sent successfully!',
      error: (err) => {
        console.error("Firebase function error:", err);
        return "Failed to send invitations. Please try again.";
      },
    });
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
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden mr-2" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Logo className="h-16 w-auto" />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-9 h-9 p-0">
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            {pdfFile && signature && signaturePosition && (
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
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <User className="w-4 h-4 text-accent-foreground" />
                  </div>
                  <span className="hidden md:inline text-sm font-medium">
                    {user?.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings?tab=profile" className="cursor-pointer w-full flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
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
          <div className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-card p-6 shadow-lg animate-in slide-in-from-left" onClick={(e) => e.stopPropagation()}>
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
              <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                <Link to="/settings?tab=profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setIsMobileMenuOpen(false)}>
                <Link to="/settings?tab=billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
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
                  <p className="text-xs text-muted-foreground mb-3">
                    {userProfile?.plan === 'free' || !userProfile?.plan 
                      ? 'Upgrade to unlock unlimited documents.' 
                      : 'Your plan is active.'}
                  </p>
                  <Button size="sm" className="w-full text-xs" variant="outline" asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link to="/settings?tab=billing">Manage Plan</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 flex items-start gap-8">
        {/* Sidebar - Only show when not editing a PDF */}
        {!pdfFile && (
          <aside className="hidden lg:block w-64 shrink-0 space-y-6 sticky top-24">
            <div className="space-y-1">
              <Button variant="secondary" className="w-full justify-start" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/settings?tab=profile">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/settings?tab=billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {userProfile?.plan === 'business' ? 'Business' : userProfile?.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {userProfile?.plan === 'free' || !userProfile?.plan 
                    ? 'Upgrade to unlock unlimited documents.' 
                    : 'Your plan is active.'}
                </p>
                <Button size="sm" className="w-full text-xs" variant="outline" asChild>
                <Link to="/settings?tab=billing">Manage Plan</Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        )}

        <main className="flex-1 min-w-0">
        {!pdfFile ? (
          <div className="max-w-4xl mx-auto">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Signed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">66% completion rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">Action required</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-bold mb-2">Upload Your Document</h1>
              <p className="text-muted-foreground">
                Select a PDF file to get started with signing
              </p>
            </div>
            <PDFUploader onFileSelect={handleFileSelect} currentFile={pdfFile} />
            
            {/* Recent Documents Section */}
            <div className="mt-12">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Documents
              </h2>
              <div className="grid gap-4">
                {loadingDocs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recentDocs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                    No recent documents found
                  </div>
                ) : (
                  recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.createdAt?.seconds 
                            ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString() 
                            : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === 'Signed' || doc.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        doc.status === 'Pending' || doc.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {doc.status || 'Draft'}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
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
                  <PDFViewer
                    file={pdfFile}
                    signatureImage={signature}
                    signaturePosition={signaturePosition}
                    onSignaturePlace={handleSignaturePlace}
                    onSignatureMove={handleSignatureMove}
                  />
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
                  {signature && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => { setSignature(null); setSignaturePosition(null); toast.info("Signature cleared"); }}
                    >
                      Clear Current Signature
                    </Button>
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
