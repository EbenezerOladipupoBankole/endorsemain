import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/AuthContext';
import { PDFUploader } from '@/components/esign/PDFUploader';
import { PDFViewer } from '@/components/esign/PDFViewer';
import { SignaturePad } from '@/components/esign/SignaturePad';
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
  FileText
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
  const { user, loading: authLoading, signOut } = useAuth();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
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

  const handleFileSelect = (file: File) => {
    setPdfFile(file);
    setSignature(null);
    setSignaturePosition(null);
    setSigners([]);
  };

  const handleSignatureCreate = (signatureDataUrl: string) => {
    setSignature(signatureDataUrl);
    toast.success('Signature created! Click on the document to place it.');
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

    const promise = async () => {
      const functions = getFunctions();
      const sendInvites = httpsCallable(functions, 'sendSignerInvites');
      
      await sendInvites({
        signers: signers,
        documentName: pdfFile.name,
        uploaderName: user?.email?.split('@')[0] || 'A user',
        uploaderEmail: user?.email,
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
            <Link to="/">
              <Logo className="h-10 w-auto" />
            </Link>
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
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!pdfFile ? (
          <div className="max-w-2xl mx-auto">
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
                {[
                  { id: '1', name: 'Service_Agreement_2024.pdf', date: '2 hrs ago', status: 'Signed' },
                  { id: '2', name: 'NDA_External_Vendor.pdf', date: 'Yesterday', status: 'Pending' },
                  { id: '3', name: 'Q1_Financial_Report.pdf', date: '3 days ago', status: 'Draft' },
                ].map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{doc.name}</h3>
                        <p className="text-sm text-muted-foreground">{doc.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === 'Signed' ? 'bg-green-500/10 text-green-500' :
                        doc.status === 'Pending' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {doc.status}
                      </span>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
                <div className="space-y-6">
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
                  <SignaturePad onSignatureCreate={handleSignatureCreate} />
                  <Separator />
                  <SignerManager signers={signers} setSigners={setSigners} onSendInvites={handleSendInvites} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
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
