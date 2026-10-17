import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Menu as MenuIcon,
  X,
  PenTool,
  Receipt,
  FileCode,
  Layers,
  Zap,
  Users,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Code2,
  Building2,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  desc: string;
  to: string;
  icon: LucideIcon;
  badge?: string;
  /** Requires login — logged-out visitors are sent to sign in first. */
  app?: boolean;
}

const PRODUCT: NavItem[] = [
  { label: "eSign & Documents", desc: "Send and collect legally binding e-signatures", to: "/dashboard", icon: PenTool, app: true },
  { label: "Send for Signature", desc: "Invite signers by email or WhatsApp and track status", to: "/team", icon: Users, app: true },
  { label: "Invoices", desc: "Create, send, and track professional invoices", to: "/invoices", icon: Receipt, badge: "New", app: true },
  { label: "File Conversion", desc: "Convert between PDF, Word, and more in seconds", to: "/conversion", icon: FileCode },
  { label: "Templates", desc: "Reusable agreements that fill in each signer's details", to: "/team", icon: Layers, app: true },
];

const SOLUTIONS: NavItem[] = [
  { label: "Sales & Operations", desc: "Close deals faster with signing links and reminders", to: "/solutions/sales-operations", icon: Zap },
  { label: "HR & Recruiting", desc: "Paperless offer letters and onboarding packets", to: "/solutions/hr-recruiting", icon: Users },
  { label: "Legal & Compliance", desc: "Tamper-evident documents with full audit trails", to: "/solutions/legal-compliance", icon: ShieldCheck },
];

const RESOURCES: NavItem[] = [
  { label: "Blog", desc: "Product news, guides, and industry insights", to: "/blog", icon: BookOpen },
  { label: "Help Center", desc: "Tutorials, walkthroughs, and support", to: "/help-center", icon: HelpCircle },
  { label: "API Docs", desc: "Automate signing from your own software", to: "/api-docs", icon: Code2 },
  { label: "About Endorse", desc: "Who we are and why we built Endorse", to: "/about", icon: Building2 },
];

const SECTIONS = [
  { id: "product", label: "Product", items: PRODUCT },
  { id: "solutions", label: "Solutions", items: SOLUTIONS },
  { id: "resources", label: "Resources", items: RESOURCES },
] as const;

const triggerClass =
  "font-sans text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-[#0A66C2] dark:hover:text-[#FFC83D] transition-colors flex items-center gap-1.5 outline-none py-2 group";

export function SiteHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const href = (item: NavItem) => (item.app && !user ? `/auth?redirect=${encodeURIComponent(item.to)}` : item.to);

  // Close the mobile menu whenever the route changes, and stop the page scrolling behind it.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const dropdown = (label: string, items: NavItem[], width: string) => (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={triggerClass}>
        <span>{label}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={10}
        className={`${width} rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className={items.length > 3 ? "grid grid-cols-2 gap-1" : "space-y-1"}>
          {items.map((item) => (
            <DropdownMenuItem key={item.label} asChild className="cursor-pointer rounded-xl p-3 focus:bg-slate-50 dark:focus:bg-slate-800">
              <Link to={href(item)} className="flex w-full items-start gap-3">
                <span className="shrink-0 rounded-xl bg-[#0A66C2]/10 p-2.5 text-[#0A66C2]">
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
                    {item.label}
                    {item.badge && (
                      <span className="rounded-full bg-[#FFC83D] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-900">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.desc}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
        {label === "Product" && (
          <div className="mt-1 flex items-center justify-end border-t border-slate-100 px-3 pt-3 pb-1 dark:border-slate-800">
            <Link to="/#features" className="flex items-center gap-1 text-xs font-bold text-[#0A66C2] hover:underline">
              View all features <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20 md:px-6" aria-label="Main">
        <Link to="/" className="flex items-center" aria-label="Endorse home">
          <Logo className="h-9 md:h-10" />
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 lg:flex">
          {dropdown("Product", PRODUCT, "w-[600px]")}
          {dropdown("Solutions", SOLUTIONS, "w-[400px]")}
          <Link to="/#pricing" className={triggerClass}>
            Pricing
          </Link>
          {dropdown("Resources", RESOURCES, "w-[560px]")}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {/* Always offer sign in / sign up on public pages, even if a session already exists. */}
          <Link to="/auth?mode=login" className="px-3 py-2 font-sans text-sm font-extrabold text-[#0A66C2] hover:underline dark:text-[#FFC83D]">
            Sign In
          </Link>
          <Button asChild className="rounded-full bg-[#FFC83D] px-6 font-extrabold text-black shadow-sm hover:bg-[#e6b435]">
            <Link to="/auth?mode=signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#0A66C2] lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen &&
        createPortal(
        <div className="fixed inset-x-0 bottom-0 top-16 z-[60] flex flex-col overflow-y-auto border-t border-slate-200 bg-white md:top-20 lg:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="flex-1 px-4 py-2">
            {SECTIONS.map((section) => {
              const open = openSection === section.id;
              return (
                <div key={section.id} className="border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setOpenSection(open ? null : section.id)}
                    className="flex w-full items-center justify-between py-4 text-left text-base font-bold text-slate-900 dark:text-white"
                    aria-expanded={open}
                  >
                    {section.label}
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="space-y-1 pb-3">
                      {section.items.map((item) => (
                        <Link
                          key={item.label}
                          to={href(item)}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-900"
                        >
                          <span className="shrink-0 rounded-lg bg-[#0A66C2]/10 p-2 text-[#0A66C2]">
                            <item.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900 dark:text-white">{item.label}</span>
                            <span className="block truncate text-xs text-slate-500">{item.desc}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <Link
              to="/#pricing"
              onClick={() => setIsMenuOpen(false)}
              className="block border-b border-slate-100 py-4 text-base font-bold text-slate-900 dark:border-slate-800 dark:text-white"
            >
              Pricing
            </Link>
          </div>

          <div className="sticky bottom-0 space-y-2 border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <Button asChild className="h-12 w-full rounded-full bg-[#FFC83D] text-base font-extrabold text-black hover:bg-[#e6b435]">
              <Link to="/auth?mode=signup">Get Started — it's free</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full rounded-full text-base font-bold text-[#0A66C2]">
              <Link to="/auth?mode=login">Sign In</Link>
            </Button>
          </div>
        </div>
          ,
          document.body
        )}
    </header>
  );
}
