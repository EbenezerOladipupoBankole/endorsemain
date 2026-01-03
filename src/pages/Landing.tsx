import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { PenTool, Shield, Zap, FileText, Users, Send, Check, ArrowRight, Star, X, Menu, Twitter, Linkedin, Facebook, Instagram, LayoutDashboard, Settings, CreditCard, CheckCircle2, AlertCircle, Upload, Clock, ChevronRight, Globe, Lock, Mail, Smartphone, Calendar, Image, Type, Cookie, PlayCircle, MessageSquare } from "lucide-react";

const Landing = () => {
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  const [selectedPlan, setSelectedPlan] = useState<"Free" | "Pro" | "Business">("Pro");
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
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="container mx-auto px-6 h-32 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-[120px] w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <Link to="/blog" className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="font-medium text-base">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="font-medium text-base bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black">Get Started Free</Button>
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
            <a href="#features" className="text-base font-medium p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-base font-medium p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <Link to="/blog" className="text-base font-medium p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Blog</Link>
            <div className="flex flex-col gap-3 mt-2">
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="lg" className="w-full justify-start text-base">Sign In</Button>
              </Link>
              <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                <Button size="lg" className="w-full text-base bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black">Get Started Free</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-background relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/20 via-background to-background" />
        
        <div className="container mx-auto max-w-7xl relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Column: Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left z-10">
              {/* Headline */}
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight animate-fade-up-delay-1">
                The Standard for <br />
                <span className="text-primary relative inline-block">
                  Electronic Signatures
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#FFC83D] opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed animate-fade-up-delay-2">
                Accelerate business with the world's most trusted e-signature solution. Secure, compliant, and easy to use.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up-delay-3 mb-12">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-semibold shadow-lg shadow-[#FFC83D]/20">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto text-lg h-14 px-8 bg-background/50 backdrop-blur-sm"
                  onClick={() => setShowContactModal(true)}
                >
                  Contact Sales
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="w-full sm:w-auto text-lg h-14 px-8 hover:bg-accent"
                  onClick={() => setShowVideoModal(true)}
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  How it Works
                </Button>
              </div>

              {/* Trust Indicators (Mini) */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 text-sm text-muted-foreground animate-fade-up-delay-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>ESIGN Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Bank-Level Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>No Credit Card</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual */}
            <div className="w-full lg:w-1/2 relative animate-fade-in duration-1000 delay-300">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
                  {/* Main Interface Window */}
                  <div className="bg-background rounded-xl border border-border shadow-2xl overflow-hidden relative">
                    {/* Window Header */}
                    <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center gap-4">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-background border border-border/50 rounded-md px-3 py-1 text-xs text-muted-foreground flex items-center gap-2">
                          <Lock className="w-3 h-3" /> endorse.com/sign/contract-2024
                        </div>
                      </div>
                      <div className="w-16" />
                    </div>

                    {/* Window Content - Split View */}
                    <div className="flex h-[400px] sm:h-[500px] md:h-[600px]">
                      {/* Left Sidebar (Tools) */}
                      <div className="w-12 md:w-20 border-r border-border bg-muted/10 flex flex-col items-center py-4 md:py-6 gap-4 md:gap-6">
                        {[PenTool, Type, Image, Calendar].map((Icon, i) => (
                          <div key={i} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                            <Icon className="w-4 h-4 md:w-5 md:h-5" />
                          </div>
                        ))}
                      </div>

                      {/* Main Document Area */}
                      <div className="flex-1 bg-muted/5 p-4 md:p-8 overflow-y-auto flex justify-center relative">
                        <div className="bg-white text-black shadow-lg w-full max-w-[600px] min-h-[600px] md:min-h-[800px] p-6 md:p-12 relative mx-auto">
                          {/* Document Content Mock */}
                          <div className="flex justify-between items-start mb-8 md:mb-12">
                            <div className="flex items-center gap-2 font-bold text-lg md:text-xl">
                              <div className="w-6 h-6 md:w-8 md:h-8 bg-black text-white flex items-center justify-center rounded text-sm md:text-base">E</div>
                              <span className="text-sm md:text-base">ENDORSE</span>
                            </div>
                            <div className="text-right text-[10px] md:text-sm text-gray-500">
                              <p>Date: Oct 24, 2024</p>
                              <p>Ref: #8839-22</p>
                            </div>
                          </div>

                          <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Service Agreement</h2>
                          <div className="space-y-3 md:space-y-4 text-[10px] md:text-sm text-gray-600 leading-relaxed">
                            <p>This Service Agreement ("Agreement") is entered into by and between the undersigned parties.</p>
                            <div className="h-3 md:h-4 bg-gray-100 rounded w-full" />
                            <div className="h-3 md:h-4 bg-gray-100 rounded w-5/6" />
                            <div className="h-3 md:h-4 bg-gray-100 rounded w-full" />
                            
                            <h3 className="text-sm md:text-lg font-bold text-black mt-6 md:mt-8 mb-2 md:mb-4">1. Scope of Services</h3>
                            <div className="h-3 md:h-4 bg-gray-100 rounded w-full" />
                            <div className="h-3 md:h-4 bg-gray-100 rounded w-11/12" />
                            
                            <h3 className="text-sm md:text-lg font-bold text-black mt-6 md:mt-8 mb-2 md:mb-4">2. Terms & Conditions</h3>
                            <div className="h-3 md:h-4 bg-gray-100 rounded w-full" />
                            <div className="h-3 md:h-4 bg-gray-100 rounded w-4/5" />
                          </div>

                          {/* Signature Zone */}
                          <div className="mt-8 md:mt-16 pt-6 md:pt-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                            <div>
                              <p className="text-[10px] md:text-xs font-bold uppercase text-gray-400 mb-2">Signed by Client</p>
                              <div className="h-10 md:h-16 border-b border-black flex items-end pb-2 font-handwriting text-lg md:text-2xl relative group cursor-pointer">
                                <span className="text-blue-600">Sarah Jenkins</span>
                                <div className="absolute -top-3 -right-3 bg-[#FFC83D] text-black text-[10px] font-bold px-2 py-1 rounded shadow-sm animate-bounce">
                                  SIGNED
                                </div>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] md:text-xs font-bold uppercase text-gray-400 mb-2">Date</p>
                              <div className="h-10 md:h-16 border-b border-gray-300 flex items-end pb-2 text-gray-600 text-xs md:text-base">
                                Oct 24, 2024
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Sidebar (Signers) */}
                      <div className="w-56 border-l border-border bg-background hidden lg:block p-4">
                        <h4 className="font-semibold text-sm mb-4">Signers</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50 border border-border">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">SJ</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">Sarah Jenkins</p>
                              <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-2 rounded-lg opacity-60">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">JD</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">John Doe</p>
                              <p className="text-xs text-muted-foreground">Waiting...</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Elements */}
                  <div className="absolute -right-4 top-20 bg-background p-4 rounded-xl shadow-xl border border-border animate-in slide-in-from-bottom-10 duration-1000 delay-500 hidden md:block">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-500/10 p-2 rounded-full">
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Document Completed</p>
                        <p className="text-xs text-muted-foreground">Just now</p>
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
      <section className="py-20 bg-secondary/20 border-y border-border/50">
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
      <section id="features" className="py-24 px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-base font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything you need to manage signatures
            </h2>
          </div>

          {/* Feature 1: Signing Experience */}
          <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
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
                <div className="absolute -right-4 top-10 bg-background border border-border shadow-xl rounded-lg p-3 flex items-center gap-3 animate-bounce duration-[3000ms]">
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
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
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
          <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
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
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="relative rounded-2xl bg-[#1a1f2c] p-8 shadow-2xl overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center text-center py-10">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-white/20">
                    <Lock className="w-10 h-10 text-[#FFC83D]" />
                  </div>
                  <h4 className="text-2xl font-bold mb-2">Bank-Level Security</h4>
                  <p className="text-gray-400 mb-8">256-bit SSL Encryption</p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-[#FFC83D] font-bold text-lg">SOC 2</div>
                      <div className="text-xs text-gray-400">Compliant</div>
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
                Enterprise Grade
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">Secure, compliant, and legally binding.</h3>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                We take security seriously. Your documents are protected by industry-leading encryption and compliance standards.
              </p>
              <div className="flex flex-wrap gap-3">
                {["Audit Trails", "Two-Factor Auth", "Data Encryption", "GDPR Compliant"].map((tag, i) => (
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
      <section id="pricing" className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-base font-semibold text-primary uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-xl max-w-xl mx-auto">
              Choose the plan that's right for you
            </p>

            <div className="flex justify-center mt-8">
              <div className="bg-secondary p-1 rounded-lg inline-flex border border-border">
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-6 py-2 rounded-md text-base font-medium transition-all ${
                    currency === "USD"
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency("NGN")}
                  className={`px-6 py-2 rounded-md text-base font-medium transition-all ${
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
              className={`bg-card rounded-2xl p-10 flex flex-col transition-all duration-300 cursor-pointer ${
                selectedPlan === "Free" ? "border-2 border-primary shadow-xl md:scale-105 z-10 ring-4 ring-primary/10" : "border border-border hover:border-primary/50"
              }`}
            >
              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{currency === "USD" ? "$0" : "₦0"}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-base text-muted-foreground mt-2">For individuals starting out</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-base">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  3 documents/mo
                </li>
                <li className="flex items-center gap-3 text-base">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Basic signatures
                </li>
              </ul>
              <Link to="/auth?mode=signup">
                <Button variant="outline" size="lg" className={`w-full ${selectedPlan === "Free" ? "animate-pulse" : ""}`}>Get Started</Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div 
              onClick={() => setSelectedPlan("Pro")}
              className={`bg-card rounded-2xl p-10 flex flex-col relative transition-all duration-300 cursor-pointer ${
                selectedPlan === "Pro" ? "border-2 border-[#FFC83D] shadow-xl md:scale-105 z-10 ring-4 ring-[#FFC83D]/10" : "border border-border hover:border-[#FFC83D]/50"
              }`}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFC83D] text-black text-sm font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{currency === "USD" ? "$10" : "₦15,500"}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-base text-muted-foreground mt-2">For professionals</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-base">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Unlimited documents
                </li>
                <li className="flex items-center gap-3 text-base">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Invite signers
                </li>
                <li className="flex items-center gap-3 text-base">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Audit trails
                </li>
              </ul>
              <Link to="/auth?mode=signup">
                <Button size="lg" className={`w-full bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black ${selectedPlan === "Pro" ? "animate-pulse" : ""}`}>Start Free Trial</Button>
              </Link>
            </div>

            {/* Business Plan */}
            <div 
              onClick={() => setSelectedPlan("Business")}
              className={`bg-card rounded-2xl p-10 flex flex-col transition-all duration-300 cursor-pointer ${
                selectedPlan === "Business" ? "border-2 border-primary shadow-xl md:scale-105 z-10 ring-4 ring-primary/10" : "border border-border hover:border-primary/50"
              }`}
            >
              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">Business</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{currency === "USD" ? "$25" : "₦34,000"}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-base text-muted-foreground mt-2">For teams & organizations</p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-base">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-3 text-base">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Team management
                </li>
                <li className="flex items-center gap-3 text-base">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  Custom branding
                </li>
              </ul>
              <Button 
                variant="outline" 
                size="lg" 
                className={`w-full ${selectedPlan === "Business" ? "animate-pulse" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowContactModal(true);
                }}
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
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
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-2xl bg-gradient-primary p-10 md:p-14 text-center overflow-hidden">
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
      <footer className="bg-background border-t border-border pt-16 pb-8 px-6">
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
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
                <a href="https://www.instagram.com/e.ndorse?igsh=MWs2MnltaGdxbDU3eA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><Instagram className="w-5 h-5" /></a>
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
                <Input placeholder="Enter your email" className="bg-background" />
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
                >
                  <option value="en">English (US)</option>
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
            <div className="flex gap-8 text-base text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
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
            >
              <X className="w-5 h-5" />
            </button>
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
              title="Product Demo" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}

      {/* Live Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {showChat && (
          <div className="bg-card border border-border rounded-xl shadow-2xl w-80 sm:w-96 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-[#FFC83D] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="font-bold text-black">Endorse Support</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-black/80 hover:text-black transition-colors">
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
        >
          {showChat ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
};

export default Landing;
