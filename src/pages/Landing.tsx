import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

import { useAuth } from "@/components/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/components/client";
import { toast } from "sonner";
import {
  UploadCloud,
  Send,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Cpu,
  HelpCircle,
  Search,
  MessageCircle,
  ChevronDown,
  PenTool,


  Bot,
  X,
  Eye,
  Check,
  FileText,
  MousePointerClick,
  Download,
  Cookie,
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
    frequency: '/month',
    features: ['Unlimited documents', 'Basic signatures'],
    color: 'text-[#0A66C2]',
    buttonColor: 'bg-white text-[#0A66C2] ring-1 ring-inset ring-[#0A66C2] hover:bg-[#0A66C2]/5 focus-visible:outline-[#0A66C2]',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$8',
    frequency: '/month',
    features: ['Unlimited documents', 'Invite signers', 'Audit trails'],
    color: 'text-[#0A66C2]',
    buttonColor: 'bg-[#0A66C2] text-white hover:bg-[#08519c] focus-visible:outline-[#0A66C2]',
    highlight: true,
  },
  {
    name: 'Business',
    price: '$15',
    frequency: '/month',
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { text: "Hello! 👋 Thanks for visiting Endorse. How can we help you streamline your agreements today?", isUser: false, time: "Just now" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [isStepAutoplay, setIsStepAutoplay] = useState(true);

  useEffect(() => {
    if (!isStepAutoplay) return;
    const timer = setInterval(() => {
      setActiveWorkflowStep((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, [isStepAutoplay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowVideoModal(false);
      }
    };
    if (showVideoModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showVideoModal]);

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

  const getBotResponse = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("price") || lower.includes("cost") || lower.includes("plan") || lower.includes("free")) {
      return "Endorse is completely free right now! Enjoy unlimited documents, e-signatures, audit trails, and all premium features without any charge.";
    }
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      return "Hi there! Ready to sign some documents? 📄 How can I help you today?";
    }
    if (lower.includes("security") || lower.includes("safe") || lower.includes("legal") || lower.includes("binding")) {
      return "Yes! Endorse is ESIGN compliant and uses 256-bit SSL encryption to keep your data secure and legally binding.";
    }
    if (lower.includes("support") || lower.includes("help")) {
      return "You can reach our support team at support@endorse.com or browse our Help Center resources.";
    }
    return "Thanks for the message! A support agent will be with you shortly. In the meantime, feel free to browse our features.";
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const newMessage = { text, isUser: true, time: "Just now" };
    setChatMessages((prev) => [...prev, newMessage]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const response = getBotResponse(text);
      setChatMessages((prev) => [...prev, { text: response, isUser: false, time: "Just now" }]);
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
      audio.play().catch((e) => console.error("Audio play failed:", e));
    }, 1500);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(chatInput);
  };



  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Redesigned Hero Section */}
      <section className="pt-8 pb-10 md:pt-12 md:pb-14 px-4 md:px-6 bg-white dark:bg-slate-950 relative overflow-hidden">

        <div className="container mx-auto max-w-7xl px-0 sm:px-8 relative flex flex-col items-center text-center">
          {/* Headline */}
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-3 leading-[1.1] tracking-tight max-w-3xl animate-fade-up">
            Document Management Software & <br className="hidden md:inline" /> Secure File Portal
          </h1>

          {/* Subheadline */}
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-6 md:mb-4 leading-relaxed animate-fade-up-delay-1">
            Boost business efficiency with a dynamic document management solution. Endorse is the easiest and most secure way to optimize how you, your staff, and your clients gather, store, share, and eSign documents in the cloud.
          </p>

          {/* Visual Showcase Composition */}
          <div className="w-full flex justify-center animate-scale-in px-0 sm:px-0">
            <div className="relative w-full max-w-4xl md:aspect-[16/10]">

              {/* Background Vault/Arch - Blue Dome Circle */}
              <div className="hidden md:block absolute right-[8%] top-0 w-[36%] aspect-square bg-[#0A66C2] dark:bg-[#0052a3] rounded-full -z-10 shadow-2xl shadow-blue-500/20 opacity-95 animate-pulse-glow" />

              {/* Main Browser Window (Left/Center) */}
              <div className="relative md:absolute md:left-0 md:top-[2%] w-full md:w-[72%] bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col text-left sm:aspect-[4/3.1]">
                {/* Title Bar */}
                <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3 shrink-0">
                  {/* Window Controls */}
                  <div className="flex gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] border border-[#E0443E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E] border border-[#D89E24]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28C840] border border-[#1AAB29]" />
                  </div>
                  {/* Address Bar */}
                  <div className="flex-1 flex justify-center">
                    <div className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-lg px-4 py-1 text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 w-full max-w-[220px] justify-center shadow-inner font-mono truncate">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full shrink-0" />
                      <span className="opacity-80">endorse.com/files</span>
                    </div>
                  </div>
                  <div className="w-10 shrink-0" />
                </div>

                {/* Browser Content */}
                <div className="flex-1 flex min-h-0 bg-white dark:bg-slate-950">
                  {/* Sidebar (left) */}
                  <div className="hidden sm:flex w-[30%] border-r border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 flex-col justify-between py-5 px-3 shrink-0">
                    <div className="space-y-5">
                      {/* Sidebar Brand Heading */}
                      <div className="flex items-center gap-2 px-2 text-[#0A66C2] dark:text-[#FFC83D] font-bold text-xs uppercase tracking-wider">
                        <div className="w-5 h-5 rounded-md bg-[#0A66C2] flex items-center justify-center text-white text-[10px] font-black shadow-sm shadow-blue-500/20">E</div>
                        <span className="font-display">Endorse</span>
                      </div>

                      {/* Navigation Menu Links */}
                      <div className="space-y-1">
                        {[
                          { name: "Home", active: false },
                          { name: "View Files and Folders", active: true },
                          { name: "Bulk Send Files", active: false },
                          { name: "Request Docs", active: false },
                          { name: "Client Management", active: false },
                          { name: "Manage Employees", active: false }
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[10px] font-bold transition-all ${item.active
                              ? "bg-[#0A66C2]/8 text-[#0A66C2] dark:bg-[#FFC83D]/10 dark:text-[#FFC83D] shadow-sm"
                              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-900/50"
                              }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.active ? "bg-[#0A66C2] dark:bg-[#FFC83D]" : "bg-transparent"}`} />
                            <span className="truncate">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Curly-haired woman avatar profile */}
                    <div className="px-2 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                        <img src="https://images.unsplash.com/photo-1507152832244-10d45c7eda57?auto=format&fit=crop&crop=faces&q=80&w=100&h=100" alt="Sarah J." className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">Sarah J.</p>
                        <p className="text-[7.5px] text-slate-400 truncate">Workspace Owner</p>
                      </div>
                    </div>
                  </div>

                  {/* Main File Table Panel */}
                  <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-5 bg-white dark:bg-slate-950 overflow-hidden">
                    {/* Panel Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-900 shrink-0">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-250">View Files and Folders</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5">Work faster by adding shortcuts to your favorite folders here</p>
                      </div>
                      <span aria-hidden="true" className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-350 shadow-sm shrink-0">
                        + Add shortcuts
                      </span>
                    </div>

                    {/* Table Data */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pt-3">
                      <table className="w-full text-left text-[10px]">
                        <thead>
                          <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-900 pb-2">
                            <th className="pb-2 w-6"><span aria-hidden="true" className="block w-3 h-3 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" /></th>
                            <th className="pb-2 font-extrabold flex items-center gap-0.5">Name <ChevronDown className="w-2.5 h-2.5 inline rotate-180 text-slate-400" /></th>
                            <th className="pb-2 font-extrabold">Last Modified</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-900/50">
                          {[
                            { name: "Johnston, Randy", date: "Aug 20, 2021" },
                            { name: "Jon Bransen, LLC", date: "Jan 17, 2022" },
                            { name: "Jones, Mack", date: "Jan 12, 2022" },
                            { name: "Julie Brooks", date: "Jan 12, 2022" },
                            { name: "Kennedy, Renee", date: "Jan 12, 2022" },
                            { name: "levi enterprises", date: "Jan 12, 2022" },
                            { name: "Lady, Carmen", date: "Jan 12, 2022" }
                          ].map((folder, i) => (
                            <tr key={i} className={`${i >= 4 ? "hidden sm:table-row " : ""}hover:bg-slate-50/50 dark:hover:bg-slate-900/30 text-slate-650 dark:text-slate-400 transition-colors`}>
                              <td className="py-2.5"><span aria-hidden="true" className="block w-3 h-3 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" /></td>
                              <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="text-amber-500 text-[11px]">📁</span>
                                <span className="truncate">{folder.name}</span>
                              </td>
                              <td className="py-2.5 text-slate-400 dark:text-slate-500">{folder.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Overlapping Card (Detail Explorer, Bottom Right) */}
              <div className="hidden md:flex absolute right-[2%] bottom-[8%] w-[46%] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden flex-col p-[18px] text-left aspect-[4/3.1] z-10 animate-float">
                {/* Breadcrumbs */}
                <div className="text-[10px] text-slate-400 font-bold truncate flex items-center gap-1">
                  <span>Clients</span> <span className="text-slate-300">&gt;</span>
                  <span>I-L</span> <span className="text-slate-300">&gt;</span>
                  <span className="text-slate-600 dark:text-slate-300 font-extrabold">Jones, Mack</span> <span className="text-slate-300">&gt;</span>
                  <span className="text-[#0A66C2] dark:text-[#FFC83D] font-extrabold">Quotes</span>
                </div>

                {/* Sub-search inside detail card */}
                <div className="mt-3 relative">
                  <div aria-hidden="true" className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-[10px] text-slate-400 w-full">
                    Search for a file...
                  </div>
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Sub-explorer Data Table */}
                <table className="w-full text-left text-[10px] mt-4">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-900 pb-2">
                      <th className="pb-1.5 w-6"></th>
                      <th className="pb-1.5 font-extrabold flex items-center gap-0.5">Name <ChevronDown className="w-2.5 h-2.5 inline rotate-180 text-slate-400" /></th>
                      <th className="pb-1.5 font-extrabold">Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-slate-600 dark:text-slate-300">
                      <td className="py-2.5"><span aria-hidden="true" className="block w-3 h-3 rounded-[3px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" /></td>
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="text-red-500 text-[12px]">📄</span>
                        <span className="truncate">Form 8879 - Mack Jones.pdf</span>
                      </td>
                      <td className="py-2.5 text-slate-450 dark:text-slate-500">Jan 12, 2022</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Golden Badge floating over overlap line */}
              <div className="hidden md:flex absolute right-[33%] top-[24%] bg-[#E88E2D] hover:bg-[#d07e25] text-white px-5 py-3 rounded-xl shadow-lg shadow-orange-500/10 border border-orange-400/20 text-[10px] font-black tracking-wide z-20 items-center justify-center cursor-pointer select-none max-w-[210px] text-center transform hover:scale-105 transition-all">
                Access folders and files from a web browser
              </div>

              {/* Blonde Woman Avatar (Right Circle Overlay) */}
              <div className="hidden md:block absolute right-[10%] bottom-[16%] w-[88px] h-[88px] rounded-full overflow-hidden border-[4px] border-white dark:border-slate-900 shadow-2xl z-20 hover:scale-105 transition-transform duration-300">
                <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&crop=faces&q=80&w=200&h=200" alt="Smiling Endorse customer" className="w-full h-full object-cover" />
              </div>

              {/* Curly Hair Woman Avatar (Bottom Left Overlay) */}
              <div className="hidden md:block absolute left-[15%] bottom-[5%] w-[72px] h-[72px] rounded-full overflow-hidden border-[4px] border-white dark:border-slate-900 shadow-2xl z-20 hover:scale-105 transition-transform duration-300">
                <img src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&crop=faces&q=80&w=200&h=200" alt="Endorse team member" className="w-full h-full object-cover" />
              </div>

              {/* Floating Green Color Palette Action Button (Bottom Left) */}
              <div aria-hidden="true" className="hidden md:flex absolute left-4 bottom-4 w-9 h-9 rounded-full bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-all z-20">
                <span className="text-base select-none">🎨</span>
              </div>

              {/* Floating Chat Action Button (Bottom Right) */}
              <button type="button" aria-label="Open chat" onClick={() => setShowChat(true)} className="hidden md:flex absolute right-4 bottom-4 w-11 h-11 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-[#0A66C2] dark:text-blue-300 items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-all z-30">
                <span className="text-base select-none" aria-hidden="true">💬</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section (Enterprise Simulator Showcase) */}
      <section className="py-20 md:py-28 bg-white border-y border-slate-100 relative overflow-hidden">

        <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-20">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> How It Works
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Signed in three simple steps
            </h2>
            <p className="text-slate-500 text-base md:text-lg leading-relaxed">
              Experience the fast, intuitive eSignature platform built for modern corporate teams and legal departments.
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
                  title: "Upload Document",
                  subtitle: "Sleek document ingestion",
                  desc: "Upload contract files (PDF, Word, or images) instantly. Our system parses layout margins and prepares the canvas for role placing.",
                  icon: UploadCloud,
                  activeColor: "border-primary text-primary"
                },
                {
                  id: 1,
                  step: "02",
                  title: "Add Signers & Prepare",
                  subtitle: "Drag & drop builder",
                  desc: "Add name and email addresses for signers. Seamlessly place required fields (signatures, initials, texts, or dates) on the page in seconds.",
                  icon: MousePointerClick,
                  activeColor: "border-emerald-500 text-emerald-600"
                },
                {
                  id: 2,
                  step: "03",
                  title: "Track & Complete",
                  subtitle: "Real-time auditing",
                  desc: "Send unique secure links. Monitor document state transitions live from your activity log, and download fully certified, legal audit trails.",
                  icon: ShieldCheck,
                  activeColor: "border-[#FFC83D] text-[#D89E24]"
                }
              ].map((item, i) => {
                const IconComp = item.icon;
                const isActive = activeWorkflowStep === item.id;
                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    aria-label={`Step ${item.step}: ${item.title}`}
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
                    {/* Stepper Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${isActive ? 'bg-primary text-white scale-105' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                      <IconComp className="w-5.5 h-5.5" />
                    </div>

                    {/* Stepper Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs uppercase tracking-wider font-extrabold text-muted-foreground">{item.subtitle}</span>
                        <span className={`shrink-0 whitespace-nowrap text-xs font-mono font-bold ${isActive ? 'text-primary' : 'text-slate-400'}`}>Step {item.step}</span>
                      </div>
                      <h3 className={`text-lg font-bold mt-1 mb-1.5 transition-colors ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                        {item.title}
                      </h3>

                      {/* Smooth collapsible description */}
                      <div className={`overflow-hidden transition-all duration-350 ${isActive ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                        <p className="text-sm text-slate-500 leading-relaxed">
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
                      <span className="opacity-80 font-mono">endorse.com/app/sign</span>
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
                        <span className="text-[10px] text-slate-400 font-medium">Step 1 of 3</span>
                      </div>

                      <div className="border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-5 text-center bg-slate-50/50 transition-colors">
                        <UploadCloud className="w-8 h-8 text-primary mx-auto mb-2 animate-bounce" />
                        <p className="text-xs font-bold text-slate-700">Drag & drop files here</p>
                        <p className="text-[10px] text-slate-400 mt-1">PDF, Word, or JPG up to 25MB</p>
                      </div>

                      <div className="space-y-3">
                        {/* File 1: Processed */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/30 border border-emerald-100 text-xs">
                          <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">NDA_Corporate_Final.pdf</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">1.2 MB • Processing complete</p>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">Ready</span>
                        </div>

                        {/* File 2: Uploading */}
                        <div className="flex flex-col gap-2 p-3 rounded-lg border border-slate-100 bg-white text-xs">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 truncate">Partnership_Agreement_Draft.pdf</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">3.8 MB • Uploading...</p>
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
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 text-[10px] text-slate-400 font-bold">
                        <span className="text-slate-500">DOCUMENT EDITOR</span>
                        <div className="flex gap-2">
                          <span className="bg-white border px-1.5 py-0.5 rounded text-slate-600">Page 1 of 2</span>
                          <span className="bg-white border px-1.5 py-0.5 rounded text-slate-600">100%</span>
                        </div>
                      </div>

                      <div className="flex gap-3 items-stretch flex-1">
                        {/* Left Sidebar of Mock Editor */}
                        <div className="w-24 shrink-0 flex flex-col gap-2 border-r border-slate-200 pr-2">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 mb-0.5">Drag Fields</span>
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 p-2 rounded-md text-[10px] font-extrabold flex items-center gap-1.5 cursor-grab">
                            <PenTool className="w-3.5 h-3.5" /> Signature
                          </div>
                          <div className="bg-white border border-slate-200 text-slate-400 p-2 rounded-md text-[10px] font-medium flex items-center gap-1.5 opacity-80">
                            <span className="w-3.5 h-3.5 font-bold flex items-center justify-center border rounded border-slate-300 text-[8px]">In</span> Initials
                          </div>
                          <div className="bg-white border border-slate-200 text-slate-400 p-2 rounded-md text-[10px] font-medium flex items-center gap-1.5 opacity-80">
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
                            <span className="text-[8px] font-mono text-emerald-600 font-bold uppercase tracking-wider">eSign Block (Signer 1)</span>
                            <span className="text-[7px] bg-emerald-500 text-white font-extrabold px-1 py-0.5 rounded shadow-sm">Placed</span>
                          </div>

                          {/* Animated Cursor Dragging Icon */}
                          <div className="absolute top-1/2 left-1/3 flex items-center gap-1 pointer-events-none animate-[float_4s_ease-in-out_infinite]">
                            <MousePointerClick className="w-4 h-4 text-primary shrink-0" />
                            <span className="bg-emerald-500 text-white text-[8px] font-bold px-2 py-1 rounded shadow-md ring-2 ring-emerald-400 flex items-center gap-1">
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
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Overview</p>
                          <h4 className="text-sm font-extrabold text-slate-800 mt-0.5">Rental_Agreement_2026.pdf</h4>
                        </div>
                        <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </div>
                      </div>

                      {/* Timeline Logs */}
                      <div className="space-y-3 relative before:absolute before:bottom-2 before:top-2 before:left-[11px] before:w-0.5 before:bg-slate-100">
                        <div className="flex items-start gap-3 text-xs relative">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold font-mono text-[10px] border border-blue-100 z-10">1</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">Document created by Dr. Williams</p>
                            <p className="text-[10px] text-slate-400">Aug 25, 11:15 AM • IP: 192.168.1.88</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-xs relative">
                          <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold font-mono text-[10px] border border-amber-100 z-10">2</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">Sent to Sarah Okafor (sarah@company.com)</p>
                            <p className="text-[10px] text-slate-400">Aug 25, 11:20 AM • Secure Signing Link</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 text-xs relative">
                          <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold font-mono text-[10px] border border-emerald-100 z-10">3</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 truncate">Sarah Okafor signed the contract</p>
                            <p className="text-[10px] text-slate-400">Aug 25, 11:32 AM • Verified Audit Certificate</p>
                          </div>
                        </div>
                      </div>

                      {/* Download Signed File button */}
                      <div className="pt-2">
                        <button className="w-full bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-extrabold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
                          <Download className="w-3.5 h-3.5" /> Download Certified PDF & Audit Log
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
            <p className="text-base font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
              Everything you need to manage signatures
            </h2>
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC83D]/15 text-[#8a6500] text-sm font-medium mb-4">

                Intuitive Signing
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">Sign documents anywhere, on any device.</h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Experience a signing process that feels natural. Whether you're on a desktop in the office or a mobile phone on the go, Endorse adapts to your screen.
              </p>
              <ul className="space-y-3">
                {["Draw, type, or upload signatures", "Mobile-responsive interface", "No account required for signers"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0A66C2] shrink-0" />
                    <span className="text-foreground text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2: Tracking */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-16 md:mb-24">
            <div className="w-full md:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium mb-4">

                Real-time Tracking
              </div>
              <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">Never wonder about status again.</h3>
              <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                Stay in the loop with instant notifications. Know exactly when your document is opened, viewed, and signed.
              </p>
              <Link to="/auth" className="inline-flex">
                <Button variant="outline" className="group h-11 px-5">
                  Explore Features
                </Button>
              </Link>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative rounded-2xl bg-card border border-border p-4 sm:p-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 p-16 bg-primary/5 blur-[50px] rounded-full pointer-events-none"></div>

                {/* Live Feed Header */}
                <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6 pb-4 border-b border-border/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Activity Feed</span>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs bg-secondary px-2.5 py-1 rounded-md text-muted-foreground font-semibold">Doc #394-02</span>
                </div>

                <div className="relative space-y-4 sm:space-y-6 pl-3 sm:pl-4 border-l-2 border-dashed border-border/80 ml-1.5 sm:ml-5">
                  {[
                    {
                      user: "Sarah Okafor",
                      action: "viewed the document",
                      time: "2 mins ago",
                      avatar: "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?auto=format&fit=crop&crop=focalpoint&fp-x=0.5&fp-y=0.18&fp-z=2.5&q=80&w=150&h=150",
                      initials: "SO",
                      bgGradient: "from-blue-500/10 to-sky-500/10",
                      ringColor: "ring-blue-100 dark:ring-blue-950",
                      badgeBg: "bg-blue-500",
                      badgeIcon: Eye,
                      textColor: "text-blue-600 dark:text-blue-400"
                    },
                    {
                      user: "Mike Ross",
                      action: "signed the contract",
                      time: "Just now",
                      avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&crop=faces&q=80&w=150&h=150",
                      initials: "MR",
                      bgGradient: "from-emerald-500/10 to-teal-500/10",
                      ringColor: "ring-emerald-100 dark:ring-emerald-950",
                      badgeBg: "bg-emerald-500",
                      badgeIcon: Check,
                      textColor: "text-emerald-600 dark:text-emerald-400",
                      isPulse: true
                    },
                    {
                      user: "System",
                      action: "sent copy to all parties",
                      time: "Just now",
                      avatar: null,
                      initials: "SYS",
                      bgGradient: "from-amber-400/15 to-yellow-300/15",
                      ringColor: "ring-amber-100 dark:ring-amber-950",
                      badgeBg: "bg-amber-500",
                      badgeIcon: Send,
                      textColor: "text-amber-600 dark:text-amber-400",
                      isPulse: true
                    }
                  ].map((notif, i) => (
                    <div
                      key={i}
                      className={`relative flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] ${notif.isPulse ? 'ring-1 ring-primary/20 bg-primary/[0.01]' : ''}`}
                    >
                      {/* Timeline dot connector */}
                      <div className="absolute -left-[21px] sm:-left-[27px] top-6 sm:top-7 w-3.5 h-3.5 rounded-full border-2 border-card bg-border" />

                      {/* Avatar / Icon Container */}
                      <div className="relative shrink-0">
                        {notif.avatar ? (
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-2 sm:ring-4 ${notif.ringColor} shadow-inner`}>
                            <img
                              src={notif.avatar}
                              alt={notif.user}
                              width={48}
                              height={48}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback if image fails to load
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const fallback = parent.nextElementSibling;
                                  if (fallback) fallback.classList.remove('hidden');
                                }
                              }}
                            />
                            {/* Fallback Initials */}
                            <div className="hidden absolute inset-0 flex items-center justify-center bg-muted text-foreground font-bold text-sm">
                              {notif.initials}
                            </div>
                          </div>
                        ) : (
                          // System Icon
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${notif.bgGradient} ring-2 sm:ring-4 ${notif.ringColor} shadow-inner`}>
                            <Cpu className={`w-5 h-5 sm:w-6 sm:h-6 ${notif.textColor}`} />
                          </div>
                        )}

                        {/* Status action badge */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${notif.badgeBg} text-white border-2 border-background shadow-sm`}>
                          <notif.badgeIcon className="w-2.5 h-2.5" />
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-0.5 min-[400px]:gap-2">
                          <p className="text-sm font-bold text-foreground">
                            {notif.user}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {notif.isPulse && (
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            )}
                            <p className="text-xs text-muted-foreground font-medium">{notif.time}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                          {notif.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Decorative Background Card Shadow Offset */}
                <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full bg-secondary/30 rounded-2xl border border-border/20"></div>
              </div>
            </div>
          </div>

          {/* Feature 3: Security */}
          <div className="py-12 border-t border-slate-100">
            <div className="max-w-3xl mx-auto text-center mb-10 md:mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium mb-4">
                Secure & Reliable
              </div>
              <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-slate-900 dark:text-white">Secure, private, and legally binding.</h3>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                We take security seriously. Your documents are protected by industry-standard encryption, strict compliance frameworks, and secure cloud infrastructure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto">
              {[
                {
                  title: "Cryptographic Tamper-Evident Seals",
                  desc: "Every document signed on Endorse is hashed using the industry-standard SHA-256 algorithm. Any attempt to modify the document will immediately invalidate the signatures.",
                  badge: "SHA-256 Checksum"
                },
                {
                  title: "Legal Compliance Standards",
                  desc: "Fully compliant with the US ESIGN Act, Uniform Electronic Transactions Act (UETA), European Union eIDAS regulations, and the Nigeria Data Protection Act (NDPA) enforced by the NDPC. Signatures are legally binding and admissible in court.",
                  badge: "ESIGN, eIDAS & NDPA Compliant"
                },
                {
                  title: "Comprehensive Audit Trails",
                  desc: "Track every step of the signing process. We generate a secure, timestamped audit certificate recording IP addresses, email verifications, and event histories.",
                  badge: "Admissible Evidence"
                },
                {
                  title: "Bank-Grade Data Encryption",
                  desc: "Your files are encrypted in transit using 256-bit SSL/TLS protocols and at rest using AES-256 encryption, hosted on highly secure, certified cloud infrastructure.",
                  badge: "AES-256 Standards"
                }
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 sm:p-8 rounded-2xl flex flex-col justify-between text-left hover:shadow-md transition-all duration-300">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500 bg-slate-200/60 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded">
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {item.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
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
            <p className="text-sm font-semibold uppercase tracking-wider text-[#0A66C2]">Pricing</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-gray-900 sm:text-5xl">
              Choose the right plan for you
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
                  className={`mt-8 block min-h-[44px] w-full rounded-full px-4 text-center text-sm font-bold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tier.buttonColor}`}
                >
                  Get started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Companies Using The Product Ticker Section */}
      <section className="py-14 border-y border-border/40 bg-slate-50/70 dark:bg-slate-900/40 overflow-hidden relative">
        <div className="container mx-auto px-4 sm:px-6 mb-8 text-center">
          <p className="text-sm md:text-base font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">
            Trusted by teams at forward-thinking companies
          </p>
        </div>

        {/* Gradient edge fade masks */}
        <div className="absolute top-0 bottom-0 left-0 w-24 md:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-24 md:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Scrolling Ticker */}
        <div className="overflow-hidden flex w-full">
          <div className="animate-marquee flex items-center gap-14 md:gap-20 py-3">
            {[
              { name: "Pioneer Artificial Intelligence Academy", icon: "🎓 Pioneer Artificial Intelligence Academy" },
              { name: "Dera Everight Ltd", icon: "❖ Dera Everight Ltd" },
              { name: "Macddy Tech Solution", icon: "⚡ Macddy Tech Solution" },
              { name: "Ike Ake & Associates", icon: "⚖ Ike Ake & Associates" },
              { name: "BlaqLink", icon: "◈ BlaqLink" },
              { name: "ViteHire", icon: "▲ ViteHire" },
              { name: "CC Tech Solutions", icon: "⚙ CC Tech Solutions" },

              /* Repeated set for infinite scroll loop */
              { name: "Pioneer Artificial Intelligence Academy", icon: "🎓 Pioneer Artificial Intelligence Academy" },
              { name: "Dera Everight Ltd", icon: "❖ Dera Everight Ltd" },
              { name: "Macddy Tech Solution", icon: "⚡ Macddy Tech Solution" },
              { name: "Ike Ake & Associates", icon: "⚖ Ike Ake & Associates" },
              { name: "BlaqLink", icon: "◈ BlaqLink" },
              { name: "ViteHire", icon: "▲ ViteHire" },
              { name: "CC Tech Solutions", icon: "⚙ CC Tech Solutions" }
            ].map((company, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-slate-800 dark:text-slate-100 hover:text-[#0A66C2] transition-all duration-300 font-display font-black text-2xl md:text-3xl tracking-tight select-none cursor-pointer whitespace-nowrap px-6 opacity-95 hover:opacity-100 hover:scale-105 transform"
              >
                <span>{company.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Interactive FAQ Section */}
      <section className="py-16 md:py-28 px-4 md:px-6 bg-slate-50/50 dark:bg-slate-900/20 border-t border-border/40">
        <div className="container mx-auto max-w-4xl px-0 sm:px-4">
          {/* Header */}
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] dark:text-[#FFC83D] text-xs font-bold uppercase tracking-wider mb-4 border border-[#0A66C2]/20 dark:border-white/10">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Got Questions?</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about legally binding signatures, data security, and subscription plans.
            </p>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 mb-6 md:mb-10">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap shrink-0 transition-all duration-200 ${faqCategory === cat
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
                  q: "Is Endorse legally binding and compliant?",
                  a: "Yes. Signatures created with Endorse are 100% legally binding and enforceable in court worldwide. Endorse complies fully with the US ESIGN Act of 2000, UETA, and European eIDAS (910/2014) regulations."
                },
                {
                  id: "faq-2",
                  category: "Legal & Security",
                  q: "How is my document data secured?",
                  a: "We utilize bank-grade SSL/TLS 256-bit encryption for all document transfers and storage. Every signed document is sealed with an SHA-256 cryptographic hash and tamper-evident digital audit trail."
                },
                {
                  id: "faq-3",
                  category: "Signing & Docs",
                  q: "Can I sign documents on my smartphone or tablet?",
                  a: "Yes! Endorse is fully mobile-responsive and works seamlessly on any browser, iOS, or Android device. You can draw your signature with your finger or stylus, or type to generate one."
                },
                {
                  id: "faq-4",
                  category: "Signing & Docs",
                  q: "Do my recipients need an account to sign?",
                  a: "No. Signers can open, review, and execute agreements sent to them without creating an Endorse account or downloading any application."
                },
                {
                  id: "faq-5",
                  category: "Pricing & Billing",
                  q: "What happens after the free trial or free tier?",
                  a: "Your free account lets you start signing documents immediately. You can upgrade anytime to Pro or Business for unlimited documents, team collaboration, and custom company branding."
                },
                {
                  id: "faq-6",
                  category: "Pricing & Billing",
                  q: "Can I cancel or change my subscription anytime?",
                  a: "Yes, you can upgrade, downgrade, or cancel your subscription at any time directly from your account dashboard with zero cancellation fees."
                },
                {
                  id: "faq-7",
                  category: "Signing & Docs",
                  q: "What document file formats are supported?",
                  a: "Endorse supports PDF files (.pdf) and Microsoft Word documents (.docx). All completed agreements are compiled into standardized, tamper-proof PDF/A files."
                },
                {
                  id: "faq-8",
                  category: "Legal & Security",
                  q: "What is included in the digital audit trail?",
                  a: "Every completed agreement includes a legal Certificate of Completion capturing timestamps, signer IP addresses, email verification IDs, and SHA-256 document checksums."
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
                    <AccordionTrigger className="min-h-[52px] text-left font-display font-semibold text-base md:text-lg text-slate-900 dark:text-white hover:no-underline py-3 gap-3">
                      <span className="flex items-center gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A66C2] dark:bg-[#FFC83D] shrink-0 opacity-75" />
                        {faq.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed pl-4 sm:pl-5 pb-3">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>

          {/* Still Have Questions Support Box */}
          <div className="mt-8 md:mt-12 p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#0A66C2]/10 dark:bg-[#FFC83D]/20 text-[#0A66C2] dark:text-[#FFC83D] flex items-center justify-center shrink-0 mx-auto md:mx-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Still have questions?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Can't find the answer you're looking for? Please reach out to our team.</p>
              </div>
            </div>
            <button
              onClick={() => setShowChat(true)}
              className="min-h-[44px] w-full sm:w-auto justify-center bg-[#0A66C2] hover:bg-[#08519c] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Support</span>
            </button>
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
                Ready to streamline your signing?
              </h2>
              <p className="text-white/85 text-lg md:text-xl mb-8 max-w-xl mx-auto">
                Join thousands of professionals who save hours every week with Endorse.
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

      <SiteFooter />

      {/* Cookie Consent Banner */}
      {showCookieConsent && (
        <div role="region" aria-label="Cookie consent" className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-3 py-3 sm:px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-500">
          <div className="container mx-auto max-w-6xl px-0 sm:px-4 flex items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-primary/10 rounded-full hidden sm:block shrink-0">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm leading-snug text-muted-foreground">
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
          <div
            className="absolute inset-0"
            onClick={() => setShowVideoModal(false)}
            role="presentation"
            aria-hidden="true"
          />
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
      <div className={`fixed right-4 md:right-6 z-50 flex flex-col items-end gap-4 transition-[bottom] duration-300 ${showCookieConsent ? "bottom-[84px] md:bottom-[88px]" : "bottom-4 md:bottom-6"}`}>
        {showChat && (
          <div className="bg-card border border-border rounded-xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-[#FFC83D] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="font-bold text-black">Endorse Support</span>
              </div>
              <button onClick={() => setShowChat(false)} className="-m-2 w-10 h-10 flex items-center justify-center rounded-full text-black/80 hover:text-black hover:bg-black/5 transition-colors" aria-label="Close chat">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-80 bg-background p-4 overflow-y-auto flex flex-col gap-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-3 rounded-lg max-w-[85%] border border-border ${msg.isUser ? 'bg-primary/10 self-end rounded-tr-none' : 'bg-secondary self-start rounded-tl-none'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">{msg.time}</span>
                </div>
              ))}
              {chatMessages.length < 4 && (
                <div className="flex flex-wrap gap-2 mt-2 px-1">
                  {["Are there any plans?", "Is it legal?", "Contact Support", "Features"].map((reply) => (
                    <button
                      key={reply}
                      onClick={() => sendMessage(reply)}
                      className="min-h-[40px] text-sm bg-secondary hover:bg-secondary/80 border border-border rounded-full px-3.5 py-2 transition-colors text-foreground/80"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
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
                <Button size="icon" type="submit" className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90" aria-label="Send message">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-[#FFC83D] text-black hover:bg-[#e6b435] transition-transform hover:scale-105 flex items-center justify-center"
          onClick={() => setShowChat(!showChat)}
          aria-label={showChat ? "Close chat" : "Open chat"}
        >
          {showChat ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
};

export default Landing;
