import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className }: LogoProps) => {
  return (
    <img
      src="/logo.svg"
      alt="ENDORSE Logo"
      className={cn("h-12 w-auto", className)}
    />
  );
};