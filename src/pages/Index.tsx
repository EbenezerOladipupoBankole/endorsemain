import { useState } from "react";
import { PDFUploader } from "@/components/esign/PDFUploader";
import { PDFViewer } from "@/components/esign/PDFViewer";
import { SignaturePad } from "@/components/esign/SignaturePad";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, FileText, CheckCircle2, Clock, ChevronRight, PenTool, Layout, Settings, LogOut } from "lucide-react";
import { embedSignatureInPDF, downloadPDF } from "@/lib/pdfUtils";
import { toast } from "sonner";
import SignatureModal from "@/components/SignatureModal";
import { getFunctions, httpsCallable } from "firebase/functions";

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

// Helper to convert Word to PDF via Cloud Function
const convertWordToPDF = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const functions = getFunctions();
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

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signaturePositions, setSignaturePositions] = useState<SignaturePosition[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const handleFileSelect = async (file: File) => {
    const isPDF = file.type === "application/pdf";
    const isWord = file.type === "application/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isPDF && !isWord) {
      toast.error("Please upload a PDF or Word document.");
      return;
    }

    if (isPDF) {
      setPdfFile(file);
      setSignaturePositions([]);
      toast.success("PDF uploaded successfully!");
    } else if (isWord) {
      const toastId = toast.loading("Converting Word document to PDF...");
      try {
        const pdfBlob = await convertWordToPDF(file);
        const convertedFile = new File([pdfBlob], file.name.replace(/\.(doc|docx)$/i, '.pdf'), { type: 'application/pdf' });
        setPdfFile(convertedFile);
        setSignaturePositions([]);
        toast.success("Document converted successfully", { id: toastId });
      } catch (error) {
        console.error("Error converting Word to PDF:", error);
        toast.error("Failed to convert Word document to PDF", { id: toastId });
      }
    }
  };

  const handleSignatureCreate = (dataUrl: string) => {
    setSignatureImage(dataUrl);
    setSignaturePositions([]);
    toast.success("Signature created!");
  };

  const handleSignaturePlace = (position: SignaturePosition) => {
    setSignaturePositions(prev => [...prev, position]);
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
    if (!pdfFile || !signatureImage || signaturePositions.length === 0) return;

    setIsDownloading(true);
    try {
      let currentFile = pdfFile;
      let signedPdfBytes = null;

      for (const position of signaturePositions) {
        signedPdfBytes = await embedSignatureInPDF(currentFile, signatureImage, position);
        currentFile = new File([signedPdfBytes], pdfFile.name, { type: 'application/pdf' });
      }

      const filename = pdfFile.name.replace(".pdf", "_signed.pdf");
      if (signedPdfBytes) {
        downloadPDF(signedPdfBytes, filename);
        toast.success("Signed PDF downloaded!");
      }
    } catch (error) {
      console.error("Error creating signed PDF:", error);
      toast.error("Failed to create signed PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleReset = () => {
    setPdfFile(null);
    setSignatureImage(null);
    setSignaturePositions([]);
  };

  const handleModalSave = (signatureData: string) => {
    setSignatureImage(signatureData);
    setSignaturePositions([]);
    setShowSignatureModal(false);
    toast.success("Signature saved!");
  };

  const canDownload = pdfFile && signatureImage && signaturePositions.length > 0;
  // ...
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <Logo className="mb-8" />
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">E-Signature Document</CardTitle>
          <CardDescription>Upload a PDF, add your signature, and download the signed document.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="md:col-span-1 space-y-4">
              <PDFUploader onFileSelect={handleFileSelect} currentFile={pdfFile} />
              <SignaturePad onSignatureCreate={handleSignatureCreate} />
              <Button
                onClick={() => setShowSignatureModal(true)}
                className="w-full"
                variant="outline"
                disabled={!pdfFile}
              >
                <PenTool className="mr-2 h-4 w-4" /> Open Signature Modal
              </Button>
              <Button
                onClick={handleDownload}
                className="w-full"
                disabled={!canDownload || isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Download Signed PDF
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                className="w-full"
                variant="outline"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
            <div className="md:col-span-2">
              {pdfFile ? (
                <PDFViewer
                  file={pdfFile}
                  signatureImage={signatureImage}
                  signaturePositions={signaturePositions}
                  onSignaturePlace={handleSignaturePlace}
                  onSignatureMove={handleSignatureMove}
                  onSignatureDelete={(index) => {
                    setSignaturePositions(prev => prev.filter((_, i) => i !== index));
                  }}
                />
              ) : (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                  <FileText className="mr-2 h-6 w-6" /> Upload a PDF to get started
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div >
  );
};

export default Index;
