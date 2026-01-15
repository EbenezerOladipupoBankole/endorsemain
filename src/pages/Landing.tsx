import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { PenTool, Shield, Zap, FileText, Users, Send, Check, ArrowRight, Star, X, Menu, Twitter, Linkedin, Facebook, Instagram, LayoutDashboard, Settings, CreditCard, CheckCircle2, AlertCircle, Upload, Clock, ChevronRight, Globe, Lock, Mail, Smartphone, Calendar, Image, Type, Cookie, PlayCircle, MessageSquare, ChevronDown, FileType, HelpCircle, Code } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/components/client";
import { toast } from "sonner";

const tiers = [
  {
    name: 'Free',
    price: 'Free',
    frequency: '',
    features: ['5 documents/month', 'Basic signatures'],
    color: 'text-green-600',
    buttonColor: 'bg-green-600 hover:bg-green-700 focus-visible:outline-green-600',
    badgeColor: 'bg-green-100 text-green-600',
  },
  {
    name: 'Starter',
    price: '$4.99',
    frequency: '/month',
    features: ['20 documents', 'Audit trail', 'Email notifications'],
    color: 'text-blue-600',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600',
    badgeColor: 'bg-blue-100 text-blue-600',
  },
  {
    name: 'Pro',
    price: '$9.99',
    frequency: '/month',
    features: ['50 documents', 'Custom branding', 'Priority support'],
    color: 'text-purple-600',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 focus-visible:outline-purple-600',
    badgeColor: 'bg-purple-100 text-purple-600',
  },
  {
    name: 'Business',
    price: '$25',
    frequency: '/month',
    features: ['Unlimited documents', 'Teams', 'Admin control'],
    color: 'text-orange-600',
    buttonColor: 'bg-orange-600 hover:bg-orange-700 focus-visible:outline-orange-600',
    badgeColor: 'bg-orange-100 text-orange-600',
  },
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [language, setLanguage] = useState("en");
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { text: "Hello! 👋 Thanks for visiting Endorse. How can we help you streamline your agreements today?", isUser: false, time: "Just now" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileProductOpen, setMobileProductOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      const timer = setTimeout(() => setShowCookieConsent(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "true");
    setShowCookieConsent(false);
  };

  const handleUpgrade = async (plan: string) => {
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }

    const toastId = toast.loading("Initializing payment...");
    try {
      const createPaystackTransaction = httpsCallable(functions, 'createPaystackTransaction');
      const { data }: any = await createPaystackTransaction({
        plan,
        callbackUrl: `${window.location.origin}/dashboard?payment=success`,
      });

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error("Failed to initialize payment", { id: toastId });
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to initiate payment", { id: toastId });
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = { text: chatInput, isUser: true, time: "Just now" };
    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages((prev) => [...prev, { text: "Thanks for reaching out! A member of our team will be with you shortly.", isUser: false, time: "Just now" }]);
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
      audio.play().catch((e) => console.error("Audio play failed:", e));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-14 w-auto drop-shadow-sm" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors flex items-center gap-1 outline-none group">
                Product <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[340px] p-3">
                <DropdownMenuItem asChild className="mb-1 cursor-pointer rounded-lg focus:bg-accent">
                  <a href="#features" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <PenTool className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-foreground">eSign</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Create, send, and track legally binding electronic signatures.
                      </span>
                    </div>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-accent">
                  <Link to="/conversion" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <FileType className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-foreground">File Conversion</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Transform documents between PDF, Word, and other formats.
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <a href="#pricing" className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors">Pricing</a>
            <DropdownMenu>
              <DropdownMenuTrigger className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors flex items-center gap-1 outline-none group">
                Resources <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[340px] p-3">
                <DropdownMenuItem asChild className="mb-1 cursor-pointer rounded-lg focus:bg-accent">
                  <Link to="/blog" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-foreground">Blog</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Latest updates, articles, and insights.
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="mb-1 cursor-pointer rounded-lg focus:bg-accent">
                  <Link to="#" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-foreground">Help Center</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Guides, tutorials, and support documentation.
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-accent">
                  <Link to="#" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <Code className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-foreground">API Docs</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Complete reference for developers.
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/about" className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors">Company</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth?mode=signup">
              <Button className="font-medium text-base bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black">Get Started Free</Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-foreground p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5 h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Product Mobile Dropdown */}
            <div className="flex flex-col">
              <button 
                className="flex items-center justify-between font-sans text-sm font-bold tracking-tight text-foreground p-2 hover:bg-accent rounded-md transition-colors w-full text-left"
                onClick={() => setMobileProductOpen(!mobileProductOpen)}
              >
                Product 
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileProductOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileProductOpen && (
                <div className="pl-4 flex flex-col gap-1 mt-1 border-l border-border/50 ml-2">
                  <a href="#features" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                    <PenTool className="w-4 h-4" /> eSign
                  </a>
                  <Link to="/conversion" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}>
                    <FileType className="w-4 h-4" /> File Conversion
                  </Link>
                </div>
              )}
            </div>

            <a href="#pricing" className="font-sans text-sm font-bold tracking-tight text-foreground p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            
            {/* Resources Mobile Dropdown */}
            <div className="flex flex-col">
              <button 
                className="flex items-center justify-between font-sans text-sm font-bold tracking-tight text-foreground p-2 hover:bg-accent rounded-md transition-colors w-full text-left"
                onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
              >
                Resources 
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileResourcesOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileResourcesOpen && (
                <div className="pl-4 flex flex-col gap-1 mt-1 border-l border-border/50 ml-2">
                  <Link to="/blog" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}><FileText className="w-4 h-4" /> Blog</Link>
                  <Link to="#" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}><HelpCircle className="w-4 h-4" /> Help Center</Link>
                  <Link to="#" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}><Code className="w-4 h-4" /> API Docs</Link>
                </div>
              )}
            </div>

            <Link to="/about" className="font-sans text-sm font-bold tracking-tight text-foreground p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Company</Link>
            <div className="flex flex-col gap-3 mt-2">
              <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                <Button size="lg" className="w-full text-base bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black">Get Started Free</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-20 px-4 md:px-6 bg-background relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-background to-background" />
        
        <div className="container mx-auto max-w-7xl relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Column: Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left z-10">
              {/* Headline */}
              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight animate-fade-up-delay-1">
                The Trusted Platform for <br />
                <span className="text-primary relative inline-block">
                  Digital Agreements
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#FFC83D] opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-8 md:mb-10 leading-relaxed animate-fade-up-delay-2">
                Empower your organization with legally binding e-signatures. Experience enterprise-grade security and compliance without the complexity.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up-delay-3 mb-12">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-semibold shadow-lg shadow-[#FFC83D]/20">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                
                <div 
                  className="group flex items-center gap-3 pl-2 pr-6 py-2 rounded-full bg-background/50 border border-border/50 hover:border-primary/50 hover:bg-background/80 backdrop-blur-sm transition-all cursor-pointer shadow-sm hover:shadow-md h-14 w-full sm:w-auto"
                  onClick={() => setShowVideoModal(true)}
                  role="button"
                  tabIndex={0}
                  aria-label="Watch product demo"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                    <img 
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop&q=80" 
                      alt="Demo thumbnail" 
                      className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <PlayCircle className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold leading-none text-foreground">Watch Demo</p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">See how it works</p>
                  </div>
                </div>
              </div>

              {/* Trust Indicators (Mini) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 text-sm text-muted-foreground animate-fade-up-delay-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>ESIGN Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>No Credit Card</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual */}
            <div className="w-full lg:w-1/2 relative animate-fade-in duration-1000 delay-300 perspective-1000">
              <div className="relative transform transition-transform hover:scale-[1.01] duration-500">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
                
                <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
                  {/* Main Interface Window */}
                  <div className="bg-background/95 backdrop-blur rounded-2xl border border-border/60 shadow-2xl overflow-hidden relative ring-1 ring-white/10">
                    {/* Window Header */}
                    <div className="bg-muted/50 px-4 py-3 border-b border-border/60 flex items-center gap-4">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]" />
                        <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]" />
                        <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-background/80 border border-border/40 rounded-md px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2 w-full max-w-[240px] justify-center shadow-sm">
                          <Lock className="w-3 h-3 opacity-70" /> 
                          <span className="opacity-70">endorse.com/sign/contract</span>
                        </div>
                      </div>
                      <div className="w-16 flex justify-end gap-2">
                         <div className="w-6 h-6 rounded-full bg-muted border border-border/50" />
                      </div>
                    </div>

                    {/* Window Content - Split View */}
                    <div className="flex h-[400px] sm:h-[500px] md:h-[600px] bg-muted/10">
                      {/* Left Sidebar (Tools) */}
                      <div className="w-14 md:w-16 border-r border-border/60 bg-background/50 flex flex-col items-center py-6 gap-6 backdrop-blur-sm">
                        {[PenTool, Type, Image, Calendar].map((Icon, i) => (
                          <div key={i} className={`p-2.5 rounded-xl transition-all cursor-pointer ${i === 0 ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        ))}
                      </div>

                      {/* Main Document Area */}
                      <div className="flex-1 bg-muted/10 p-2 md:p-8 overflow-hidden relative flex flex-col items-center">
                        {/* Toolbar Mock */}
                        <div className="w-full max-w-[500px] h-10 bg-background rounded-lg border border-border/40 shadow-sm mb-6 flex items-center px-4 gap-4 opacity-80">
                           <div className="h-2 w-24 bg-muted rounded-full" />
                           <div className="h-4 w-px bg-border" />
                           <div className="flex gap-2">
                              <div className="h-4 w-4 bg-muted rounded" />
                              <div className="h-4 w-4 bg-muted rounded" />
                              <div className="h-4 w-4 bg-muted rounded" />
                           </div>
                        </div>

                        {/* The Paper */}
                        <div className="bg-white text-black shadow-xl w-full max-w-[500px] h-full rounded-t-lg p-8 md:p-10 relative mx-auto transform transition-transform hover:-translate-y-1 duration-500 border border-black/5">
                          {/* Document Content Mock */}
                          <div className="flex justify-between items-start mb-10">
                            <div className="flex items-center gap-2 font-bold text-lg">
                              <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg text-sm font-display">E</div>
                              <span className="tracking-tight">ENDORSE</span>
                            </div>
                            <div className="text-right text-[10px] text-gray-400 font-mono">
                              <p>ID: 8839-22</p>
                            </div>
                          </div>

                          <h2 className="text-xl font-bold mb-6 text-gray-900">Service Agreement</h2>
                          <div className="space-y-4 text-[11px] md:text-xs text-gray-600 leading-relaxed">
                            <div className="flex gap-2 mb-6">
                               <div className="w-1/2 space-y-2">
                                  <p className="font-semibold text-gray-900">Between:</p>
                                  <div className="h-2 w-24 bg-gray-100 rounded" />
                                  <div className="h-2 w-32 bg-gray-100 rounded" />
                               </div>
                               <div className="w-1/2 space-y-2">
                                  <p className="font-semibold text-gray-900">And:</p>
                                  <div className="h-2 w-24 bg-gray-100 rounded" />
                                  <div className="h-2 w-32 bg-gray-100 rounded" />
                               </div>
                            </div>

                            <p>This Service Agreement ("Agreement") is entered into by and between the undersigned parties.</p>
                            <div className="h-2 bg-gray-100 rounded w-full" />
                            <div className="h-2 bg-gray-100 rounded w-11/12" />
                            <div className="h-2 bg-gray-100 rounded w-full" />
                            
                            <h3 className="text-sm font-bold text-black mt-8 mb-3">1. Scope of Services</h3>
                            <div className="h-2 bg-gray-100 rounded w-full" />
                            <div className="h-2 bg-gray-100 rounded w-10/12" />
                            <div className="h-2 bg-gray-100 rounded w-full" />
                          </div>

                          {/* Signature Zone */}
                          <div className="mt-12 p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 relative group cursor-pointer hover:bg-blue-50/50 transition-colors">
                            <div className="flex justify-between items-end">
                               <div>
                                  <p className="text-[10px] font-bold uppercase text-blue-400 mb-1">Signature</p>
                                  <div className="font-handwriting text-2xl text-blue-600 transform -rotate-2 origin-left">
                                    Sarah Jenkins
                                  </div>
                               </div>
                               <div className="text-right">
                                  <div className="bg-[#FFC83D] text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                                  </div>
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Sidebar (Signers) */}
                      <div className="w-60 border-l border-border/60 bg-background/50 hidden xl:block p-5 backdrop-blur-sm">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Participants</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border/50 shadow-sm">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold ring-2 ring-white">SJ</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">Sarah Jenkins</p>
                              <p className="text-[10px] text-green-600 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Signed
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent opacity-60">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">JD</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">John Doe</p>
                              <p className="text-xs text-muted-foreground">Waiting...</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8">
                           <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Activity</h4>
                           <div className="space-y-4 pl-2 border-l border-border/50">
                              <div className="relative pl-4">
                                 <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-background" />
                                 <p className="text-xs text-foreground">Document signed</p>
                                 <p className="text-[10px] text-muted-foreground">2 mins ago</p>
                              </div>
                              <div className="relative pl-4 opacity-60">
                                 <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-background" />
                                 <p className="text-xs text-foreground">Viewed by Sarah</p>
                                 <p className="text-[10px] text-muted-foreground">15 mins ago</p>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -right-6 top-24 bg-background/90 backdrop-blur p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border/50 animate-in slide-in-from-bottom-10 duration-1000 delay-500 hidden md:block max-w-[200px]">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-500/10 p-2 rounded-full shrink-0">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight mb-1">Legally Binding</p>
                        <p className="text-xs text-muted-foreground leading-snug">Compliant with ESIGN & eIDAS</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-20 bg-secondary/20 border-y border-border/50">
        <div className="container mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How Endorse Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Get your documents signed in minutes, not days. A simple workflow designed for speed.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-border via-primary/20 to-border -z-10" />
            
            {[
              { title: "Upload", desc: "Upload any PDF or Word document from your computer or cloud storage.", icon: Upload },
              { title: "Sign & Send", desc: "Add your signature fields and send to recipients via email.", icon: PenTool },
              { title: "Track", desc: "Get real-time updates when your document is viewed and signed.", icon: CheckCircle2 }
            ].map((step, i) => (
              <div key={i} className="group flex flex-col items-center text-center bg-background p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6 shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-10 h-10 text-primary" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#FFC83D] flex items-center justify-center font-bold text-black text-sm border-2 border-background">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Dive Features (Alternating Layout) */}
      <section id="features" className="py-16 md:py-24 px-4 md:px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-base font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything you need to manage signatures
            </h2>
          </div>

          {/* Feature 1: Signing Experience */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="relative rounded-2xl bg-gradient-to-br from-secondary to-background border border-border p-8 shadow-lg">
                {/* Mock Document Interface */}
                <div className="bg-white rounded-lg shadow-sm border border-border/50 p-8 min-h-[300px] relative">
                  <div className="h-4 w-1/3 bg-gray-200 rounded mb-6"></div>
                  <div className="space-y-3 mb-8">
                    <div className="h-2 w-full bg-gray-100 rounded"></div>
                    <div className="h-2 w-full bg-gray-100 rounded"></div>
                    <div className="h-2 w-2/3 bg-gray-100 rounded"></div>
                  </div>
                  
                  {/* Signature Box */}
                  <div className="border-2 border-dashed border-[#FFC83D] bg-[#FFC83D]/5 rounded-lg p-4 relative group cursor-pointer">
                    <div className="absolute -top-3 left-4 bg-[#FFC83D] text-black text-xs font-bold px-2 py-0.5 rounded">Sign Here</div>
                    <div className="font-handwriting text-3xl text-black opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
                      John Doe
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 opacity-100 group-hover:opacity-0 transition-opacity">Click to sign</p>
                  </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute -right-4 top-10 bg-background border border-border shadow-xl rounded-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-1000 delay-500">
                  <div className="bg-green-100 p-2 rounded-full"><Check className="w-4 h-4 text-green-600" /></div>
                  <div>
                    <p className="text-xs font-bold">Legally Binding</p>
                    <p className="text-[10px] text-muted-foreground">ESIGN Compliant</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC83D]/10 text-[#FFC83D] text-sm font-medium mb-4">
                <PenTool className="w-4 h-4" />
                Intuitive Signing
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">Sign documents anywhere, on any device.</h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Experience a signing process that feels natural. Whether you're on a desktop in the office or a mobile phone on the go, Endorse adapts to your screen.
              </p>
              <ul className="space-y-3">
                {["Draw, type, or upload signatures", "Mobile-responsive interface", "No account required for signers"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2: Tracking */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24">
            <div className="w-full md:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-4">
                <Clock className="w-4 h-4" />
                Real-time Tracking
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">Never wonder about status again.</h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Stay in the loop with instant notifications. Know exactly when your document is opened, viewed, and signed.
              </p>
              <Link to="/auth">
                <Button variant="outline" className="group">
                  Explore Features <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative rounded-2xl bg-card border border-border p-6 shadow-lg">
                <div className="space-y-4">
                  {[
                    { user: "Sarah Chen", action: "viewed the document", time: "2 mins ago", icon: Users, color: "bg-blue-100 text-blue-600" },
                    { user: "Mike Ross", action: "signed the contract", time: "Just now", icon: PenTool, color: "bg-green-100 text-green-600" },
                    { user: "System", action: "sent copy to all parties", time: "Just now", icon: Mail, color: "bg-purple-100 text-purple-600" }
                  ].map((notif, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border/50 shadow-sm">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notif.color}`}>
                        <notif.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          <span className="font-bold">{notif.user}</span> {notif.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Decorative Elements */}
                <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full bg-secondary/50 rounded-2xl"></div>
              </div>
            </div>
          </div>

          {/* Feature 3: Security */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="relative rounded-2xl bg-[#1a1f2c] p-8 shadow-2xl overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center text-center py-10">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                    <Lock className="w-10 h-10 text-[#FFC83D]" />
                  </div>
                  <h4 className="text-2xl font-bold mb-2">Secure Infrastructure</h4>
                  <p className="text-gray-400 mb-8">Powered by Google Cloud</p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-[#FFC83D] font-bold text-lg">SSL</div>
                      <div className="text-xs text-gray-400">Encryption</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-[#FFC83D] font-bold text-lg">99.9%</div>
                      <div className="text-xs text-gray-400">Uptime</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                Secure & Reliable
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">Secure, private, and legally binding.</h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                We take security seriously. Your documents are protected by industry-standard encryption and secure cloud infrastructure.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Audit Trails", "Two-Factor Auth", "Data Encryption", "Privacy Focused"].map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-secondary rounded-md text-sm font-medium text-secondary-foreground border border-border">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
            <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Choose the right plan for you
            </p>
          </div>
          <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className="rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
              >
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 id={tier.name} className={`text-lg font-semibold leading-8 ${tier.color}`}>
                      {tier.name}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${tier.badgeColor} ring-1 ring-inset ring-gray-500/10`}>
                      {tier.name}
                    </span>
                  </div>
                  <p className="mt-4 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price}</span>
                    {tier.frequency && <span className="text-sm font-semibold leading-6 text-gray-600">{tier.frequency}</span>}
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3">
                        <svg className={`h-6 w-5 flex-none ${tier.color}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => tier.name === 'Free' ? navigate('/auth?mode=signup') : handleUpgrade(tier.name)}
                  aria-describedby={tier.name}
                  className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tier.buttonColor}`}
                >
                  Get started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-base font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Common questions
            </h2>
            <p className="text-muted-foreground text-xl max-w-xl mx-auto">
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
                a: "Absolutely. We use industry-standard SSL encryption for all document transfers. Your documents are private and only accessible to you and your designated signers."
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
                <h3 className="font-display font-semibold text-xl mb-3 text-foreground">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed text-base">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof - Temporarily Hidden */}
      {/* 
      <section id="testimonials" className="py-24 px-6 bg-secondary/30">...</section>
      */}

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-2xl bg-gradient-primary p-8 md:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="relative z-10">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                Ready to streamline your signing?
              </h2>
              <p className="text-primary-foreground/85 text-xl mb-8 max-w-xl mx-auto">
                Join thousands of professionals who save hours every week with Endorse.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 font-semibold text-xl h-14 px-8">
                  Start Your Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border pt-12 md:pt-16 pb-8 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-6">
                <Logo className="h-[80px] w-auto" />
              </Link>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                The professional way to sign and endorse documents securely online.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
                <a href="https://www.linkedin.com/company/e-ndorse/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn"><Linkedin className="w-5 h-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook"><Facebook className="w-5 h-5" /></a>
                <a href="https://www.instagram.com/e.ndorse?igsh=MWs2MnltaGdxbDU3eA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-lg text-foreground mb-6">Product</h4>
              <ul className="space-y-4 text-base text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg text-foreground mb-6">Company</h4>
              <ul className="space-y-4 text-base text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg text-foreground mb-6">Stay Updated</h4>
              <p className="text-base text-muted-foreground mb-4">
                Subscribe to our newsletter for the latest updates and features.
              </p>
              <div className="flex flex-col gap-3">
                <Input placeholder="Enter your email" className="bg-background" aria-label="Email address" />
                <Button size="lg" className="w-full text-base">Subscribe</Button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <p className="text-muted-foreground text-base">
                © {new Date().getFullYear()} Endorse. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent border-none text-sm text-muted-foreground hover:text-foreground focus:ring-0 cursor-pointer outline-none"
                  aria-label="Select language"
                >
                  <option value="en">English (US)</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
            <div className="flex gap-8 text-base text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/cookie-policy" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-500">
          <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full hidden sm:block">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={() => setShowCookieConsent(false)}>
                Decline
              </Button>
              <Button size="sm" className="flex-1 sm:flex-none bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90" onClick={acceptCookies}>
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Sales Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowContactModal(false)} />
          <div className="relative z-50 w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-6">
              <h2 className="text-lg font-semibold leading-none tracking-tight">Contact Sales</h2>
              <p className="text-sm text-muted-foreground">
                Get a custom quote for your team. We'll get back to you within 24 hours.
              </p>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowContactModal(false); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="first-name" className="text-sm font-medium leading-none">First name</label>
                  <Input id="first-name" placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last-name" className="text-sm font-medium leading-none">Last name</label>
                  <Input id="last-name" placeholder="Doe" required />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">Work Email</label>
                <Input id="email" type="email" placeholder="john@company.com" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium leading-none">Company Name</label>
                <Input id="company" placeholder="Acme Inc." required />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium leading-none">Message</label>
                <textarea 
                  id="message" 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Tell us about your needs..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowContactModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">Send Request</Button>
              </div>
            </form>
            <div className="mt-6 pt-6 border-t border-border flex justify-center">
              <a href="https://www.linkedin.com/company/e-ndorse/" target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="outline" className="w-full gap-2 text-muted-foreground hover:text-[#0A66C2] hover:border-[#0A66C2]/30">
                  <Linkedin className="w-4 h-4" />
                  Follow us on LinkedIn
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setShowVideoModal(false)} />
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-xl shadow-2xl overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowVideoModal(false)}
              className="absolute right-4 top-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/STt-r1SlO74?autoplay=1" 
              title="Product Demo" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}

      {/* Live Chat Widget */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex flex-col items-end gap-4">
        {showChat && (
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-[#FFC83D] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="font-bold text-black">Endorse Support</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-black/80 hover:text-black transition-colors" aria-label="Close chat">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-80 bg-background p-4 overflow-y-auto flex flex-col gap-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg max-w-[85%] border border-border ${msg.isUser ? 'bg-primary/10 self-end rounded-tr-none' : 'bg-secondary self-start rounded-tl-none'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">{msg.time}</span>
                </div>
              ))}
              {isTyping && (
                <div className="bg-secondary p-4 rounded-lg rounded-tl-none max-w-[85%] self-start border border-border">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border bg-background">
              <form className="flex gap-2" onSubmit={handleChatSubmit}>
                <Input 
                  placeholder="Type a message..." 
                  className="flex-1" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  aria-label="Type a message"
                />
                <Button size="icon" type="submit" className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 transition-transform hover:scale-105"
          onClick={() => setShowChat(!showChat)}
          aria-label="Open chat"
        >
          {showChat ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
};

export default Landing;
