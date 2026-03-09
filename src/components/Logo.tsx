import { PenTool } from "lucide-react";
import logo from "../assets/images/logo.png";

export const Logo = ({ className }: { className?: string }) => {
  const logoSrc = logo;

  return logoSrc ? (
    <img src={logoSrc} alt="Logo" className={`shrink-0 object-contain rounded-xl ${className}`} />
  ) : (
    <div className={`flex aspect-square shrink-0 items-center justify-center rounded-xl border-2 border-yellow-400 bg-primary text-primary-foreground shadow-sm ${className}`}>
      <PenTool className="h-1/2 w-1/2 text-yellow-400" />
    </div>
  );
};