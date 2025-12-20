import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { PenTool, Shield, Zap, FileText, Users, Send, Check, ArrowRight, Star, X, Menu, Twitter, Linkedin, Facebook, Instagram } from "lucide-react";

const Landing = () => {
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [selectedPlan, setSelectedPlan] = useState<"Free" | "Pro" | "Business">("Pro");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-10 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-medium">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero" size="sm" className="font-medium">Get Started Free</Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-foreground p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5">
            <a href="#features" className="text-sm font-medium p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-sm font-medium p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" className="text-sm font-medium p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
            <div className="flex flex-col gap-3 mt-2">
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Sign In</Button>
              </Link>
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button variant="hero" className="w-full">Get Started Free</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 bg-gradient-mesh relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/40 via-background to-background" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent border border-border text-xs font-medium text-accent-foreground mb-8 animate-fade-up">
              <Star className="w-3.5 h-3.5 fill-current" />
              Trusted by 50,000+ professionals worldwide
            </div>
            
            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight animate-fade-up-delay-1">
              Document Signing<br />
              <span className="text-gradient">Made Effortless</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up-delay-2">
              The modern way to sign, send, and manage documents. 
              Create legally binding signatures in seconds with our intuitive platform.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up-delay-3">
              <Link to="/auth">
                <Button variant="hero" size="lg" className="w-full sm:w-auto group">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-12 pt-8 border-t border-border/50">
              {["No credit card required", "Free 14-day trial", "Cancel anytime"].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-success" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute -inset-4 bg-gradient-primary opacity-5 blur-3xl rounded-3xl" />
            <div className="relative bg-card rounded-2xl shadow-card border border-border overflow-hidden">
              <div className="bg-secondary/50 px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/70" />
                  <div className="w-3 h-3 rounded-full bg-warning/70" />
                  <div className="w-3 h-3 rounded-full bg-success/70" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground font-medium">Endorse Dashboard</span>
                </div>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-secondary/30 to-secondary/60 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-primary mx-auto mb-4 flex items-center justify-center shadow-glow">
                    <PenTool className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Your documents, signed faster</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need to manage signatures
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Powerful features designed for modern teams and professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: PenTool,
                title: "Draw or Type",
                description: "Create your signature naturally by drawing or choose from elegant typed fonts"
              },
              {
                icon: FileText,
                title: "Instant PDF Export",
                description: "Download professionally formatted signed documents as PDFs instantly"
              },
              {
                icon: Send,
                title: "Send & Track",
                description: "Share documents and track views, opens, and signature completion in real-time"
              },
              {
                icon: Shield,
                title: "Bank-Level Security",
                description: "256-bit encryption and SOC 2 compliance keep your documents safe"
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description: "Invite team members, set permissions, and manage workflows together"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Sign documents in under 30 seconds. No printing, scanning, or faxing required"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary group-hover:shadow-md transition-all duration-300">
                  <feature.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Choose the plan that's right for you
            </p>

            <div className="flex justify-center mt-8">
              <div className="bg-secondary p-1 rounded-lg inline-flex border border-border">
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    currency === "USD"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency("NGN")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    currency === "NGN"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  NGN (₦)
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Free Plan */}
            <div 
              onClick={() => setSelectedPlan("Free")}
              className={`bg-card rounded-2xl p-8 flex flex-col transition-all duration-300 cursor-pointer ${
                selectedPlan === "Free" ? "border-2 border-primary shadow-xl md:scale-105 z-10 ring-4 ring-primary/10" : "border border-border hover:border-primary/50"
              }`}
            >
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{currency === "USD" ? "$0" : "₦0"}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Perfect for individuals just getting started.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  3 documents per month
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Up to 2 signers per document
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Basic audit trail
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Endorse branding on documents
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Email signing only
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground/60">
                  <X className="w-4 h-4 flex-shrink-0" />
                  No bulk send
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground/60">
                  <X className="w-4 h-4 flex-shrink-0" />
                  No templates
                </li>
              </ul>
              <Link to="/auth">
                <Button variant="outline" className={`w-full ${selectedPlan === "Free" ? "animate-pulse" : ""}`}>Get Started</Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div 
              onClick={() => setSelectedPlan("Pro")}
              className={`bg-card rounded-2xl p-8 flex flex-col relative transition-all duration-300 cursor-pointer ${
                selectedPlan === "Pro" ? "border-2 border-primary shadow-xl md:scale-105 z-10 ring-4 ring-primary/10" : "border border-border hover:border-primary/50"
              }`}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{currency === "USD" ? "$5" : "₦7,000"}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">For professionals who need more power.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  25 documents/month
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Unlimited signers
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  No Endorse branding
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Document templates
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Email reminders
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Download audit trail
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Priority email support
                </li>
              </ul>
              <Link to="/auth">
                <Button className={`w-full bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black ${selectedPlan === "Pro" ? "animate-pulse" : ""}`}>Start Free Trial</Button>
              </Link>
            </div>

            {/* Business Plan */}
            <div 
              onClick={() => setSelectedPlan("Business")}
              className={`bg-card rounded-2xl p-8 flex flex-col transition-all duration-300 cursor-pointer ${
                selectedPlan === "Business" ? "border-2 border-primary shadow-xl md:scale-105 z-10 ring-4 ring-primary/10" : "border border-border hover:border-primary/50"
              }`}
            >
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Business</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{currency === "USD" ? "$10" : "₦15,000"}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">For teams scaling their operations.</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Unlimited documents
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Team accounts (5–10 users)
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Shared templates
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Bulk send
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Team analytics
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Custom logo
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Cloud storage integrations (soon)
                </li>
              </ul>
              <Link to="/auth">
                <Button variant="outline" className={`w-full ${selectedPlan === "Business" ? "animate-pulse" : ""}`}>Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Common questions
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to know about the product and billing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Is Endorse legally binding?",
                a: "Yes. Signatures created with Endorse are legally binding and enforceable in court, complying with the ESIGN Act, UETA, and eIDAS regulations."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use bank-level 256-bit SSL encryption for all document transfers and storage. Your documents are private and only accessible to you and your designated signers."
              },
              {
                q: "Can I sign on my mobile phone?",
                a: "Yes! Endorse is fully responsive and works perfectly on smartphones and tablets. You can draw your signature using your finger or stylus."
              },
              {
                q: "What happens after the free trial?",
                a: "If you don't upgrade to a paid plan, your account will automatically switch to our Free tier, which allows you to sign up to 3 documents per month."
              },
              {
                q: "Do recipients need an account to sign?",
                a: "No. Recipients can sign documents sent to them without creating an Endorse account. They simply click the link in their email to sign."
              },
              {
                q: "Can I cancel my subscription?",
                a: "You can cancel your subscription at any time from your dashboard. You'll retain access to your paid features until the end of your billing cycle."
              }
            ].map((faq, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-sm">
                <h3 className="font-display font-semibold text-lg mb-3 text-foreground">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      {/* <section id="testimonials" className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Loved by teams everywhere
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Endorse has cut our contract turnaround time by 80%. It's become essential to our workflow.",
                author: "Sarah Chen",
                role: "Operations Lead, TechCorp"
              },
              {
                quote: "The simplest e-signature solution we've used. Our team was onboarded in minutes.",
                author: "Michael Ross",
                role: "CEO, StartupXYZ"
              },
              {
                quote: "Finally, a signing tool that doesn't feel like it was built in 2005. Clean, fast, and reliable.",
                author: "Emily Watson",
                role: "Legal Counsel, FinanceHub"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-card rounded-xl border border-border p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{testimonial.author}</p>
                  <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-2xl bg-gradient-primary p-10 md:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to streamline your signing?
              </h2>
              <p className="text-primary-foreground/85 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of professionals who save hours every week with Endorse.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-background text-primary hover:bg-background/95 font-semibold">
                  Start Your Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border pt-16 pb-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-6">
                <Logo className="h-8 w-auto" />
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                The professional way to sign and endorse documents securely online.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
                <a href="https://www.instagram.com/e.ndorse?igsh=MWs2MnltaGdxbDU3eA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-6">Stay Updated</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to our newsletter for the latest updates and features.
              </p>
              <div className="flex flex-col gap-3">
                <Input placeholder="Enter your email" className="bg-background" />
                <Button className="w-full">Subscribe</Button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Endorse. All rights reserved.
            </p>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
