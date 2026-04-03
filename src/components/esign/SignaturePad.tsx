import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Type, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface SignaturePadProps {
  onSignatureCreate: (dataUrl: string) => void;
}

export const SignaturePad = ({ onSignatureCreate }: SignaturePadProps) => {
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState("");
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    setTypedSignature("");
  };

  const saveSignature = () => {
    let signatureDataUrl: string | null = null;

    if (mode === "draw") {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        signatureDataUrl = sigCanvas.current.toDataURL("image/png");
      }
    } else {
      if (typedSignature.trim() !== "") {
        // Create a data URL from the typed text
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 150;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.font = "italic 48px 'Times New Roman'";
          ctx.fillStyle = "#000";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
          signatureDataUrl = canvas.toDataURL("image/png");
        }
      }
    }

    if (signatureDataUrl) {
      onSignatureCreate(signatureDataUrl);
    } else {
      toast.error("Please create a signature first.");
    }
  };

  return (
    <Card className="gradient-card border-border/50 shadow-soft">
      <CardHeader>
        <CardTitle className="font-display font-semibold">Create Your Signature</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button variant={mode === 'draw' ? 'secondary' : 'ghost'} onClick={() => setMode('draw')} className="flex-1"><PenTool className="w-4 h-4 mr-2" />Draw</Button>
          <Button variant={mode === 'type' ? 'secondary' : 'ghost'} onClick={() => setMode('type')} className="flex-1"><Type className="w-4 h-4 mr-2" />Type</Button>
        </div>

        {mode === "draw" ? (
          <div className="bg-background rounded-md border border-input">
            <SignatureCanvas
              ref={sigCanvas}
              penColor="#000000"
              canvasProps={{ className: "w-full h-[150px]" }}
            />
          </div>
        ) : (
          <Input
            placeholder="Type your name"
            value={typedSignature}
            onChange={(e) => setTypedSignature(e.target.value)}
            className="text-2xl font-serif italic text-center h-auto py-4"
          />
        )}
        <div className="flex justify-between items-center mt-4">
          <Button variant="ghost" onClick={clear}><RotateCcw className="w-4 h-4 mr-2" />Clear</Button>
          <Button onClick={saveSignature}>Use Signature</Button>
        </div>
      </CardContent>
    </Card>
  );
};