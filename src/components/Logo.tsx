import { PenTool } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png";

export const Logo = ({ className }: { className?: string }) => {
  const logoSrc = logo;

  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      {logoSrc ? (
        <img src={logoSrc} alt="Logo" className="h-full w-auto shrink-0 object-contain rounded-xl" />
      ) : (
        <div className="flex h-full aspect-square shrink-0 items-center justify-center rounded-xl border-2 border-yellow-400 bg-primary text-primary-foreground shadow-sm">
          <PenTool className="h-1/2 w-1/2 text-yellow-400" />
        </div>
      )}
    </Link>
  );
};