import { PenTool } from "lucide-react";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <PenTool className="h-5 w-5" />
      </div>
      <span className="font-display text-xl font-bold text-inherit">Endorse</span>
    </div>
  );
};