import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '@/components/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PDFViewer, PlacedItem } from '@/components/esign/PDFViewer';
import SignatureModal from '@/components/SignatureModal';
import { Logo } from '@/components/Logo';
import { sanitizeHtml } from '@/components/agreements/signingUtils';
import { DocumentTools } from '@/components/esign/DocumentTools';
import { useViewerState, useDocumentComments } from '@/components/esign/viewerTools';

import { useAuth } from '@/components/AuthContext';
import { getAuth } from 'firebase/auth';

// We import icons just for this dashboard to match the requested design exactly.
import { 
  PenTool, Type, Stamp, Calendar, User, UserSquare, UserCircle, 
  Mail, Briefcase, FileText,
  Download, Printer, MoreVertical, ChevronDown, CheckCircle2, Loader2
} from 'lucide-react';

const SignDocument = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const auth = getAuth();

  const [loading, setLoading] = useState(true);
  const [documentData, setDocumentData] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [signature, setSignature] = useState<string | null>(null);
  const [initials, setInitials] = useState<string | null>(null);
  const [activeStampType, setActiveStampType] = useState<"signature" | "initials" | "name" | "date" | "text" | null>(null);

  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  const [showSignatureModal, setShowSignatureModal] = useState<"signature" | "initials" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Summarize / search / pages / comments / zoom. Comments are shared with the sender in Firestore.
  const viewer = useViewerState();
  const { comments, addComment, deleteComment } = useDocumentComments(documentData ? id : null);
  const agreementHtml = useMemo(
    () => (documentData?.renderedHtml ? sanitizeHtml(documentData.renderedHtml) : ''),
    [documentData?.renderedHtml]
  );
  const agreementText = useMemo(() => {
    if (!agreementHtml) return '';
    return new DOMParser().parseFromString(agreementHtml, 'text/html').body.textContent ?? '';
  }, [agreementHtml]);
  const commenterName = user?.displayName || documentData?.recipientName || user?.email || 'Signer';

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id || authLoading) return;

      // Email signers must be logged in with a verified address. WhatsApp signers are
      // signed in by the verify page with a per-document token (no email), so they pass.
      if (!user || (user.email && !user.emailVerified)) {
        navigate(`/auth?redirect=${encodeURIComponent(`/sign/${id}`)}`, { replace: true });
        return;
      }

      try {
        const docRef = doc(db, "documents", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setDocumentData(data);

          if (data.channel === 'whatsapp') {
            const currentUid = auth.currentUser?.uid || '';
            const expectedUid = `whatsapp-signer-${id}`;
            if (currentUid !== expectedUid) {
              navigate(`/sign/${id}/verify`, { replace: true });
              return;
            }
          }

          if (data.status === 'completed' || data.status === 'signed') {
            setIsSuccess(true);
            setLoading(false);
            return;
          }

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
          } else if (data.renderedHtml) {
            // HTML Agreement Template document
            setPdfFile(null);
          } else {
            toast.error("Document file not found.");
          }
        } else {
          toast.error("Document not found.");
          navigate('/');
        }
      } catch (error: any) {
        console.error("Error fetching document:", error);
        if (error?.code === 'permission-denied' && !auth.currentUser?.email) {
          // A WhatsApp session for a different document — verify for this one.
          navigate(`/sign/${id}/verify`, { replace: true });
          return;
        } else if (error?.code === 'permission-denied') {
          toast.error(`This document wasn't sent to ${auth.currentUser?.email ?? 'this account'}. Sign in with the email address the invite was sent to.`);
        } else {
          toast.error("Failed to load document.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, navigate, user, authLoading]);

  const handleModalSave = (signatureData: string) => {
    const isInitials = showSignatureModal === "initials";
    if (isInitials) {
      setInitials(signatureData);
    } else {
      setSignature(signatureData);
    }
    // Put it on the page straight away so the user sees it; they can drag it into position.
    setPlacedItems(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      type: isInitials ? "initials" : "signature",
      data: signatureData,
      x: 50,
      y: 50,
      page: viewer.page,
      scale: 1,
    }]);
    toast.success(
      isInitials
        ? 'Initials added to the page. Drag them into place.'
        : 'Signature added to the page. Drag it into place.'
    );
    setShowSignatureModal(null);
  };

  const onItemPlace = (item: Omit<PlacedItem, "id">) => {
    const newItem: PlacedItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
    };
    setPlacedItems(prev => [...prev, newItem]);
    setActiveStampType(null);
  };

  const onItemUpdate = (id: string, updates: Partial<PlacedItem>) => {
    setPlacedItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const onItemDelete = (id: string) => {
    setPlacedItems(prev => prev.filter(item => item.id !== id));
    toast.success('Item removed');
  };

  const handleCompleteSigning = async () => {
    if (placedItems.length === 0 && !signature && !initials) {
      toast.error("Please place at least one signature or initials on the document.");
      return;
    }

    setIsSubmitting(true);
    try {
      const signaturePayload = signature || initials || (placedItems.length > 0 ? placedItems[0].data : null);

      await updateDoc(doc(db, "documents", id!), {
        status: 'signed',
        signature_data: signaturePayload,
        signature_positions: placedItems,
        signedAt: serverTimestamp(),
      });

      // Email the signer a confirmation and let the sender know it's done
      try {
        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('@/components/client');
        const notifyFn = httpsCallable(functions, 'notifyAgreementSigned');
        await notifyFn({ documentId: id });
      } catch (notifyErr) {
        console.warn("Cloud function email notification notice:", notifyErr);
      }

      setIsSuccess(true);
      toast.success("Signed! The sender has been notified.");
    } catch (error) {
      console.error("Error signing document:", error);
      toast.error("Failed to submit signature.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#0A66C2]" /></div>;

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#f3f4f6]">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Document Signed Successfully!</h1>
        <p className="text-muted-foreground mb-6 max-w-md">Thank you for signing <strong>{documentData?.name}</strong>.</p>
        {user?.email ? (
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        ) : (
          <p className="text-sm text-muted-foreground">The sender has been notified. You can close this page.</p>
        )}
      </div>
    );
  }

  const activeStampData = (() => {
    switch (activeStampType) {
      case "signature": return signature;
      case "initials": return initials;
      case "name": return userProfile?.displayName || documentData?.recipientName || userProfile?.email?.split("@")[0] || "Signer Name";
      case "date": return new Date().toLocaleDateString();
      case "text": return "";
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

  const ToolButton = ({ id, icon: Icon, label, hasData, isActive, onClick, disabled }: any) => {
    return (
      <button
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all rounded-md group ${
          isActive 
            ? 'bg-blue-50/50 text-blue-700 font-medium' 
            : disabled 
              ? 'opacity-50 cursor-not-allowed text-gray-500' 
              : 'hover:bg-gray-100 text-gray-800'
        }`}
        onClick={onClick}
      >
        <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-800 group-hover:text-black'}`} />
        <span>{label}</span>
        {hasData && (
          <div className="ml-auto w-2 h-2 rounded-full bg-green-500" title="Data provided"></div>
        )}
      </button>
    );
  };

  return (
    <div className="h-screen w-screen bg-[#f3f4f6] flex flex-col font-sans overflow-hidden">
      {/* Top Bar - Brand Color #0A66C2 */}
      <header className="bg-[#0A66C2] h-14 flex items-center justify-between gap-3 px-3 sm:px-6 shrink-0 z-50 shadow-md">
        <div className="flex min-w-0 items-center gap-3">
          {/* The logo's blue lettering needs a light backing on the blue bar. Not a link: signers stay on the document. */}
          <span className="flex h-9 shrink-0 items-center rounded-lg bg-white px-2 shadow-sm">
            <Logo className="h-7" />
          </span>
          <span className="truncate text-sm font-medium text-white/85">{documentData?.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCompleteSigning} 
            disabled={(placedItems.length === 0 && !signature && !initials) || isSubmitting} 
            className="min-h-[40px] shrink-0 whitespace-nowrap px-4 sm:px-6 text-slate-950 bg-[#FFC83D] hover:bg-[#e6b435] disabled:opacity-50 text-sm font-extrabold rounded-full transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? "Submitting…" : "Finish & submit"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className={`${pdfFile ? 'md:flex' : ''} hidden w-56 bg-white border-r border-gray-200 flex-col shrink-0 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.02)]`}>
          <div className="px-5 py-4">
            <h2 className="text-[11px] font-bold text-gray-800 tracking-widest uppercase">Fields</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scrollbar">
            {/* Primary Actions */}
            <ToolButton id="signature" icon={PenTool} label="Signature" hasData={!!signature} isActive={activeStampType === 'signature'} onClick={() => handleToolClick('signature')} />
            <ToolButton id="initials" icon={Type} label="Initial" hasData={!!initials} isActive={activeStampType === 'initials'} onClick={() => handleToolClick('initials')} />
            <ToolButton id="stamp" icon={Stamp} label="Stamp" disabled={true} onClick={() => {}} />
            <ToolButton id="date" icon={Calendar} label="Date Signed" hasData={true} isActive={activeStampType === 'date'} onClick={() => handleToolClick('date')} />
            
            <div className="h-px bg-gray-100 my-2 mx-4" />
            
            {/* Identity Details */}
            <ToolButton id="name" icon={User} label="Name" hasData={true} isActive={activeStampType === 'name'} onClick={() => handleToolClick('name')} />
            <ToolButton id="firstname" icon={UserSquare} label="First Name" disabled={true} onClick={() => {}} />
            <ToolButton id="lastname" icon={UserCircle} label="Last Name" disabled={true} onClick={() => {}} />
            <ToolButton id="email" icon={Mail} label="Email Address" disabled={true} onClick={() => {}} />
            <ToolButton id="company" icon={Briefcase} label="Company" disabled={true} onClick={() => {}} />
            <ToolButton id="title" icon={FileText} label="Title" disabled={true} onClick={() => {}} />
            
            <div className="h-px bg-gray-100 my-2 mx-4" />
            
            {/* Text Inputs */}
            <ToolButton id="text" icon={Type} label="Text" hasData={true} isActive={activeStampType === 'text'} onClick={() => handleToolClick('text')} />
          </div>
        </div>

        {/* Main Document Area */}
        <main className="flex-1 relative bg-[#f4f4f4] overflow-hidden flex flex-col">
          <div className={`flex-1 overflow-auto p-2 sm:p-8 flex justify-center custom-scrollbar ${pdfFile ? 'pb-24 md:pb-8' : ''}`}>
            {/* Document Container with realistic paper shadow */}
            <div className="bg-white mx-auto shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1),0_10px_20px_-2px_rgba(0,0,0,0.05)] rounded-sm md:min-h-[800px] w-full max-w-4xl relative p-3 sm:p-8 md:p-12 border border-gray-200">
              {documentData?.message && (
                <div className="mb-6 rounded-lg border-l-4 border-[#FFC83D] bg-[#FFF8E1] p-4 text-sm text-gray-700">
                  <p className="mb-1 text-xs font-semibold text-gray-500">Note from {documentData.senderName || documentData.ownerEmail}</p>
                  <p className="whitespace-pre-line">{documentData.message}</p>
                </div>
              )}

              {pdfFile && <PDFViewer
                file={pdfFile}
                activeStamp={activeStampData && activeStampType ? { type: activeStampType, data: activeStampData } : null}
                placedItems={placedItems}
                onItemPlace={onItemPlace}
                onItemUpdate={onItemUpdate}
                onItemDelete={onItemDelete}
                zoom={viewer.zoom}
                page={viewer.page}
                onPageChange={viewer.setPage}
                onDocumentLoad={viewer.setNumPages}
                searchQuery={viewer.panel === 'search' ? viewer.searchQuery : ''}
                comments={comments}
                activeCommentId={viewer.activeCommentId}
                onCommentClick={(cid) => {
                  viewer.setPanel('comments');
                  viewer.setActiveCommentId(cid);
                }}
                commentMode={viewer.commentMode}
                onCommentPlace={(pos) => {
                  viewer.setPendingComment(pos);
                  viewer.setCommentMode(false);
                }}
              />}

              {!pdfFile && documentData?.renderedHtml && (
                <div className="space-y-6" style={{ zoom: viewer.zoom }}>
                  {/* Agreement Header */}
                  <div className="border-b border-gray-200 pb-4 mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A66C2] bg-blue-50 px-2.5 py-1 rounded-full">
                        Signature request
                      </span>
                      <h1 className="text-xl font-extrabold text-gray-900 mt-2">{documentData.name}</h1>
                    </div>
                    <div className="text-xs text-gray-500 sm:text-right">
                      <p className="font-bold text-gray-700">Status: Pending E-Sign</p>
                      <p>Recipient: {documentData.recipientName || documentData.studentName || documentData.recipientEmail}</p>
                    </div>
                  </div>

                  {/* Rendered Agreement Content */}
                  <div
                    className="prose prose-slate max-w-none text-sm text-gray-800 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: agreementHtml }}
                  />

                  {/* E-Signature Placement Section */}
                  <div className="mt-12 pt-6 border-t-2 border-dashed border-gray-300">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-4 flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-[#0A66C2]" />
                      Your signature
                    </h3>

                    {signature || initials ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <img src={signature || initials || ''} alt="Your signature" className="h-12 object-contain" />
                          <div>
                            <p className="text-xs font-bold text-green-900">Digital Signature Applied</p>
                            <p className="text-xs text-green-700">Tap "Finish &amp; submit" at the top to send it back.</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowSignatureModal('signature')}
                          className="min-h-[40px] text-sm border-green-300 text-green-800"
                        >
                          Change Signature
                        </Button>
                      </div>
                    ) : (
                      <div className="p-6 bg-blue-50/60 border-2 border-dashed border-[#0A66C2]/40 rounded-xl text-center space-y-3">
                        <p className="text-xs font-bold text-[#0A66C2]">Draw or Type Your Signature Below</p>
                        <Button
                          onClick={() => setShowSignatureModal('signature')}
                          className="min-h-[44px] bg-[#0A66C2] hover:bg-[#08519c] text-white font-extrabold text-sm px-6 rounded-full shadow-md"
                        >
                          <PenTool className="w-4 h-4 mr-2" />
                          Create & Place E-Signature
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        
        {/* Right Sidebar: document tools */}
        <DocumentTools
          viewer={viewer}
          file={pdfFile}
          text={pdfFile ? undefined : agreementText}
          documentName={documentData?.name}
          comments={comments}
          onAddComment={(text, pos) => addComment({ text, ...pos, authorUid: user?.uid ?? '', authorName: commenterName })}
          onDeleteComment={deleteComment}
          canDeleteComment={(c) => c.authorUid === user?.uid}
        >
          <button
            className="flex flex-col items-center gap-1.5 group disabled:opacity-40"
            disabled={!pdfFile}
            onClick={() => {
              if (!pdfFile) return;
              const url = URL.createObjectURL(pdfFile);
              const a = document.createElement('a');
              a.href = url;
              a.download = pdfFile.name;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <div className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Download className="w-5 h-5 text-black" />
            </div>
            <span className="text-[10px] text-gray-700 group-hover:text-black">Download</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 group" onClick={() => window.print()}>
            <div className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Printer className="w-5 h-5 text-black" />
            </div>
            <span className="text-[10px] text-gray-700 group-hover:text-black">Print</span>
          </button>
        </DocumentTools>
      </div>

      {/* Phones: available fields as a bar along the bottom (PDF documents only) */}
      {pdfFile && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden" aria-label="Fields">
          <div className="flex justify-center gap-1.5 overflow-x-auto px-3 py-2">
            {([
              { id: 'signature', label: 'Signature', icon: PenTool, done: !!signature },
              { id: 'initials', label: 'Initial', icon: Type, done: !!initials },
              { id: 'date', label: 'Date', icon: Calendar, done: false },
              { id: 'name', label: 'Name', icon: User, done: false },
              { id: 'text', label: 'Text', icon: Type, done: false },
            ] as const).map((f) => {
              const active = activeStampType === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => handleToolClick(f.id)}
                  className={`relative flex min-h-[48px] min-w-[64px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-semibold transition-colors ${
                    active ? 'bg-[#0A66C2] text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <f.icon className="h-4 w-4" />
                  {f.label}
                  {f.done && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Minimal Footer */}
      <footer className="hidden h-8 bg-white border-t border-gray-200 md:flex items-center justify-between px-6 text-[10px] text-gray-500 shrink-0 z-50">
        <div className="font-medium">
          <span className="flex items-center gap-1.5">Powered by <Logo className="h-4" /></span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="cursor-pointer hover:text-gray-700 flex items-center gap-1">English (US) <ChevronDown className="w-3 h-3"/></span>
          <span className="cursor-pointer hover:text-gray-700 hidden sm:inline">Terms of Use</span>
          <span className="cursor-pointer hover:text-gray-700 hidden sm:inline">Privacy</span>
        </div>
        <div className="hidden md:block">
          Copyright © {new Date().getFullYear()} Endorse, Inc. All rights reserved
        </div>
      </footer>

      {showSignatureModal && (
        <SignatureModal
          document={{ id: id || 'temp', name: documentData?.name || 'Document', status: 'pending', signature_data: null, signature_type: null }}
          onClose={() => setShowSignatureModal(null)}
          onSave={handleModalSave}
          kind={showSignatureModal}
        />
      )}
      
      {/* Injecting some minimal css for the custom scrollbar in this view */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
      `}} />
    </div>
  );
};

export default SignDocument;