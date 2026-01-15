import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { 
  Upload, FileType, ArrowRight, Download, Loader2, 
  FileText, Image as ImageIcon, CheckCircle2, X, 
  ArrowLeft, FileImage, Zap, LayoutGrid, Sparkles, Lock
} from "lucide-react";
import { toast } from "sonner";

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
    icon: ImageIcon,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "group-hover:border-purple-200",
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
  }
];

const FileConversion = () => {
  const [selectedTool, setSelectedTool] = useState<typeof tools[0] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleToolSelect = (tool: typeof tools[0]) => {
    setSelectedTool(tool);
    setFile(null);
    setIsSuccess(false);
    setIsDragging(false);
  };

  const handleBack = () => {
    setSelectedTool(null);
    setFile(null);
    setIsSuccess(false);
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // In a production app, you might want to validate file type here
      setFile(e.dataTransfer.files[0]);
      setIsSuccess(false);
    }
  };

  const handleConvert = async () => {
    if (!file || !selectedTool) {
      toast.error("Please select a file.");
      return;
    }

    setIsConverting(true);

    // SIMULATION: In a real app, you would upload 'file' to Firebase Storage,
    // then trigger a Cloud Function or call a conversion API here.
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Fake delay
      setIsSuccess(true);
      toast.success(`Successfully converted to ${selectedTool.targetFormat.toUpperCase()}`);
    } catch (error) {
      toast.error("Conversion failed. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsSuccess(false);
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {!selectedTool ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Hero Section */}
            <div className="relative py-20 px-4 md:px-6 overflow-hidden bg-gradient-to-b from-secondary/30 to-background">
              <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              <div className="container max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 shadow-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>Professional Document Tools</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
                  Convert Documents <br className="hidden sm:block" />
                  <span className="text-primary">With Confidence</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
                      <tool.icon className="w-8 h-8" />
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
                    <ArrowRight className={`w-6 h-6 ${tool.color}`} />
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
                    <CheckCircle2 className="w-6 h-6" />
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
                <selectedTool.icon className={`w-8 h-8 ${selectedTool.color}`} />
                {selectedTool.title}
              </h2>
              <p className="text-muted-foreground">{selectedTool.description}</p>
            </div>

            <Card className="border-2 border-dashed border-border shadow-2xl bg-card/50 backdrop-blur-sm overflow-hidden relative">
              <div className={`absolute inset-0 ${selectedTool.bgColor} opacity-5 pointer-events-none`} />
              <CardContent className="p-8 md:p-16 flex flex-col items-center justify-center gap-8 min-h-[400px]">
                {!file ? (
                  <div 
                    className={`w-full flex flex-col items-center justify-center p-10 rounded-3xl transition-all duration-300 border-2 border-dashed ${
                      isDragging 
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
                          Drag & Drop or Click to Upload
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
                      />
                    </label>
                  </div>
                ) : (
                  <div className="w-full max-w-md space-y-8">
                    <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 ${selectedTool.bgColor} rounded-lg`}>
                          <selectedTool.icon className={`w-6 h-6 ${selectedTool.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleReset} disabled={isConverting}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {!isSuccess ? (
                      <Button 
                        size="lg" 
                        className="w-full h-14 text-lg bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 shadow-lg shadow-orange-500/10" 
                        onClick={handleConvert} 
                        disabled={isConverting}
                      >
                        {isConverting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                        Convert to {selectedTool.targetFormat.toUpperCase()}
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 text-green-600 justify-center font-medium p-4 bg-green-50 rounded-xl border border-green-100">
                          <CheckCircle2 className="w-5 h-5" /> Conversion Complete
                        </div>
                        <Button className="w-full h-14 text-lg font-semibold" size="lg">
                          <Download className="w-4 h-4 mr-2" /> Download {selectedTool.targetFormat.toUpperCase()}
                        </Button>
                        <Button variant="ghost" onClick={handleReset}>Convert Another File</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default FileConversion;