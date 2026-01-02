import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export const FloatingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 px-4",
        isScrolled ? "pt-4" : "pt-8"
      )}
    >
      <div
        className={cn(
          "relative w-full max-w-5xl rounded-full border backdrop-blur-md transition-all duration-300 flex items-center justify-between px-6 py-3",
          isScrolled
            ? "bg-background/80 border-border/40 shadow-lg"
            : "bg-white/5 border-white/10 shadow-sm"
        )}
      >
        {/* Logo Section */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-[150px] w-auto" />
          </Link>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FFC83D] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium hover:bg-white/10 rounded-full px-4"
            >
              Log in
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              size="sm"
              className="rounded-full px-6 bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-medium text-sm shadow-[0_0_15px_-3px_rgba(255,200,61,0.4)]"
            >
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-foreground hover:bg-white/10 rounded-full"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-24 left-4 right-4 p-5 rounded-3xl bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl md:hidden flex flex-col gap-4 animate-in slide-in-from-top-5 fade-in duration-200">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-base font-medium text-foreground p-3 hover:bg-accent rounded-xl transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="h-px bg-border/50 my-1" />
          <div className="flex flex-col gap-3">
            <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start rounded-xl">
                Log in
              </Button>
            </Link>
            <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 rounded-xl">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};