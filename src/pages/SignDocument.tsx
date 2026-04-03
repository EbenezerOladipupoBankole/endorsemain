import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, functions } from '@/components/client';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PDFViewer, PlacedItem } from '@/components/esign/PDFViewer';
import SignatureModal from '@/components/SignatureModal';
import { Loader2, CheckCircle2, AlertCircle, PenTool, Plus, X, Type, User, Calendar, FileText, SquareCheck, List, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/components/AuthContext';

const SignDocument = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();
  const token = new URLSearchParams(window.location.search).get('token');

  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [signature, setSignature] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [activeStampType, setActiveStampType] = useState<"signature" | "initials" | "name" | "date" | "text" | "checkbox" | "dropdown" | null>(null);

  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [hasConsented, setHasConsented] = useState(false);

  const [showSignatureModal, setShowSignatureModal] = useState<"signature" | "initials" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  // ... rest of header and state stays same


  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
  
      try {
        const getDocFn = httpsCallable(functions, 'getDocumentForSigning');
        const result = await getDocFn({ documentId: id, token });
        const data = (result.data as any).document;
  
        if (data) {
          setDocumentData(data);
  
          if (data.status === 'COMPLETED') {
            setIsSuccess(true);
            setLoading(false);
            return;
          }
  
          // Check if current user is the owner or a recipient
          const isOwner = user?.uid && data.owner?.firebaseUid === user.uid;
          const recipient = data.recipients.find((r: any) => 
            (token && r.token === token) || (user?.email && r.email === user.email)
          );
  
          if (!isOwner && !recipient && !token) {
            toast.error("You don't have permission to view this document.");
            navigate('/dashboard');
            return;
          }
  
          if (data.fileUrl) {
            // Check if it's base64 or URL
            const isBase64 = data.fileUrl.startsWith('data:application/pdf;base64,') || !data.fileUrl.includes('://');
            const fetchUrl = isBase64 && !data.fileUrl.startsWith('data:') ? `data:application/pdf;base64,${data.fileUrl}` : data.fileUrl;
            
            const response = await fetch(fetchUrl);
            const blob = await response.blob();
            const file = new File([blob], data.name || "document.pdf", { type: "application/pdf" });
            setPdfFile(file);
          } else {
            toast.error("Document file not found.");
          }
  
          // Map PostgreSQL fields to placedItems if they exist
          if (data.fields && data.fields.length > 0) {
            const mapped = data.fields.map((f: any) => ({
              id: f.id,
              type: f.fieldType,
              data: '', // Placeholder
              page: f.page,
              x: Number(f.positionX),
              y: Number(f.positionY),
              width: Number(f.width),
              height: Number(f.height)
            }));
            setPlacedItems(mapped);
          }
        } else {
          toast.error("Document not found.");
          navigate('/');
        }
      } catch (error: any) {
        console.error("Error fetching document:", error);
        toast.error(error.message || "Failed to load document.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchDocument();
  }, [id, navigate, token, user]);

  useEffect(() => {
    if (documentData?.branding?.primaryColor) {
      const color = documentData.branding.primaryColor;
      document.documentElement.style.setProperty('--primary', color);
      document.documentElement.style.setProperty('--ring', color);
    }
  }, [documentData?.branding?.primaryColor]);

  const handleModalSave = (signatureData: string) => {
    if (showSignatureModal === "signature") {
      setSignature(signatureData);
      setActiveStampType("signature");
      toast.success('Signature created! Click on the document to place it.');
    } else if (showSignatureModal === "initials") {
      setInitials(signatureData);
      setActiveStampType("initials");
      toast.success('Initials created! Click on the document to place it.');
    }
    setShowSignatureModal(null);
  };

  const onItemPlace = (item: Omit<PlacedItem, "id">) => {
    const newItem: PlacedItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
    };
    setPlacedItems(prev => [...prev, newItem]);
    setActiveStampType(null); // Deselect after placing
  };

  const onItemUpdate = (id: string, updates: Partial<PlacedItem>) => {
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const onItemDelete = (id: string) => {
    setPlacedItems(prev => prev.filter(item => item.id !== id));
    toast.success('Item removed');
  };

  const handleCompleteSigning = async () => {
    if (placedItems.length === 0 || !id) {
      toast.error("Please place at least one signature or initials on the document.");
      return;
    }

    setIsSubmitting(true);
    try {
      const recipient = documentData.recipients.find((r: any) => 
        (token && r.token === token) || (user?.email && r.email === user.email)
      );

      if (!recipient) {
        toast.error("Recipient not found or unauthorized.");
        return;
      }

      const submitSigFn = httpsCallable(functions, 'submitSignature');
      await submitSigFn({
        documentId: id,
        recipientId: recipient.id,
        signatureImageUrl: signature || initials || placedItems[0].data,
        ipAddress: 'dynamic', // Handled by server usually or can fetch here
        userAgent: navigator.userAgent
      });

      setIsSuccess(true);
      toast.success("Document signed successfully!");
    } catch (error: any) {
      console.error("Error signing document:", error);
      toast.error(error.message || "Failed to submit signature.");
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
        
        {user ? (
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        ) : (
          <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-border">
            <p className="text-sm text-muted-foreground">Want to send your own documents for secure e-signing?</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button onClick={() => navigate('/auth')} className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 px-8">
                Create Free Account
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Return Home
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const activeStampData = (() => {
    switch (activeStampType) {
      case "signature": return signature;
      case "initials": return initials;
      case "name": return userProfile?.displayName || userProfile?.email?.split('@')[0] || "Signer Name";
      case "date": return new Date().toLocaleDateString();
      case "text": return "";
      case "checkbox": return "false";
      case "dropdown": return "";
      default: return null;
    }
  })();

  const handleToolClick = (toolId: string) => {
    if (toolId === 'signature') {
      if (!signature) {
        setShowSignatureModal('signature');
      } else {
        setActiveStampType(activeStampType === 'signature' ? null : 'signature');
      }
    } else if (toolId === 'initials') {
      if (!initials) {
        setShowSignatureModal('initials');
      } else {
        setActiveStampType(activeStampType === 'initials' ? null : 'initials');
      }
    } else {
      setActiveStampType(activeStampType === toolId ? null : toolId as any);
    }
  };

  const ToolButton = ({ id, icon: Icon, label, hasData, isActive, onClick, onClear }: any) => {
    return (
      <div className="flex flex-col w-full mb-1">
        <Button
          variant="outline"
          className={`w-full justify-start text-left h-12 transition-all border ${isActive
            ? 'bg-primary/10 hover:bg-primary/20 border-primary text-foreground ring-1 ring-primary'
            : 'bg-card border-border hover:border-primary/50 text-foreground shadow-sm'
            }`}
          onClick={onClick}
        >
          <div className={`p-1.5 rounded-md mr-3 ${isActive ? 'bg-primary' : 'bg-muted text-muted-foreground'}`}>
            <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-current'}`} />
          </div>
          <span className="flex-1 font-medium text-sm">{label}</span>
          {!hasData && <Plus className="w-4 h-4 text-muted-foreground" />}
        </Button>
        {hasData && onClear && (
          <div className="flex justify-end mt-1 pr-1">
            <button
              onClick={(e) => { e.stopPropagation(); onClear(); if (isActive) setActiveStampType(null); }}
              className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Remove {label.toLowerCase()}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Logo className="h-8 w-auto flex-shrink-0" customLogoUrl={documentData?.branding?.logoUrl} />
          
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg border transition-colors ${hasConsented ? 'border-primary/50 bg-primary/5' : 'border-destructive/20 bg-destructive/10'}`}>
              <Checkbox 
                id="legal-consent" 
                checked={hasConsented} 
                onCheckedChange={(checked) => setHasConsented(checked as boolean)}
                className="data-[state=checked]:bg-primary h-4 w-4"
              />
              <Label htmlFor="legal-consent" className="text-[10px] md:text-[11px] leading-tight cursor-pointer font-semibold select-none">
                I agree to the <span className="hidden sm:inline">electronic signature</span> terms.
              </Label>
            </div>

            <Button 
               id="finish-signing-btn"
               onClick={handleCompleteSigning} 
               disabled={placedItems.length === 0 || isSubmitting || !hasConsented} 
               className={`transition-all duration-300 font-bold shadow-lg h-10 px-4 ${hasConsented ? 'bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90' : 'bg-muted text-muted-foreground grayscale cursor-not-allowed opacity-70'}`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin md:mr-2" />
              ) : (
                <ShieldCheck className={`w-4 h-4 transition-transform ${hasConsented ? 'scale-110 md:mr-2' : 'scale-90 md:mr-2'}`} />
              )}
              <span className="hidden sm:inline">Finish Signing</span>
              <span className="sm:hidden text-xs">Finish</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 bg-card border-r border-border p-4 flex flex-col gap-6 overflow-y-auto z-10 shadow-sm">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Standard Fields</h3>

            <div className="space-y-2">
              <ToolButton
                id="signature"
                icon={PenTool}
                label="Signature"
                hasData={!!signature}
                isActive={activeStampType === 'signature'}
                onClick={() => handleToolClick('signature')}
                onClear={() => setSignature(null)}
              />
              <ToolButton
                id="initials"
                icon={Type}
                label="Initials"
                hasData={!!initials}
                isActive={activeStampType === 'initials'}
                onClick={() => handleToolClick('initials')}
                onClear={() => setInitials(null)}
              />
              <ToolButton
                id="name"
                icon={User}
                label="Name"
                hasData={true}
                isActive={activeStampType === 'name'}
                onClick={() => handleToolClick('name')}
              />
              <ToolButton
                id="date"
                icon={Calendar}
                label="Date Signed"
                hasData={true}
                isActive={activeStampType === 'date'}
                onClick={() => handleToolClick('date')}
              />
              <ToolButton
                id="text"
                icon={FileText}
                label="Text"
                hasData={true}
                isActive={activeStampType === 'text'}
                onClick={() => handleToolClick('text')}
              />
              <div className="pt-4 border-t border-border">
                <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Advanced</h3>
                <div className="space-y-2">
                  <ToolButton
                    id="checkbox"
                    icon={SquareCheck}
                    label="Checkbox"
                    hasData={true}
                    isActive={activeStampType === 'checkbox'}
                    onClick={() => handleToolClick('checkbox')}
                  />
                  <ToolButton
                    id="dropdown"
                    icon={List}
                    label="Dropdown"
                    hasData={true}
                    isActive={activeStampType === 'dropdown'}
                    onClick={() => handleToolClick('dropdown')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Area */}
        <div className="flex-1 bg-muted/30 overflow-y-auto p-4 md:p-8 flex justify-center">
          <div className="max-w-5xl w-full bg-transparent mx-auto">
            <div className="min-h-[600px] flex justify-center">
              {pdfFile && <PDFViewer
                file={pdfFile}
                activeStamp={activeStampData && activeStampType ? { type: activeStampType, data: activeStampData } : null}
                placedItems={placedItems}
                onItemPlace={onItemPlace}
                onItemUpdate={onItemUpdate}
                onItemDelete={onItemDelete}
              />}
            </div>
          </div>
        </div>
      </main>
      {showSignatureModal && (
        <SignatureModal
          document={{ id: id || 'temp', name: documentData?.name || 'Document', status: 'pending', signature_data: null, signature_type: null }}
          onClose={() => setShowSignatureModal(null)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default SignDocument;