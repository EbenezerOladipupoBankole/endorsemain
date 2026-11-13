import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

import { useAuth } from "@/components/AuthContext";
import { ChatWidget } from "@/components/ChatWidget";
import {
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  Search,
  PenTool,
  ArrowRight,
  FileText,
  MousePointerClick,
  Download,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const tiers = [
  {
    name: 'Free',
    price: '$0',
    frequency: '',
    features: ['3 free documents', 'Draw, type or upload signatures', 'Templates and invoices'],
    color: 'text-[#0A66C2]',
    buttonColor: 'bg-white text-[#0A66C2] ring-1 ring-inset ring-[#0A66C2] hover:bg-[#0A66C2]/5 focus-visible:outline-[#0A66C2]',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$8',
    frequency: '/30 days',
    features: ['Unlimited signing and sending', 'Email and WhatsApp signers', 'Signing status tracking'],
    color: 'text-[#0A66C2]',
    buttonColor: 'bg-[#0A66C2] text-white hover:bg-[#08519c] focus-visible:outline-[#0A66C2]',
    highlight: true,
  },
  {
    name: 'Business',
    price: '$15',
    frequency: '/30 days',
    features: ['Everything in Pro', 'Team management', 'Custom branding'],
    color: 'text-slate-900',
    buttonColor: 'bg-[#FFC83D] text-slate-900 hover:bg-[#e6b435] focus-visible:outline-[#FFC83D]',
    highlight: false,
  },
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Links like /#pricing or /#features (from the header, footer, or other pages) should land on that
  // section — React Router doesn't scroll to hash targets on its own.
  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => clearTimeout(timer);
  }, [location.hash]);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [isStepAutoplay, setIsStepAutoplay] = useState(true);

  useEffect(() => {
    if (!isStepAutoplay) return;
    const timer = setInterval(() => {
      setActiveWorkflowStep((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, [isStepAutoplay]);

  const [faqCategory, setFaqCategory] = useState("All");
  const [faqSearch, setFaqSearch] = useState("");

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

  const handleUpgrade = (plan: string) => {
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }
    navigate(`/payment?plan=${plan.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>

      {/* Hero: words only, no product graphic */}
      <section className="bg-[#F4F7FB] dark:bg-slate-950 px-4 md:px-6 pt-16 pb-16 sm:pt-24 md:pt-32 md:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-base font-semibold uppercase tracking-wider text-[#0A66C2] dark:text-[#7cb7f0]">
            eSignature for digital agreements
          </p>
          <h1 className="mt-5 font-display text-[2.4rem] sm:text-6xl md:text-7xl font-extrabold leading-[1.04] tracking-tight text-slate-900 dark:text-white">
            eSign your agreements on one structured platform.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg md:text-2xl leading-relaxed text-slate-600 dark:text-slate-400">
            Take every agreement from upload to signed record. Send it by email or WhatsApp, follow each
            step as it happens, and keep an audit trail anyone can verify.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="h-14 rounded-full px-8 text-lg font-extrabold bg-[#FFC83D] text-black hover:bg-[#e6b435]">
              <Link to="/auth?mode=signup">Start signing free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-full px-8 text-lg font-bold border-slate-400 bg-transparent dark:border-slate-600">
              <a href="#pricing">View pricing</a>
            </Button>
          </div>
          <p className="mt-5 text-base text-slate-600 dark:text-slate-400">3 free documents · No card required · Free for signers</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-white border-y border-slate-100 relative overflow-hidden">

        <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-20">
            <p className="text-base font-semibold uppercase tracking-wider text-[#0A66C2] mb-3">How it works</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Every agreement follows the same clear steps
            </h2>
            <p className="text-slate-500 text-lg md:text-xl leading-relaxed">
              Upload, prepare and send. Signers eSign from any device with no app to install, and the signed copy comes back to you with its audit trail.
            </p>
          </div>

          {/* Interactive Stepper split layout */}
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">

            {/* Left Column: Interactive Steppers */}
            <div className="w-full lg:w-[45%] flex flex-col gap-3 sm:gap-6">
              {[
                {
                  id: 0,
                  step: "01",
                  title: "Upload",
                  subtitle: "PDF or Word",
                  desc: "Bring in a PDF or Word file from your computer or phone, or start from one of your saved templates."
                },
                {
                  id: 1,
                  step: "02",
                  title: "Prepare",
                  subtitle: "Place every field",
                  desc: "Add each signer by email or WhatsApp number, then place signature, initials, date and text fields exactly where they belong."
                },
                {
                  id: 2,
                  step: "03",
                  title: "Send & sign",
                  subtitle: "Always know where it stands",
                  desc: "Secure signing links go out by email or WhatsApp. Watch each document move from awaiting signature to signed, then download the completed copy."
                }
              ].map((item, i) => {
                const isActive = activeWorkflowStep === item.id;
                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isActive}
                    onClick={() => {
                      setActiveWorkflowStep(item.id);
                      setIsStepAutoplay(false); // Pause autoplay on manual click
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setActiveWorkflowStep(item.id);
                        setIsStepAutoplay(false);
                      }
                    }}
                    onMouseEnter={() => setIsStepAutoplay(false)} // Pause on hover
                    onMouseLeave={() => setIsStepAutoplay(true)}  // Resume on leave
                    className={`group flex items-start gap-4 sm:gap-5 p-4 sm:p-6 rounded-2xl border transition-all duration-350 cursor-pointer text-left ${isActive ? 'bg-slate-50/80 border-slate-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50/40'}`}
                  >
                    {/* Step number */}
                    <span className={`w-10 shrink-0 font-display text-3xl font-extrabold leading-none tabular-nums transition-colors ${isActive ? 'text-[#0A66C2]' : 'text-slate-400'}`}>
                      {item.step}
                    </span>

                    {/* Stepper Details */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm uppercase tracking-wider font-extrabold text-muted-foreground">{item.subtitle}</span>
                      <h3 className={`text-xl font-bold mt-1 mb-1.5 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.title}
                      </h3>

                      {/* Smooth collapsible description */}
                      <div className={`overflow-hidden transition-all duration-350 ${isActive ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                        <p className="text-base text-slate-500 leading-relaxed">
                          {item.desc}
                        </p>

                        {/* Miniature Progress Bar */}
                        <div className="w-full bg-slate-200/80 h-1 rounded-full mt-4 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-[6000ms] ease-linear ${isActive && isStepAutoplay ? 'w-full bg-primary' : 'w-0'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Visual Showcase Frame */}
            <div className="w-full lg:w-[55%]">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden sm:aspect-[4/3] flex flex-col relative ring-1 ring-black/5">
                {/* Window Bar */}
                <div className="bg-slate-100 px-4 py-3.5 border-b border-slate-200 flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white border border-slate-200 rounded-md px-4 py-1.5 text-[11px] text-slate-500 font-medium flex items-center gap-2 w-full max-w-[280px] justify-center shadow-sm">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-mono">e-ndorse.online/sign</span>
                    </div>
                  </div>
                </div>

                {/* Simulated App Views */}
                <div className="flex-1 bg-white p-3 sm:p-6 flex flex-col justify-center items-center text-slate-900 w-full overflow-hidden">

                  {/* View 1: Upload Document Screen */}
                  {activeWorkflowStep === 0 && (
                    <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-xl p-5 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-300 text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upload Documents</span>
                        <span className="text-[10px] text-slate-500 font-medium">Step 1 of 3</span>
                      </div>

                      <div className="border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-5 text-center bg-slate-50/50 transition-colors">
                        <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-700">Drag & drop files here</p>
                        <p className="text-[10px] text-slate-500 mt-1">PDF, Word, or JPG up to 25MB</p>
                      </div>

                      <div className="space-y-3">
                        {/* File 1: Processed */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/30 border border-emerald-100 text-xs">
                          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">NDA_Corporate_Final.pdf</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">1.2 MB • Processing complete</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">Ready</span>
                        </div>

                        {/* File 2: Uploading */}
                        <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-100 bg-white text-xs">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 truncate">Partnership_Agreement_Draft.pdf</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">3.8 MB • Uploading...</p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-primary shrink-0">85%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full w-[85%] rounded-full animate-[shimmer_2s_infinite_linear]" style={{
                              backgroundImage: "linear-gradient(90deg, #0A66C2 0%, #3b82f6 50%, #0A66C2 100%)",
                              backgroundSize: "200% 100%"
                            }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View 2: Prepare & Place Fields Screen */}
                  {activeWorkflowStep === 1 && (
                    <div className="w-full max-w-[440px] bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-lg animate-in fade-in zoom-in-95 duration-300 flex flex-col gap-3 min-h-[260px] text-left">
                      {/* Editor Toolbar */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 text-[10px] text-slate-500 font-bold">
                        <span className="text-slate-500">DOCUMENT EDITOR</span>
                        <div className="flex gap-2">
                          <span className="bg-white border px-1.5 py-0.5 rounded text-slate-600">Page 1 of 2</span>
                          <span className="bg-white border px-1.5 py-0.5 rounded text-slate-600">100%</span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-stretch flex-1">
                        {/* Left Sidebar of Mock Editor */}
                        <div className="w-24 shrink-0 flex flex-col gap-2 border-r border-slate-200 pr-2">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 mb-0.5">Drag Fields</span>
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 p-2 rounded-md text-[10px] font-extrabold flex items-center gap-1.5 cursor-grab">
                            <PenTool className="w-3.5 h-3.5" /> Signature
                          </div>
                          <div className="bg-white border border-slate-200 text-slate-600 p-2 rounded-md text-[10px] font-medium flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 font-bold flex items-center justify-center border rounded border-slate-300 text-[8px]">In</span> Initials
                          </div>
                          <div className="bg-white border border-slate-200 text-slate-600 p-2 rounded-md text-[10px] font-medium flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 font-bold flex items-center justify-center border rounded border-slate-300 text-[8px]">Dt</span> Date Signed
                          </div>
                        </div>

                        {/* Main Doc Canvas Mock */}
                        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 relative overflow-hidden flex flex-col justify-between text-left min-h-[160px]">
                          <div>
                            <p className="text-[10px] font-bold text-slate-900 border-b border-slate-100 pb-1 mb-2">MUTUAL NON-DISCLOSURE AGREEMENT</p>
                            <div className="space-y-1">
                              <p className="text-[8px] text-slate-600 leading-normal">This agreement is entered into by and between the parties to protect proprietary information...</p>
                              <div className="h-1 w-full bg-slate-100 rounded" />
                              <div className="h-1 w-11/12 bg-slate-100 rounded" />
                            </div>
                          </div>

                          {/* Signature Drop Zone */}
                          <div className="border-2 border-dashed border-emerald-500 bg-emerald-50/30 p-2 rounded-md flex items-center justify-between relative mt-4">
                            <span className="text-[8px] font-mono text-emerald-700 font-bold uppercase tracking-wider">eSign Block (Signer 1)</span>
                            <span className="text-[7px] bg-emerald-700 text-white font-extrabold px-1 py-0.5 rounded shadow-sm">Placed</span>
                          </div>

                          {/* Animated Cursor Dragging Icon */}
                          <div className="absolute top-1/2 left-1/3 flex items-center gap-1 pointer-events-none animate-[float_4s_ease-in-out_infinite]">
                            <MousePointerClick className="w-4 h-4 text-primary shrink-0" />
                            <span className="bg-emerald-700 text-white text-[8px] font-bold px-2 py-1 rounded shadow-md ring-2 ring-emerald-400 flex items-center gap-1">
                              <PenTool className="w-2.5 h-2.5" /> Signature
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View 3: Track & Complete Screen */}
                  {activeWorkflowStep === 2 && (
                    <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-xl p-5 shadow-lg animate-in fade-in zoom-in-95 duration-300 space-y-4 text-left">
                      {/* Header with status badge */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Overview</p>
                          <h4 className="text-sm font-extrabold text-slate-800 mt-0.5">Rental_Agreement_2026.pdf</h4>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </div>
                      </div>

                      {/* Timeline Logs */}
                      <div className="space-y-3 relative before:absolute before:bottom-2 before:top-2 before:left-[11px] before:w-0.5 before:bg-slate-100">
                        <div className="flex items-start gap-3 text-xs relative">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold font-mono text-[10px] border border-blue-100 z-10">1</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">Document created by Dr. Williams</p>
                            <p className="text-[10px] text-slate-500">Aug 25, 11:15 AM</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-xs relative">
                          <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold font-mono text-[10px] border border-amber-100 z-10">2</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">Sent to Sarah Okafor (sarah@company.com)</p>
                            <p className="text-[10px] text-slate-500">Aug 25, 11:20 AM • Secure Signing Link</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-xs relative">
                          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold font-mono text-[10px] border border-emerald-100 z-10">3</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">Sarah Okafor signed the contract</p>
                            <p className="text-[10px] text-slate-500">Aug 25, 11:32 AM • Signed &amp; emailed to you</p>
                          </div>
                        </div>
                      </div>

                      {/* Download Signed File button */}
                      <div className="pt-2">
                        <button className="w-full bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-extrabold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
                          <Download className="w-3.5 h-3.5" /> Download Signed PDF
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Features (Alternating Layout) */}
      <section id="features" className="scroll-mt-20 py-16 md:py-24 px-4 md:px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl px-0 sm:px-8">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-base font-semibold text-primary uppercase tracking-wider mb-3">Built for digital agreements</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Structure every agreement, from draft to signed record
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Prepare, send, eSign, track and store your agreements, then invoice the client, without leaving Endorse.
            </p>
          </div>

          {/* Product tour: each card links to its product page */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16 md:mb-24">
            {[
              { title: "eSign documents", text: "Sign any PDF or Word file in seconds and keep a clean, signed copy.", to: "/product/esign" },
              { title: "Send for signature", text: "Route a document to one or many signers by email or WhatsApp and see who has signed.", to: "/product/send-for-signature" },
              { title: "Templates", text: "Save an agreement once and reuse it. Each signer's details fill in automatically.", to: "/product/templates" },
              { title: "Invoices", text: "Professional, itemised invoices with tax and discounts in 10 currencies, delivered as a PDF.", to: "/product/invoices" },
              { title: "File conversion", text: "Convert between Word, PDF and images, merge files and password-protect PDFs.", to: "/conversion" },
              { title: "Teams", text: "Bring your team onto the Business plan and share templates across the company.", to: "/#pricing" },
            ].map((p) => (
              <Link
                key={p.title}
                to={p.to}
                className="group rounded-2xl border border-border bg-card p-5 sm:p-6 transition-colors hover:border-[#0A66C2]/40"
              >
                <h3 className="text-xl font-bold text-foreground">{p.title}</h3>
                <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{p.text}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-base font-semibold text-[#0A66C2]">
                  Learn more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>

          {/* Feature 1: Signing Experience */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24">
            <div className="w-full md:w-1/2 order-2 md:order-1">
              <div className="relative rounded-2xl bg-gradient-to-br from-secondary to-background border border-border p-4 sm:p-8 shadow-lg">
                {/* Mock Document Interface */}
                <div className="bg-white rounded-lg shadow-sm border border-border/50 p-6 sm:p-8 min-h-[260px] sm:min-h-[300px] relative">
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
                      Dr. Williams
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 opacity-100 group-hover:opacity-0 transition-opacity">Click to sign</p>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -right-2 sm:-right-4 top-6 sm:top-10 bg-background border border-border shadow-xl rounded-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-1000 delay-500">
                  <div className="bg-green-100 p-2 rounded-full"><ShieldCheck className="w-4 h-4 text-green-600" /></div>
                  <div>
                    <p className="text-xs font-bold">Legally Binding</p>
                    <p className="text-xs text-muted-foreground">ESIGN Compliant</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 order-1 md:order-2">
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">eSign from anywhere, on any device.</h3>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                Draw your signature, type it in a handwriting style, or upload an image of it. Endorse runs in the browser, so signers never need to install an app.
              </p>
              <ul className="space-y-3">
                {["Draw, type, or upload a signature", "Initials, dates, names and text fields too", "No account needed for WhatsApp signers"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#0A66C2] shrink-0" />
                    <span className="text-foreground text-base font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2: Tracking */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24">
            <div className="w-full md:w-1/2">
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">Know where every agreement stands.</h3>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed">
                Every document shows when it went out and when each person signed. The completed copy is emailed to you the moment it's done, and a gentle reminder is one click away.
              </p>
              <Link to="/product/send-for-signature" className="inline-flex">
                <Button variant="outline" className="group h-11 px-5">
                  How sending works
                </Button>
              </Link>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative rounded-2xl bg-card border border-border p-4 sm:p-6 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-border/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity</span>
                  <span className="truncate text-xs font-medium text-muted-foreground">Tenancy_Agreement.pdf</span>
                </div>

                <ol className="space-y-5">
                  {[
                    { initials: "SO", name: "Sarah Okafor", action: "Opened the document", time: "10:42 AM" },
                    { initials: "KM", name: "Kwame Mensah", action: "Signed", time: "10:47 AM" },
                    { initials: "", name: "Endorse", action: "Signed copy and audit trail emailed to both parties", time: "10:47 AM" },
                  ].map((row) => (
                    <li key={row.name} className="flex items-start gap-3">
                      {row.initials ? (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {row.initials}
                        </span>
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-xs font-bold text-white">E</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-bold text-foreground">{row.name}</p>
                          <p className="shrink-0 text-xs text-muted-foreground">{row.time}</p>
                        </div>
                        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{row.action}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Feature 3: Security */}
          <div className="py-12 border-t border-slate-100">
            <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
              <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-slate-900 dark:text-white">Legally binding, with a record to prove it.</h3>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Identity checks, a timestamped audit trail for every signature, a tamper-evident seal and encrypted storage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto">
              {[
                {
                  title: "Verified Signers",
                  desc: "Email signers sign in with the exact address you sent to, and WhatsApp signers confirm a one-time code sent to their phone — so you know the right person signed.",
                  badge: "Identity Checks"
                },
                {
                  title: "Legal Compliance Standards",
                  desc: "Endorse provides simple electronic signatures of the kind recognised under the US ESIGN Act and UETA and the EU's eIDAS regulation, and handles personal data in line with the Nigeria Data Protection Act (NDPA). Signers adopt their signature with an explicit agreement before signing.",
                  badge: "ESIGN, eIDAS & NDPA Compliant"
                },
                {
                  title: "A Record of Every Signature",
                  desc: "Each signed document keeps who signed, where every field was placed and exactly when it was signed — and you're emailed a link to the signed copy the moment it's done.",
                  badge: "Timestamped"
                },
                {
                  title: "Encrypted storage",
                  desc: "Your files are encrypted in transit with TLS and at rest with AES-256 on Google Cloud, and only you and the people you invite can open your documents.",
                  badge: "AES-256 Standards"
                }
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 sm:p-8 rounded-2xl flex flex-col justify-between text-left hover:shadow-md transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm uppercase font-extrabold tracking-wider text-slate-700 bg-slate-200/60 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded">
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {item.title}
                    </h4>
                    <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="scroll-mt-20 bg-white px-4 py-16 md:px-6 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-base font-semibold uppercase tracking-wider text-[#0A66C2]">Pricing</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-gray-900 sm:text-5xl">
              Plans for every stage of your business
            </h2>
          </div>
          <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-6 md:mt-14 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col justify-between rounded-3xl p-6 transition-shadow duration-300 hover:shadow-lg sm:p-8 xl:p-10 ${
                  tier.highlight ? 'ring-2 ring-[#0A66C2] shadow-md' : 'ring-1 ring-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-x-4">
                    <h3 id={tier.name} className={`text-lg font-semibold leading-8 ${tier.color}`}>
                      {tier.name}
                    </h3>
                    {tier.highlight && (
                      <span className="inline-flex items-center rounded-full bg-[#FFC83D] px-2.5 py-1 text-xs font-bold text-slate-900">
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="mt-4 flex items-baseline gap-x-1">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">{tier.price}</span>
                    {tier.frequency && <span className="text-base font-semibold leading-6 text-gray-600">{tier.frequency}</span>}
                  </p>
                  <ul role="list" className="mt-8 space-y-3 text-base leading-6 text-gray-600">
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
                  className={`mt-8 block min-h-[44px] w-full rounded-full px-4 text-center text-base font-bold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tier.buttonColor}`}
                >
                  Get started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-28 px-4 md:px-6 bg-slate-50/50 dark:bg-slate-900/20 border-t border-border/40">
        <div className="container mx-auto max-w-4xl px-0 sm:px-4">
          {/* Header */}
          <div className="text-center mb-10 md:mb-12">
            <p className="text-base font-semibold uppercase tracking-wider text-[#0A66C2] dark:text-[#FFC83D] mb-3">FAQ</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Legal standing, security and billing, answered plainly.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 mb-6 md:mb-10">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search questions..."
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-base md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] dark:focus:ring-[#FFC83D] transition-all shadow-sm"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {["All", "Legal & Security", "Signing & Docs", "Pricing & Billing"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFaqCategory(cat)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-base font-bold whitespace-nowrap shrink-0 transition-all duration-200 ${faqCategory === cat
                    ? "bg-[#0A66C2] text-white shadow-md shadow-[#0A66C2]/20 dark:bg-[#FFC83D] dark:text-black"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Accordions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 sm:p-6 shadow-sm">
            <Accordion type="single" collapsible className="w-full space-y-1 sm:space-y-2">
              {[
                {
                  id: "faq-1",
                  category: "Legal & Security",
                  q: "Are signatures made with Endorse legally binding?",
                  a: "For most everyday agreements, yes. Endorse provides simple electronic signatures of the kind recognised under the US ESIGN Act and UETA and the EU's eIDAS regulation. Some documents, such as wills or land transfers in certain countries, still need a handwritten signature or a notary, so check if you're unsure."
                },
                {
                  id: "faq-2",
                  category: "Legal & Security",
                  q: "How is my document data secured?",
                  a: "Documents are encrypted in transit with TLS and at rest with AES-256 on Google Cloud. Only you and the people you send a document to can open it, and signers verify who they are before signing."
                },
                {
                  id: "faq-3",
                  category: "Signing & Docs",
                  q: "Can I sign documents on my smartphone or tablet?",
                  a: "Yes. Endorse works in the browser on iPhone and Android, so there's no app to install. Draw your signature with your finger, type it, or upload a photo of it."
                },
                {
                  id: "faq-4",
                  category: "Signing & Docs",
                  q: "Do my recipients need an account to sign?",
                  a: "WhatsApp signers don't — they confirm a one-time code sent to their phone and sign straight away. Email signers sign in or create a free account with the address you sent to, so you know the right person signed. Nobody needs to download an app."
                },
                {
                  id: "faq-5",
                  category: "Pricing & Billing",
                  q: "What happens after my free documents?",
                  a: "Every account gets 3 free documents — signing and downloading your own, or sending one for signature. After that, upgrade to Pro or Business for unlimited signing and sending. Your existing documents stay available either way, and signing documents other people send you is always free."
                },
                {
                  id: "faq-6",
                  category: "Pricing & Billing",
                  q: "Will I be charged automatically?",
                  a: "No. Each payment covers 30 days and nothing renews automatically. We email you a few days before your plan ends, and you can renew whenever you like — there's nothing to cancel."
                },
                {
                  id: "faq-7",
                  category: "Signing & Docs",
                  q: "What document file formats are supported?",
                  a: "Endorse supports PDF files (.pdf) and Microsoft Word documents (.doc, .docx). Word files are converted to PDF for signing; the conversion keeps the text but not the original layout, so for exact formatting upload a PDF."
                },
                {
                  id: "faq-8",
                  category: "Legal & Security",
                  q: "What record is kept of each signature?",
                  a: "Each signed document stores the signature, where every field was placed and the date and time it was signed. You can see when a document was sent, delivered and signed, and you're emailed a link to the signed copy as soon as it's done."
                }
              ]
                .filter((item) => {
                  const matchesCategory = faqCategory === "All" || item.category === faqCategory;
                  const matchesSearch =
                    item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
                    item.a.toLowerCase().includes(faqSearch.toLowerCase());
                  return matchesCategory && matchesSearch;
                })
                .map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="border-slate-100 dark:border-slate-800 last:border-b-0 px-3 sm:px-4 py-0.5 sm:py-2 rounded-xl transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <AccordionTrigger className="min-h-[52px] text-left font-display font-semibold text-lg md:text-xl text-slate-900 dark:text-white hover:no-underline py-3 gap-3">
                      <span className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A66C2] dark:bg-[#FFC83D] shrink-0 opacity-75" />
                        {faq.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed pl-4 sm:pl-5 pb-3">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>

          {/* Still Have Questions Support Box */}
          <div className="mt-8 md:mt-12 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 shadow-sm">
            <div className="text-center md:text-left">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Still have questions?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-base">Email us and a person will reply.</p>
              </div>
            </div>
            <a
              href="mailto:support@e-ndorse.online"
              className="min-h-[44px] w-full sm:w-auto justify-center bg-[#0A66C2] hover:bg-[#08519c] text-white font-bold text-base px-6 py-3 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2"
            >
              <span>support@e-ndorse.online</span>
            </a>
          </div>
        </div>
      </section>

      {/* Social Proof - Temporarily Hidden */}
      {/* 
      <section id="testimonials" className="py-24 px-6 bg-secondary/30">...</section>
      */}

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl px-0 sm:px-8">
          <div className="relative rounded-2xl bg-gradient-to-br from-[#0A66C2] to-[#08519c] p-6 sm:p-8 md:p-14 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Put your next agreement on Endorse.
              </h2>
              <p className="text-white/85 text-lg md:text-xl mb-8 max-w-xl mx-auto">
                Send your first document in minutes. 3 documents free, no card required.
              </p>
              <Link to="/auth?mode=signup" className="inline-flex w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-[#FFC83D] text-black hover:bg-[#e6b435] font-semibold text-lg md:text-xl h-14 px-8">
                  Get Started Free

                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      </main>
      <SiteFooter />

      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <div role="region" aria-label="Cookie consent" className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-3 py-3 sm:px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-500">
          <div className="container mx-auto max-w-6xl px-0 sm:px-4 flex items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-base leading-snug text-muted-foreground">
                <span className="sm:hidden">We use cookies to improve your experience.</span>
                <span className="hidden sm:inline">We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.</span>
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Button variant="outline" className="h-11 px-3 sm:px-4" onClick={() => setShowCookieConsent(false)}>
                Decline
              </Button>
              <Button className="h-11 px-4 bg-[#FFC83D] text-black hover:bg-[#e6b435]" onClick={acceptCookies}>
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}

      <ChatWidget raised={showCookieConsent} />
    </div>
  );
};

export default Landing;
