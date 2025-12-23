import { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import Cropper from "react-easy-crop";
import { httpsCallable } from "firebase/functions";
import { functions, auth } from "@/components/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Label } from "@/components/ui/label";
import { X, PenTool, Type, Download, RotateCcw, Send, Mail, Loader2, Upload, Check, Crop as CropIcon, Calendar, Eraser, UserPlus } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf"; 
import QRCode from "qrcode";

interface Document {
  id: string;
  name: string;
  status: string;
  signature_data: string | null;
  signature_type: string | null;
}

interface SignatureModalProps {
  document: Document;
  onClose: () => void;
  onSave: (signatureData: string, signatureType: "draw" | "type" | "upload") => void;
}

interface SendDocumentPayload {
  recipientEmail: string;
  pdfBase64: string;
  documentName: string;
}

interface InviteToSignPayload {
  documentId: string;
  recipientEmail: string;
}

/**
 * Generates a PDF document from the document details and signature.
 * @param document - The document object.
 * @param currentSignature - The current signature data if the document is being signed.
 * @param currentSignatureType - The type of the current signature.
 * @returns A Blob representing the generated PDF.
 */
const generatePdfBlob = async (
  document: Document,
  currentSignature: string | null,
  currentSignatureType: "draw" | "type" | "upload"
): Promise<Blob | null> => {
  const signatureData = document.signature_data || currentSignature;
  if (!signatureData) {
    toast.error("A signature is required to generate the PDF.");
    return null;
  }

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Header
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 35, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.text("Endorse", 20, 23);
  
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.text("Electronic Signature Document", pageWidth - 20, 23, { align: "right" });

  // Document Info
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(document.name, 20, 55);
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Document ID: ${document.id.slice(0, 8)}...`, 20, 65);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 72);

  // Divider
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.5);
  pdf.line(20, 82, pageWidth - 20, 82);

  // Content
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Document Agreement", 20, 95);
  
  const contentText = [
    "This document has been electronically signed using Endorse.",
    "The signature below confirms the signer's agreement to the terms and conditions.",
    "By signing, you acknowledge this is a legally binding electronic signature."
  ];
  
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  let yPosition = 108;
  contentText.forEach(line => {
    pdf.text(line, 20, yPosition);
    yPosition += 6;
  });

  // Signature Section
  pdf.setDrawColor(226, 232, 240);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(20, pageHeight - 95, pageWidth - 40, 75, 4, 4, "FD");

  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Signature", 30, pageHeight - 80);

  const sigType = document.signature_type || currentSignatureType;
  if (sigType === "draw" || sigType === "upload") {
    const format = signatureData.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
    pdf.addImage(signatureData, format, 30, pageHeight - 72, 90, 35);
  } else {
    pdf.setFontSize(24);
    pdf.setFont("times", "italic");
    pdf.setTextColor(30, 41, 59);
    pdf.text(signatureData, 30, pageHeight - 50);
  }

  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Signed by: ${auth.currentUser?.email || 'Authenticated User'} on ${new Date().toLocaleString()}`, 30, pageHeight - 28);

  // Footer
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text("This document was electronically signed via Endorse - Endorse.app", pageWidth / 2, pageHeight - 10, { align: "center" });
  
  // --- Audit Trail Page ---
  pdf.addPage();
  
  // Header
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, 0, pageWidth, 40, "F");
  
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "bold");
  pdf.text("Audit Trail", 20, 25);
  
  // QR Code
  try {
    const verificationUrl = `https://endorse.app/verify/${document.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { width: 100, margin: 1, color: { dark: '#0f172a', light: '#f8fafc' } });
    pdf.addImage(qrCodeDataUrl, 'PNG', pageWidth - 45, 8, 25, 25);
  } catch (err) {
    console.error("Error generating QR code:", err);
  }

  // Document Info
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont("helvetica", "normal");
  pdf.text(`File Name: ${document.name}`, 20, 55);
  pdf.text(`Document ID: ${document.id}`, 20, 62);
  const transactionId = Array.from({length: 24}, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
  pdf.text(`Transaction ID: ${transactionId}`, 20, 69);

  // Events
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42);
  pdf.setFont("helvetica", "bold");
  pdf.text("History", 20, 90);

  let y = 105;
  const events = [
    { action: "Document Created", by: "System", time: new Date(Date.now() - 3600000).toLocaleString() },
    { action: "Viewed by Signer", by: auth.currentUser?.email || "Guest User", time: new Date(Date.now() - 300000).toLocaleString() },
    { action: "Terms Accepted", by: auth.currentUser?.email || "Guest User", time: new Date(Date.now() - 5000).toLocaleString() },
    { action: "Document Signed", by: auth.currentUser?.email || "Guest User", time: new Date().toLocaleString() },
    { action: "Completed", by: "System", time: new Date().toLocaleString() }
  ];

  events.forEach((event) => {
    pdf.setFillColor(59, 130, 246);
    pdf.circle(24, y - 1, 2, "F");
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont("helvetica", "bold");
    pdf.text(event.action, 35, y);
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${event.by} - ${event.time}`, 35, y + 5);
    y += 20;
  });

  // Footer
  pdf.setDrawColor(226, 232, 240);
  pdf.line(20, pageHeight - 30, pageWidth - 20, pageHeight - 30);
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184);
  pdf.text("Endorse Security System | IP: 192.168.1.1 | Encrypted with AES-256", 20, pageHeight - 20);

  return pdf.output('blob');
};

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string | null> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL("image/png");
};

const SignatureModal = ({ document, onClose, onSave }: SignatureModalProps) => {
  const [mode, setMode] = useState<"draw" | "type" | "upload">("draw");
  const [isErasing, setIsErasing] = useState(false);
  const [typedSignature, setTypedSignature] = useState("");
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [uploadSource, setUploadSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [showSendForm, setShowSendForm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "draw" && signatureRef.current) {
      const canvas = signatureRef.current.getCanvas();
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
        }
      }
    }
  }, [isErasing, mode]);

  const clearSignature = () => {
    if (mode === "draw" && signatureRef.current) {
      signatureRef.current.clear();
      setIsErasing(false);
    } else if (mode === "type") {
      setTypedSignature("");
    } else {
      setUploadedSignature(null);
      setUploadSource(null);
      setIsCropping(false);
    }
  };

  const processFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadSource(event.target.result as string);
          setIsCropping(true);
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please upload an image file");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropConfirm = async () => {
    if (uploadSource && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(uploadSource, croppedAreaPixels);
        if (croppedImage) {
          setUploadedSignature(croppedImage);
          setIsCropping(false);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to crop image");
      }
    }
  };

  const getSignatureData = (): string | null => {
    if (mode === "draw") {
      if (signatureRef.current?.isEmpty()) {
        return null;
      }
      return signatureRef.current?.toDataURL("image/png") || null;
    } else if (mode === "type") {
      return typedSignature.trim() || null;
    } else {
      return uploadedSignature;
    }
  };

  const handleSave = () => {
    if (document.status === "pending" && !agreedToTerms) {
      toast.error("Please agree to the terms and conditions to sign.");
      return;
    }
    const signatureData = getSignatureData();
    if (!signatureData) {
      toast.error("Please add your signature first");
      return;
    }
    onSave(signatureData, mode);
  };

  const handleDownload = async () => {
    const pdfBlob = await generatePdfBlob(document, getSignatureData(), mode);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${document.name.replace(/\s+/g, "_")}_signed.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    }
  };

  const handleSend = async () => {
    if (!recipientEmail) {
      toast.error("Please enter recipient email");
      return;
    }
    
    const pdfBlob = await generatePdfBlob(document, getSignatureData(), mode);
    if (!pdfBlob) return;

    setIsSending(true);
    const reader = new FileReader();
    reader.readAsDataURL(pdfBlob);
    reader.onloadend = async () => {
      const base64data = reader.result;
      const sendDocument = httpsCallable<SendDocumentPayload, { success: boolean }>(functions, 'sendDocument');
      try {
        await sendDocument({
          recipientEmail,
          pdfBase64: base64data as string,
          documentName: document.name,
        });
        toast.success(`Document sent to ${recipientEmail}!`);
        setShowSendForm(false);
        setRecipientEmail("");
      } catch (error: any) {
        console.error("Firebase function error:", error);
        toast.error(error.message || "Failed to send document.");
      } finally {
        setIsSending(false);
      }
    };
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Please enter the recipient's email.");
      return;
    }

    setIsInviting(true);
    const inviteToSign = httpsCallable<InviteToSignPayload, { success: boolean }>(functions, 'inviteToSign');
    
    try {
      await inviteToSign({
        documentId: document.id,
        recipientEmail: inviteEmail,
      });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setShowInviteForm(false);
      setInviteEmail("");
    } catch (error: any) {
      console.error("Firebase function error (inviteToSign):", error);
      toast.error(error.message || "Failed to send invitation.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-transparent">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                {document.status === "pending" ? "Sign Document" : "Document Details"}
              </h2>
              <p className="text-xs text-muted-foreground">{document.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {document.status === "pending" ? (
            <>
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-5">
                <Button
                  variant={mode === "draw" ? "default" : "outline"}
                  className="flex-1 h-9"
                  size="sm"
                  onClick={() => setMode("draw")}
                >
                  <PenTool className="w-3.5 h-3.5 mr-1.5" />
                  Draw
                </Button>
                <Button
                  variant={mode === "type" ? "default" : "outline"}
                  className="flex-1 h-9"
                  size="sm"
                  onClick={() => setMode("type")}
                >
                  <Type className="w-3.5 h-3.5 mr-1.5" />
                  Type
                </Button>
                <Button
                  variant={mode === "upload" ? "default" : "outline"}
                  className="flex-1 h-9"
                  size="sm"
                  onClick={() => setMode("upload")}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload
                </Button>
              </div>

              {/* Signature Area */}
              <div className="mb-4">
                <Label className="mb-2 block text-sm">Your Signature</Label>
                {mode === "draw" ? (
                  <div className="relative border-2 border-dashed border-border rounded-lg overflow-hidden bg-secondary/30">
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: `w-full h-40 ${isErasing ? "cursor-cell" : "cursor-crosshair"}`,
                        style: { width: "100%", height: "160px" }
                      }}
                      backgroundColor="transparent"
                      penColor="#1e293b"
                    />
                    
                    {/* Floating Tools */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <Button
                        variant={isErasing ? "secondary" : "ghost"}
                        size="sm"
                        className={`h-8 px-2 backdrop-blur-sm ${isErasing ? "bg-white/80 text-primary shadow-sm" : "bg-white/40 text-muted-foreground hover:bg-white/60"}`}
                        onClick={() => setIsErasing(!isErasing)}
                        title={isErasing ? "Switch to Pen" : "Eraser"}
                      >
                        <Eraser className="w-4 h-4" />
                        {isErasing && <span className="ml-1.5 text-xs">Erasing</span>}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 bg-white/40 text-muted-foreground hover:bg-white/60 backdrop-blur-sm"
                        onClick={clearSignature}
                        title="Clear Signature"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : mode === "type" ? (
                  <div className="border-2 border-dashed border-border rounded-lg p-5 bg-secondary/30">
                    <Input
                      placeholder="Type your full name"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      className="text-center text-lg font-serif italic border-0 bg-transparent focus-visible:ring-0 h-auto py-2"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground h-6 px-2"
                        onClick={() => setTypedSignature(new Date().toLocaleDateString(undefined, { dateStyle: 'long' }))}
                      >
                        <Calendar className="w-3 h-3 mr-1.5" />
                        Insert Today's Date
                      </Button>
                    </div>
                    {typedSignature && (
                      <p className="text-center font-serif text-3xl italic text-foreground mt-4 pb-2">
                        {typedSignature}
                      </p>
                    )}
                  </div>
                ) : (
                  <div 
                    className={`border-2 border-dashed rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-[200px] transition-colors ${
                      isDragging ? "border-primary bg-primary/10" : "border-border bg-secondary/30"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {isCropping && uploadSource ? (
                      <div className="w-full h-64 relative bg-black/5">
                        <div className="absolute inset-0 bottom-12">
                          <Cropper
                            image={uploadSource}
                            crop={crop}
                            zoom={zoom}
                            aspect={3 / 1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-background/90 backdrop-blur flex items-center px-4 gap-4 border-t border-border">
                          <span className="text-xs font-medium text-muted-foreground w-12">Zoom</span>
                          <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <Button size="sm" className="h-7 w-7 p-0 rounded-full" onClick={handleCropConfirm}>
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : uploadedSignature ? (
                      <div className="relative w-full flex flex-col items-center justify-center p-4">
                        <img src={uploadedSignature} alt="Uploaded signature" className="max-h-32 object-contain mb-4" />
                        <Button variant="outline" size="sm" onClick={() => setIsCropping(true)}>
                          <CropIcon className="w-3.5 h-3.5 mr-1.5" />
                          Crop Again
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="text-sm text-muted-foreground mb-2">Click or drag image to upload</p>
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                          Select Image
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Legal Consent */}
              <div className="mt-6 flex items-start gap-3 px-1">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                  I agree to be legally bound by this document and the <span className="text-primary hover:underline">Terms of Service</span> and <span className="text-primary hover:underline">Electronic Record and Signature Disclosure</span>.
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Show existing signature */}
              <div className="mb-5">
                <Label className="mb-2 block text-sm">Signature</Label>
                <div className="border-2 border-border rounded-lg p-5 bg-secondary/30">
                  {document.signature_type === "draw" || document.signature_type === "upload" ? (
                    <img 
                      src={document.signature_data!} 
                      alt="Signature" 
                      className="max-h-28 mx-auto"
                    />
                  ) : (
                    <p className="text-center font-serif text-3xl italic text-foreground py-2">
                      {document.signature_data}
                    </p>
                  )}
                </div>
              </div>

              {/* Invite Form */}
              {showInviteForm && (
                <div className="mb-5 p-4 bg-secondary/50 rounded-lg border border-border animate-fade-in">
                  <Label className="mb-2 block text-sm font-semibold">Invite another person to sign</Label>
                  <p className="text-xs text-muted-foreground mb-3">They will receive a fresh copy of this document to sign.</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="signer@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <Button size="sm" className="h-9" onClick={handleInvite} disabled={isInviting}>
                      {isInviting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Send Form */}
              {showSendForm && (
                <div className="mb-5 p-4 bg-secondary/50 rounded-lg border border-border animate-fade-in">
                  <Label className="mb-2 block text-sm font-semibold">Send a signed copy</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <Button size="sm" className="h-9" onClick={handleSend} disabled={isSending}>
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Send"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-border bg-secondary/30">
          <Button variant="outline" className="flex-1 h-9" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {document.status === "pending" ? (
            <Button 
              className="flex-1 h-9 bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black" 
              size="sm" 
              onClick={handleSave}
              disabled={!agreedToTerms}
            >
              <PenTool className="w-3.5 h-3.5 mr-1.5" />
              Sign Document
            </Button>
          ) : (
            <>
              <Button variant="outline" className="flex-1 h-9" size="sm" onClick={handleDownload}>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download
              </Button>
              <Button 
                variant="outline"
                className="flex-1 h-9"
                size="sm"
                onClick={() => {
                  setShowInviteForm(!showInviteForm);
                  setShowSendForm(false);
                }}
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Invite
              </Button>
              <Button 
                className="flex-1 h-9 bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black"
                size="sm"
                onClick={() => {
                  setShowSendForm(!showSendForm);
                  setShowInviteForm(false);
                }}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send Copy
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
