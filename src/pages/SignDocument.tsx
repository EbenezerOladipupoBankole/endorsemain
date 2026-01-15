import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/components/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PDFViewer } from '@/components/esign/PDFViewer';
import SignatureModal from '@/components/SignatureModal';
import { Loader2, CheckCircle2, AlertCircle, PenTool } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

const SignDocument = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signaturePositions, setSignaturePositions] = useState<SignaturePosition[]>([]);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, "documents", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDocumentData(data);
          
          if (data.status === 'completed' || data.status === 'signed') {
             setIsSuccess(true);
             setLoading(false);
             return;
          }

          // Load PDF File from URL or Base64
          if (data.fileUrl) {
            const response = await fetch(data.fileUrl);
            const blob = await response.blob();
            const file = new File([blob], data.name || "document.pdf", { type: "application/pdf" });
            setPdfFile(file);
          } else if (data.pdfBase64) {
             const res = await fetch(data.pdfBase64);
             const blob = await res.blob();
             const file = new File([blob], data.name || "document.pdf", { type: "application/pdf" });
             setPdfFile(file);
          } else {
            toast.error("Document file not found.");
          }
        } else {
          toast.error("Document not found.");
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        toast.error("Failed to load document.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, navigate]);

  const handleModalSave = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignatureModal(false);
    toast.success('Signature created! Click on the document to place it.');
  };

  const handleSignaturePlace = (position: SignaturePosition) => {
    setSignaturePositions(prev => [...prev, position]);
    toast.success('Signature placed!');
  };

  const handleCompleteSigning = async () => {
    if (!signature || signaturePositions.length === 0 || !id) {
      toast.error("Please place at least one signature on the document.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "documents", id), {
        status: 'signed',
        signature_data: signature,
        signature_positions: signaturePositions,
        signedAt: serverTimestamp(),
      });
      
      setIsSuccess(true);
      toast.success("Document signed successfully!");
    } catch (error) {
      console.error("Error signing document:", error);
      toast.error("Failed to submit signature.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-muted/30">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Document Signed Successfully!</h1>
        <p className="text-muted-foreground mb-6 max-w-md">Thank you for signing <strong>{documentData?.name}</strong>.</p>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo className="h-8 w-auto" />
          <Button onClick={handleCompleteSigning} disabled={!signature || signaturePositions.length === 0 || isSubmitting} className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin md:mr-2" /> : <PenTool className="w-4 h-4 md:mr-2" />}
            <span className="hidden md:inline">Finish Signing</span>
          </Button>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto bg-card rounded-xl shadow-sm border border-border overflow-hidden">
             <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
               <h2 className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-primary" /> {documentData?.name}</h2>
               {!signature && <Button size="sm" variant="outline" onClick={() => setShowSignatureModal(true)}>Create Signature</Button>}
             </div>
             <div className="p-6 bg-muted/10 min-h-[600px] flex justify-center">
               {pdfFile && <PDFViewer file={pdfFile} signatureImage={signature} signaturePositions={signaturePositions} onSignaturePlace={handleSignaturePlace} onSignatureMove={(pos) => {
                 setSignaturePositions(prev => {
                   const newPositions = [...prev];
                   if (newPositions.length > 0) {
                     newPositions[newPositions.length - 1] = pos;
                   }
                   return newPositions;
                 });
               }} />}
             </div>
        </div>
      </main>
      {showSignatureModal && (
        <SignatureModal
          document={{ id: id || 'temp', name: documentData?.name || 'Document', status: 'pending', signature_data: null, signature_type: null }}
          onClose={() => setShowSignatureModal(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default SignDocument;