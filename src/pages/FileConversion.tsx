import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft, ArrowRight, CheckCircle2, Combine, Download, FileImage, FileText, FileType, ImagePlus, Loader2, Lock, ShieldCheck, Sparkles, Upload, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { httpsCallable } from "@/lib/callable";
import { functions } from "@/components/client";

const tools = [
  {
    id: "word-to-pdf",
    title: "Word to PDF",
    description: "Convert DOC and DOCX files to PDF instantly.",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "group-hover:border-blue-200",
    accept: ".doc,.docx",
    targetFormat: "pdf"
  },
  {
    id: "pdf-to-word",
    title: "PDF to Word",
    description: "Turn your PDF files into editable Word documents.",
    icon: FileType,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "group-hover:border-red-200",
    accept: ".pdf",
    targetFormat: "docx"
  },
  {
    id: "image-to-pdf",
    title: "Image to PDF",
    description: "Convert JPG and PNG images to PDF format.",
    icon: ImagePlus,
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "group-hover:border-teal-200",
    accept: ".jpg,.jpeg,.png",
    targetFormat: "pdf"
  },
  {
    id: "pdf-to-image",
    title: "PDF to Image",
    description: "Extract pages from your PDF as high-quality images.",
    icon: FileImage,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "group-hover:border-orange-200",
    accept: ".pdf",
    targetFormat: "jpg"
  },
  {
    id: "merge-pdf",
    title: "Merge PDF",
    description: "Combine multiple PDF files into one single document.",
    icon: Combine,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "group-hover:border-green-200",
    accept: ".pdf",
    targetFormat: "pdf",
    multiple: true
  },
  {
    id: "lock-pdf",
    title: "Protect PDF",
    description: "Add a password to your PDF document for security.",
    icon: Lock,
    color: "text-slate-700",
    bgColor: "bg-slate-100",
    borderColor: "group-hover:border-slate-300",
    accept: ".pdf",
    targetFormat: "pdf"
  }
];

const FileConversion = () => {
  const [selectedTool, setSelectedTool] = useState<typeof tools[0] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [password, setPassword] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);

  const handleToolSelect = (tool: typeof tools[0]) => {
    setSelectedTool(tool);
    setFiles([]);
    setPassword("");
    setConvertedBlob(null);
    setIsSuccess(false);
    setIsDragging(false);
  };

  const handleBack = () => {
    setSelectedTool(null);
    setFiles([]);
    setPassword("");
    setConvertedBlob(null);
    setIsSuccess(false);
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedTool?.multiple) {
        setFiles(prev => [...prev, ...selectedFiles]);
      } else {
        setFiles([selectedFiles[0]]);
      }
      setIsSuccess(false);
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

    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (selectedTool?.multiple) {
        setFiles(prev => [...prev, ...droppedFiles]);
      } else {
        setFiles([droppedFiles[0]]);
      }
      setIsSuccess(false);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0 || !selectedTool) {
      toast.error("Please select a file.");
      return;
    }

    if (selectedTool.id === "lock-pdf" && !password) {
      toast.error("Please enter a password.");
      return;
    }

    setIsConverting(true);
    try {
      const filePromises = files.map(f => {
        return new Promise<{base64: string, name: string, type: string}>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            base64: (reader.result as string).split(',')[1],
            name: f.name,
            type: f.type
          });
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      });

      const processedFiles = await Promise.all(filePromises);

      const convertDocument = httpsCallable(functions, 'convertDocument');
      const result = await convertDocument({
        files: processedFiles, // Send all files
        targetFormat: selectedTool.targetFormat,
        toolId: selectedTool.id,
        password: password
      });

      const data = result.data as { pdfBase64?: string; fileBase64?: string };
      const outputBase64 = data.pdfBase64 || data.fileBase64;

      if (!outputBase64) {
        throw new Error("No data returned from conversion service");
      }

      const byteCharacters = atob(outputBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      let mimeType = "application/pdf";
      if (selectedTool.targetFormat === "docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (selectedTool.targetFormat === "jpg") mimeType = "image/jpeg";

      const blob = new Blob([byteArray], { type: mimeType });
      setConvertedBlob(blob);
      setIsSuccess(true);
      toast.success(`Successfully converted to ${selectedTool.targetFormat.toUpperCase()}`);
    } catch (error: any) {
      console.error("Conversion error:", error);
      const errorMessage = error.message || "Conversion failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !selectedTool || files.length === 0) return;

    const url = URL.createObjectURL(convertedBlob);
    const link = document.createElement('a');
    link.href = url;

    const baseName = files.length > 1 ? "merged_document" : files[0].name.substring(0, files[0].name.lastIndexOf('.'));
    const newFileName = baseName + '.' + selectedTool.targetFormat;
    link.download = newFileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Download started!");
  };

  const handleReset = () => {
    setFiles([]);
    setPassword("");
    setIsSuccess(false);
    setConvertedBlob(null);
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {!selectedTool ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Hero Section */}
            <div className="relative py-12 md:py-20 px-4 md:px-6 overflow-hidden bg-gradient-to-b from-secondary/30 to-background">
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div className="container max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 shadow-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>Professional Document Tools</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
                  Convert Documents <br className="hidden sm:block" />
                  <span className="text-[#0A66C2]">With Confidence</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Secure, fast, and enterprise-grade conversion tools for all your document needs. No registration required for basic tasks.
                </p>
              </div>
            </div>

            <div className="container max-w-6xl mx-auto px-4 md:px-6 -mt-8 grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              {tools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => handleToolSelect(tool)}
                  className={`group relative bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden ${tool.borderColor}`}
                >
                  <div className={`absolute top-0 right-0 p-20 ${tool.bgColor} rounded-bl-full opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                  <div className="relative z-10 flex items-start gap-6">
                    <div className={`p-4 rounded-xl ${tool.bgColor} ${tool.color} group-hover:scale-110 transition-transform duration-300`}>
                      {tool.icon && <tool.icon className="w-8 h-8" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Section */}
            <div className="container max-w-6xl mx-auto px-4 md:px-6 mt-24">
              <div className="grid md:grid-cols-2 gap-8 text-center max-w-4xl mx-auto">
                <div className="p-6 rounded-2xl bg-secondary/20 border border-border/50">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Lightning Fast</h3>
                  <p className="text-muted-foreground text-sm">Our cloud servers process your documents in seconds, not minutes.</p>
                </div>
                <div className="p-6 rounded-2xl bg-secondary/20 border border-border/50">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">High Quality</h3>
                  <p className="text-muted-foreground text-sm">We preserve your document formatting, images, and layout perfectly.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container max-w-4xl mx-auto py-12 px-4 md:px-6 animate-in fade-in zoom-in-95 duration-300">
            <Button variant="ghost" onClick={handleBack} className="mb-8 hover:bg-transparent pl-0 hover:text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Button>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
                {selectedTool.icon && <selectedTool.icon className={`w-8 h-8 ${selectedTool.color}`} />}
                {selectedTool.title}
              </h2>
              <p className="text-muted-foreground">{selectedTool.description}</p>
            </div>

            <Card className="border-2 border-dashed border-border shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden relative">
              <div className={`absolute inset-0 ${selectedTool.bgColor} opacity-5 pointer-events-none`} />
              <CardContent className="p-8 md:p-16 flex flex-col items-center justify-center gap-8 min-h-[400px]">
                {files.length === 0 ? (
                  <div
                    className={`w-full flex flex-col items-center justify-center p-10 rounded-3xl transition-all duration-300 border-2 border-dashed ${isDragging
                      ? "border-primary bg-primary/5 scale-[1.02]"
                      : "border-transparent"
                      }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-6 group w-full">
                      <div className={`w-24 h-24 ${selectedTool.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                        <Upload className={`w-10 h-10 ${selectedTool.color}`} />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {selectedTool.multiple ? "Upload PDF Files to Merge" : "Drag & Drop or Click to Upload"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supported files: <span className="font-mono bg-secondary px-1 rounded">{selectedTool.accept.replace(/,/g, ', ')}</span>
                        </p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept={selectedTool.accept}
                        multiple={selectedTool.multiple}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="w-full max-w-md space-y-8">
                    <div className="space-y-3">
                      {files.map((f, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 ${selectedTool.bgColor} rounded-lg`}>
                              {selectedTool.icon && <selectedTool.icon className={`w-6 h-6 ${selectedTool.color}`} />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[200px]">{f.name}</p>
                              <p className="text-xs text-muted-foreground">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))} 
                            disabled={isConverting}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      {selectedTool.multiple && !isSuccess && (
                        <Button variant="outline" className="w-full border-dashed" asChild>
                          <label htmlFor="add-more" className="cursor-pointer">
                            + Add More Files
                            <input id="add-more" type="file" className="hidden" onChange={handleFileChange} accept={selectedTool.accept} multiple />
                          </label>
                        </Button>
                      )}
                    </div>

                    {selectedTool.id === "lock-pdf" && !isSuccess && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Set PDF Password</label>
                        <input
                          type="password"
                          placeholder="Enter password to protect PDF"
                          className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary outline-none"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    )}

                    {!isSuccess ? (
                      <Button
                        size="lg"
                        className="w-full h-14 text-lg bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 shadow-lg shadow-orange-500/10"
                        onClick={handleConvert}
                        disabled={isConverting}
                      >
                        {isConverting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                        {selectedTool.id === "merge-pdf" ? `Merge ${files.length} Files` : `Convert to ${selectedTool.targetFormat.toUpperCase()}`}
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-green-600 justify-center font-medium p-4 bg-green-50 rounded-xl border border-green-100">
                          <CheckCircle2 className="w-5 h-5" /> {selectedTool.id === "merge-pdf" ? "Merging Complete" : "Conversion Complete"}
                        </div>
                        <Button className="w-full h-14 text-lg font-semibold" size="lg" onClick={handleDownload}>
                          <Download className="w-5 h-5 mr-2" /> Download {selectedTool.targetFormat.toUpperCase()}
                        </Button>
                        <Button variant="ghost" onClick={handleReset}>Start Over</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default FileConversion;