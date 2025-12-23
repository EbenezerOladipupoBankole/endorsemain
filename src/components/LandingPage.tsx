import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight, FileSignature, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthContext";
import { toast } from "sonner";

const LandingPage = () => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDemoClick = () => {
    toast.info("Demo mode coming soon!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Navigation */}
      <header className={`sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${isScrolled ? "h-24" : "h-40"}`}>
        <div className="container flex h-full items-center justify-between px-4 md:px-6">
          <Logo className={`w-auto transition-all duration-300 ${isScrolled ? "h-20" : "h-36"}`} />
          <nav className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container px-4 md:px-6 py-24 md:py-32 flex flex-col items-center text-center space-y-8">
          <div className="space-y-4 max-w-4xl animate-fade-in">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl text-foreground">
              The Professional Way to <br className="hidden sm:inline" />
              <span className="text-[#FFC83D]">Sign & Endorse</span> Documents
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed">
              Secure, legally binding electronic signatures for everyone. 
              Streamline your workflow with Endorse's intuitive document management platform.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-200">
             <Link to={user ? "/dashboard" : "/auth"}>
              <Button size="lg" className="h-12 px-8 text-lg shadow-lg hover:shadow-xl transition-all bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black">
                Start Signing Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 px-8 text-lg"
              onClick={handleDemoClick}
            >
              View Demo
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container px-4 md:px-6 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="group flex flex-col items-center text-center space-y-4 p-8 bg-card rounded-2xl shadow-sm border border-border hover:shadow-md transition-all duration-300">
              <div className="p-4 bg-[#FFC83D]/10 rounded-full group-hover:bg-[#FFC83D]/20 transition-colors">
                <FileSignature className="h-8 w-8 text-[#FFC83D]" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Easy Signing</h3>
              <p className="text-muted-foreground">
                Draw, type, or upload your signature. Our intuitive interface makes signing documents effortless on any device.
              </p>
            </div>
            <div className="group flex flex-col items-center text-center space-y-4 p-8 bg-card rounded-2xl shadow-sm border border-border hover:shadow-md transition-all duration-300">
              <div className="p-4 bg-[#FFC83D]/10 rounded-full group-hover:bg-[#FFC83D]/20 transition-colors">
                <Shield className="h-8 w-8 text-[#FFC83D]" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Secure & Legal</h3>
              <p className="text-muted-foreground">
                Bank-level encryption ensures your documents are safe. Signatures are legally binding and audit-ready.
              </p>
            </div>
            <div className="group flex flex-col items-center text-center space-y-4 p-8 bg-card rounded-2xl shadow-sm border border-border hover:shadow-md transition-all duration-300">
              <div className="p-4 bg-[#FFC83D]/10 rounded-full group-hover:bg-[#FFC83D]/20 transition-colors">
                <Zap className="h-8 w-8 text-[#FFC83D]" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Instant Delivery</h3>
              <p className="text-muted-foreground">
                Send signed PDFs directly to recipients via email. Track status and download copies instantly.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container px-4 md:px-6 py-24">
          <div className="bg-primary rounded-3xl p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Ready to streamline your paperwork?
              </h2>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
                Join thousands of professionals who trust Endorse for their electronic signature needs.
              </p>
              <Link to="/auth">
                <Button size="lg" className="mt-4 h-12 px-8 text-lg font-semibold bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black">
                  Get Started for Free
                </Button>
              </Link>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container px-4 md:px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-auto" />
              <span className="text-sm text-muted-foreground ml-2">© {new Date().getFullYear()} Endorse.</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;