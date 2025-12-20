import { useCallback } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFUploaderProps {
  onFileSelect: (file: File) => void;
  currentFile: File | null;
}

export const PDFUploader = ({ onFileSelect, currentFile }: PDFUploaderProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        onFileSelect(file);
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
            Drop your PDF here
          </p>
          <p className="text-sm text-muted-foreground mb-4">or</p>
        </>
      )}
      <label>
        <input
          type="file"
          accept=".pdf"
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
