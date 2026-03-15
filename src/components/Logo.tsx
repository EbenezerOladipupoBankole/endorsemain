import { PenTool } from "lucide-react";
import logo from "../assets/images/logo.png";
import { useAuth } from "@/components/AuthContext";

export const Logo = ({ className, customLogoUrl }: { className?: string, customLogoUrl?: string }) => {
  const { userProfile } = useAuth();
  const logoSrc = customLogoUrl || userProfile?.branding?.logoUrl || logo;

  return logoSrc ? (
    <img src={logoSrc} alt="Logo" className={`shrink-0 object-contain rounded-xl ${className}`} />
  ) : (
    <div className={`flex aspect-square shrink-0 items-center justify-center rounded-xl border-2 border-yellow-400 bg-primary text-primary-foreground shadow-sm ${className}`}>
      <PenTool className="h-1/2 w-1/2 text-yellow-400" />
    </div>
  );
};