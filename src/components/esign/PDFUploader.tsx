import { useCallback } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
  accept?: string;
}

export const PDFUploader = ({ onFileSelect, currentFile, accept = ".pdf" }: PDFUploaderProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        // Simple extension check if type is not reliable for Word documents on some OS/Browsers
        const isPDF = file.type === "application/pdf";
        const isWord = file.name.match(/\.(doc|docx)$/i) || 
                       file.type === "application/msword" || 
                       file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                       
        if (isPDF || isWord) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {currentFile ? (
        <div className="flex items-center justify-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div className="text-left">
            <p className="font-medium text-foreground">{currentFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(currentFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      ) : (
        <>
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground mb-2">
            Drop your document here
          </p>
          <p className="text-sm text-muted-foreground mb-4">PDF or Word documents</p>
          <p className="text-sm text-muted-foreground mb-4 font-bold text-primary">or</p>
        </>
      )}
      <label>
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        <Button variant="outline" asChild>
          <span className="cursor-pointer">
            {currentFile ? "Choose Different File" : "Browse Files"}
          </span>
        </Button>
      </label>
    </div>
  );
};
