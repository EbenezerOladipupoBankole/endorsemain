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

interface SignaturePosition {
  x: number;
  y: number;
  page: number;
}

const Index = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const handleFileSelect = (file: File) => {
    setPdfFile(file);
    setSignaturePosition(null);
    toast.success("PDF uploaded successfully!");
  };

  const handleSignatureCreate = (dataUrl: string) => {
    setSignatureImage(dataUrl);
    setSignaturePosition(null);
    toast.success("Signature created!");
  };

  const handleModalSave = (signatureData: string) => {
    setSignatureImage(signatureData);
    setShowSignatureModal(false);
    toast.success("Signature created! Click on the document to place it.");
  };

  const handleSignaturePlace = (position: SignaturePosition) => {
    setSignaturePosition(position);
  };

  const handleSignatureMove = (position: SignaturePosition) => {
    setSignaturePosition(position);
  };

  const handleDownload = async () => {
    if (!pdfFile || !signatureImage || !signaturePosition) return;

    setIsDownloading(true);
    try {
      const pdfBytes = await embedSignatureInPDF(pdfFile, signatureImage, signaturePosition);
      const filename = pdfFile.name.replace(".pdf", "_signed.pdf");
      downloadPDF(pdfBytes, filename);
      toast.success("Signed PDF downloaded!");
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
    setSignaturePosition(null);
  };

  const canDownload = pdfFile && signatureImage && signaturePosition;

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo className="h-8 w-auto" />
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <a href="#" className="text-foreground transition-colors">Dashboard</a>
              <a href="#" className="hover:text-foreground transition-colors">Documents</a>
              <a href="#" className="hover:text-foreground transition-colors">Templates</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {pdfFile && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-4 w-4 mr-2" />
                Exit Editor
              </Button>
            )}
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-medium text-muted-foreground">
              JD
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!pdfFile ? (
          /* Dashboard Home State */
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <Logo className="h-12 w-auto mb-2" />
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Welcome back. Manage your documents and signatures.</p>
              </div>
              <Button className="bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-medium">
                <PenTool className="w-4 h-4 mr-2" />
                New Document
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Signed</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">66% completion rate</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4</div>
                  <p className="text-xs text-muted-foreground">Requires attention</p>
                </CardContent>
              </Card>
            </div>

            {/* Upload Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Quick Action</h2>
              <Card className="border-dashed border-2 border-muted-foreground/20 bg-card/50 hover:bg-card/80 transition-colors">
                <CardContent className="pt-10 pb-10">
                  <PDFUploader onFileSelect={handleFileSelect} currentFile={pdfFile} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Editor State */
          <div className="flex flex-col lg:flex-row gap-8 items-start max-w-7xl mx-auto">
            {/* Sidebar Tools */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-6 sticky top-24">
              <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PenTool className="w-4 h-4" />
                    Signature Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Create Signature</label>
                    <Button onClick={() => setShowSignatureModal(true)} className="w-full mb-2" variant="outline">
                      <PenTool className="w-4 h-4 mr-2" />
                      Create Signature
                    </Button>
                    <SignaturePad onSignatureCreate={handleSignatureCreate} />
                  </div>

                  {signatureImage && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                      <label className="text-sm font-medium text-muted-foreground">Preview</label>
                      <div className="border border-border rounded-lg p-4 bg-background/50 flex justify-center">
                      <img
                        src={signatureImage}
                        alt="Your signature"
                          className="max-h-16 object-contain"
                      />
                    </div>
                    <Button
                      variant="ghost"
                        size="sm"
                        className="w-full text-xs h-8 mt-2"
                      onClick={() => {
                        setSignatureImage(null);
                        setSignaturePosition(null);
                      }}
                    >
                        Clear Signature
                    </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {canDownload && (
                <Card className="shadow-md border-primary/20 bg-primary/5 overflow-hidden">
                  <CardContent className="p-4">
                    <Button
                      className="w-full bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-semibold shadow-sm"
                      size="lg"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? "Processing..." : "Download Signed PDF"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 min-w-0">
              <Card className="shadow-sm border-border/60 h-[calc(100vh-12rem)] flex flex-col">
                <CardHeader className="py-4 px-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/20">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-background rounded-md border border-border/50">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="truncate">
                      <CardTitle className="text-sm font-medium truncate">{pdfFile.name}</CardTitle>
                      <CardDescription className="text-xs truncate">
                    {signatureImage
                      ? signaturePosition
                        ? "Drag the signature to reposition it"
                        : "Click on the document to place your signature"
                      : "Create your signature first, then place it on the document"}
                  </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 bg-muted/10 overflow-hidden relative">
                  <div className="absolute inset-0 overflow-auto p-4 flex justify-center">
                  <PDFViewer
                    file={pdfFile}
                    signatureImage={signatureImage}
                    signaturePosition={signaturePosition}
                    onSignaturePlace={handleSignaturePlace}
                    onSignatureMove={handleSignatureMove}
                  />
                  </div>
                </CardContent>
              </Card>
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

export default Index;
