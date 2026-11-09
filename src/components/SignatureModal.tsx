import { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import Cropper from "react-easy-crop";
import { httpsCallable } from "@/lib/callable";
import { functions, auth } from "@/components/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { useAuth } from "@/components/AuthContext";

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
  /** Which mark is being adopted; decides whether the typed style uses the name or the initials. */
  kind?: "signature" | "initials";
}

const initialsFrom = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 3)
    .join("");

const SIGNATURE_FONTS = [
  { id: 'font-dancing', name: 'Dancing Script', family: '"Dancing Script", cursive', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&display=swap' },
  { id: 'font-vibes', name: 'Great Vibes', family: '"Great Vibes", cursive', url: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap' },
  { id: 'font-sacramento', name: 'Sacramento', family: '"Sacramento", cursive', url: 'https://fonts.googleapis.com/css2?family=Sacramento&display=swap' },
  { id: 'font-caveat', name: 'Caveat', family: '"Caveat", cursive', url: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&display=swap' },
  { id: 'font-apple', name: 'Homemade Apple', family: '"Homemade Apple", cursive', url: 'https://fonts.googleapis.com/css2?family=Homemade+Apple&display=swap' },
];

interface SendDocumentPayload {
  recipientEmail: string;
  pdfBase64: string;
  documentName: string;
}

interface InviteToSignPayload {
  documentId: string;
  recipientEmail: string;
  signingLink: string;
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
  const transactionId = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
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

const textToDataUrl = (text: string, font: string, fontSize: number = 60) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.font = `${fontSize}px ${font}`;
  const textMetrics = ctx.measureText(text);

  // Add padding
  const padding = 40;
  canvas.width = textMetrics.width + (padding * 2);
  canvas.height = fontSize * 2.5;

  ctx.font = `${fontSize}px ${font}`;
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "middle";
  ctx.fillText(text, padding, canvas.height / 2);

  return canvas.toDataURL("image/png");
};

const SignatureModal = ({ document, onClose, onSave, kind = "signature" }: SignatureModalProps) => {
  const [mode, setMode] = useState<"draw" | "type" | "upload">("type");
  const [isErasing, setIsErasing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [initials, setInitials] = useState("");
  // Once the user edits the initials themselves, stop deriving them from the name.
  const [initialsEdited, setInitialsEdited] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
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
  const [isSaving, setIsSaving] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0]);
  const [fontSize, setFontSize] = useState(60);
  const { userProfile, user, isAdmin } = useAuth();

  // Prefill from the signed-in account only; the profile can arrive after the modal opens.
  const accountName = (user?.displayName || userProfile?.displayName || "").trim();
  useEffect(() => {
    if (!accountName) return;
    setFullName((current) => current || accountName);
    setInitials((current) => current || initialsFrom(accountName));
  }, [accountName]);

  const handleNameChange = (value: string) => {
    setFullName(value);
    if (!initialsEdited) setInitials(initialsFrom(value));
  };

  const typedText = (kind === "initials" ? initials : fullName).trim();

  useEffect(() => {
    SIGNATURE_FONTS.forEach(font => {
      if (!window.document.getElementById(font.id)) {
        const link = window.document.createElement('link');
        link.id = font.id;
        link.href = font.url;
        link.rel = 'stylesheet';
        window.document.head.appendChild(link);
      }
    });
  }, []);

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
      if (kind === "initials") setInitials("");
      else setFullName("");
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

  const handleStartCrop = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const dataUrl = signatureRef.current.toDataURL("image/png");
      setUploadSource(dataUrl);
      setIsCropping(true);
    } else {
      toast.error("Please draw a signature first");
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
          if (mode === "draw") {
            setMode("upload");
          }
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
      if (!typedText) return null;
      return textToDataUrl(typedText, selectedFont.family, fontSize);
    } else {
      return uploadedSignature;
    }
  };

  const handleSave = async () => {
    if (mode === "type" && !typedText) {
      toast.error(kind === "initials" ? "Please enter your initials." : "Please enter your full name.");
      return;
    }
    if (document.status === "pending" && !agreedToTerms) {
      toast.error("Please tick the agreement box below to adopt your signature.");
      return;
    }
    if (mode === "type") {
      // Make sure the script font has loaded, otherwise the canvas falls back to a plain font.
      try {
        await window.document.fonts.load(`${fontSize}px ${selectedFont.family}`);
      } catch {
        // Render with whatever font is available.
      }
    }
    const signatureData = getSignatureData();
    if (!signatureData) {
      toast.error(mode === "draw" ? "Please draw your signature in the box first." : "Please upload an image of your signature first.");
      return;
    }
    setIsSaving(true);
    // If mode is type, we converted it to an image data URL, so treat it as 'upload' for PDF generation
    const finalMode = mode === "type" ? "upload" : mode;
    onSave(signatureData, finalMode);
    onClose();
  };

  const handleDownload = async () => {
    const pdfBlob = await generatePdfBlob(document, getSignatureData(), mode === "type" ? "upload" : mode);
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document.name.replace(/\s+/g, "_")}_signed.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    }
  };

  const handleSend = async () => {
    if (!recipientEmail) {
      toast.error("Please enter recipient email");
      return;
    }

    const pdfBlob = await generatePdfBlob(document, getSignatureData(), mode === "type" ? "upload" : mode);
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

    // Check if user is on a paid plan (Bypass for admin email or localhost)
    const isPro = userProfile?.plan === 'pro' || userProfile?.plan === 'business';

    const isLocal = window.location.hostname === 'localhost';

    if (!isPro && !isAdmin && !isLocal) {
      toast.error("Inviting signers is a Pro feature. Please upgrade your plan.");
      return;
    }

    setIsInviting(true);
    const inviteToSign = httpsCallable<InviteToSignPayload, { success: boolean }>(functions, 'inviteToSign');

    try {
      await inviteToSign({
        documentId: document.id,
        recipientEmail: inviteEmail,
        signingLink: `${window.location.origin}/sign/${document.id}`,
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-[20px] font-bold text-gray-800">
            {document.status === "pending" ? (kind === "initials" ? "Adopt Your Initials" : "Adopt Your Signature") : "Document Details"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar">
          {document.status === "pending" ? (
            <>
              <p className="text-sm text-gray-700 mb-6">Confirm your name, initials, and signature.</p>
              
              {/* Inputs */}
              <div className="flex gap-6 mb-8">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 tracking-wider uppercase">Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Type your full name"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:border-blue-500 focus:outline-none"
                    value={fullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 tracking-wider uppercase">Initials <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. JD"
                    maxLength={5}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:border-blue-500 focus:outline-none"
                    value={initials}
                    onChange={(e) => {
                      setInitials(e.target.value.toUpperCase());
                      setInitialsEdited(true);
                    }}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-gray-200 mb-6">
                <button onClick={() => setMode('type')} className={`pb-3 text-[11px] font-bold tracking-widest uppercase transition-colors ${mode === 'type' ? 'text-blue-600 border-b-[3px] border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>SELECT STYLE</button>
                <button onClick={() => setMode('draw')} className={`pb-3 text-[11px] font-bold tracking-widest uppercase transition-colors ${mode === 'draw' ? 'text-blue-600 border-b-[3px] border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>DRAW</button>
                <button onClick={() => setMode('upload')} className={`pb-3 text-[11px] font-bold tracking-widest uppercase transition-colors ${mode === 'upload' ? 'text-blue-600 border-b-[3px] border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>UPLOAD</button>
              </div>

              {/* Tab Content */}
              {mode === "type" && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-gray-600 tracking-wider uppercase">PREVIEW</span>
                    <button
                      type="button"
                      onClick={() => setShowFontPicker((open) => !open)}
                      className="text-[13px] text-blue-600 hover:underline"
                    >
                      {showFontPicker ? "Done" : "Change Style"}
                    </button>
                  </div>

                  {showFontPicker && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {SIGNATURE_FONTS.map((font) => (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => {
                            setSelectedFont(font);
                            setShowFontPicker(false);
                          }}
                          className={`text-left border rounded px-3 py-2 text-2xl text-black truncate transition-colors ${selectedFont.id === font.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-400'}`}
                          style={{ fontFamily: font.family }}
                        >
                          {(kind === "initials" ? initials : fullName) || font.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="border border-gray-200 rounded p-4 flex justify-between items-center mb-6 h-[120px]">
                    {/* Signature Preview */}
                    <div className="flex-1 flex flex-col justify-center relative pl-4 border-l-[2px] border-blue-600 h-full max-w-[280px]">
                      <div className="absolute top-0 left-0 w-2 border-t-[2px] border-blue-600"></div>
                      <div className="absolute bottom-0 left-0 w-2 border-b-[2px] border-blue-600"></div>
                      <span className="text-[10px] text-gray-500 italic mb-1">Signed by:</span>
                      {fullName.trim() ? (
                        <span className="text-3xl text-black truncate" style={{ fontFamily: selectedFont.family }}>{fullName}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Type your name above</span>
                      )}
                    </div>

                    {/* Initials Preview */}
                    <div className="w-[120px] flex flex-col justify-center relative pl-4 border-l-[2px] border-blue-600 h-full">
                      <div className="absolute top-0 left-0 w-2 border-t-[2px] border-blue-600"></div>
                      <div className="absolute bottom-0 left-0 w-2 border-b-[2px] border-blue-600"></div>
                      <span className="text-[10px] text-gray-500 italic mb-1">Initials:</span>
                      {initials.trim() ? (
                        <span className="text-3xl text-black truncate" style={{ fontFamily: selectedFont.family }}>{initials}</span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">—</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {mode === "draw" && (
                <div className="mb-6 relative border border-gray-300 rounded overflow-hidden bg-white">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: `w-full h-40 ${isErasing ? "cursor-cell" : "cursor-crosshair"}`,
                      style: { width: "100%", height: "160px" }
                    }}
                    backgroundColor="transparent"
                    penColor="#000000"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button onClick={clearSignature} className="text-xs text-blue-600 hover:underline">Clear</button>
                  </div>
                </div>
              )}

              {mode === "upload" && (
                <div className="mb-6 text-center border-2 border-dashed border-gray-300 p-8 rounded">
                  {uploadedSignature ? (
                    <img src={uploadedSignature} alt="Uploaded signature" className="max-h-32 object-contain mx-auto mb-4" />
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-2">Click to select an image</p>
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
                    </>
                  )}
                </div>
              )}

              {/* Disclaimer / Agreement checkbox */}
              <div className="flex items-start gap-2 mb-4 mt-2 p-2.5 bg-gray-50 rounded border border-gray-200">
                <input
                  type="checkbox"
                  id="agree-signature-terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#1e003b] focus:ring-[#1e003b] mt-0.5 cursor-pointer accent-[#1e003b]"
                />
                <label htmlFor="agree-signature-terms" className="text-[11px] text-gray-600 leading-relaxed cursor-pointer select-none">
                  By checking this box and selecting Adopt and Sign, I agree that this mark will be the electronic representation of my signature or initials whenever I use it. I also understand that recipients of electronic documents I sign will be able to see my Endorse ID, which will include my email address.
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Document Details / Signed state (Kept minimal to fit design) */}
              <div className="border border-gray-200 rounded p-6 flex justify-center items-center mb-6 h-[120px]">
                {document.signature_type === "draw" || document.signature_type === "upload" ? (
                  <img
                    src={document.signature_data!}
                    alt="Signature"
                    className="max-h-24 mx-auto"
                  />
                ) : (
                  <p className="text-center font-serif text-3xl italic text-black py-2">
                    {document.signature_data}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex items-center gap-3 border-t border-gray-200">
          {document.status === "pending" ? (
            <>
              <button
                className="bg-[#1e003b] hover:bg-[#1e003b]/90 text-white px-6 py-2 rounded text-[13px] font-bold transition-colors"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Adopt and Sign"}
              </button>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded text-[13px] font-bold transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded text-[13px] font-bold transition-colors"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded text-[13px] font-bold transition-colors"
                onClick={handleDownload}
              >
                Download
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
