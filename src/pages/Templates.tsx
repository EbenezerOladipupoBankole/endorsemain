import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { 
  ChevronDown, 
  PenTool, 
  FileType, 
  FileText, 
  HelpCircle, 
  Code, 
  Menu, 
  X, 
  Search, 
  Layout, 
  ArrowRight, 
  Users, 
  Shield, 
  Briefcase, 
  Terminal, 
  ClipboardList,
  CheckCircle2,
  Globe,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Download,
  Eye,
  Edit3,
  Sparkles,
  Zap,
  Star,
  ArrowDownToLine,
  Clock,
  Scale,
  BookOpen,
  FileBadge
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
// @ts-ignore
import html2pdf from "html2pdf.js";

const templateCategories = [
  { id: 'all', name: 'All Templates', icon: Layout },
  { id: 'freelance', name: 'Freelance & Agency', icon: Users },
  { id: 'dev', name: 'Software & IT', icon: Terminal },
  { id: 'business', name: 'Startup & Biz', icon: Briefcase },
  { id: 'legal', name: 'Legal & HR', icon: Shield },
  { id: 'realestate', name: 'Real Estate', icon: Globe },
];

const templates = [
  {
    id: 1,
    title: "Mutual Non-Disclosure Agreement (NDA)",
    category: "legal",
    description: "Standard mutual NDA protecting confidential business information, trade secrets, and proprietary data for both parties during negotiations.",
    icon: Shield,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    downloads: "142K+",
    rating: 4.9,
    pages: 4,
    tags: ["Confidentiality", "M&A", "Partnership"],
    popular: true,
    content: `<div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #111; text-align: justify; letter-spacing: 0.01em;">
<h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">MUTUAL NON-DISCLOSURE AGREEMENT</h1>
<p>This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of <strong>[Date]</strong>, by and between <strong>[Company A Name]</strong>, located at <strong>[Company A Address]</strong> ("Disclosing Party"), and <strong>[Company B Name]</strong>, located at <strong>[Company B Address]</strong> ("Receiving Party").</p>
<h3>1. Definition of Confidential Information</h3>
<p>For purposes of this Agreement, "Confidential Information" shall include all information or material that has or could have commercial value or other utility in the business in which Disclosing Party is engaged. If Confidential Information is in written form, the Disclosing Party shall label or stamp the materials with the word "Confidential" or some similar warning.</p>
<h3>2. Exclusions from Confidential Information</h3>
<p>Receiving Party's obligations under this Agreement do not extend to information that is: (a) publicly known at the time of disclosure or subsequently becomes publicly known through no fault of the Receiving Party; (b) discovered or created by the Receiving Party before disclosure by Disclosing Party; (c) learned by the Receiving Party through legitimate means other than from the Disclosing Party or Disclosing Party's representatives; or (d) is disclosed by Receiving Party with Disclosing Party's prior written approval.</p>
<h3>3. Obligations of Receiving Party</h3>
<p>Receiving Party shall hold and maintain the Confidential Information in strictest confidence for the sole and exclusive benefit of the Disclosing Party. Receiving Party shall carefully restrict access to Confidential Information to employees, contractors and third parties as is reasonably required.</p>
<h3>4. Time Periods</h3>
<p>The nondisclosure provisions of this Agreement shall survive the termination of this Agreement and Receiving Party's duty to hold Confidential Information in confidence shall remain in effect until the Confidential Information no longer qualifies as a trade secret or until Disclosing Party sends Receiving Party written notice releasing Receiving Party from this Agreement, whichever occurs first.</p>
<p style="margin-top: 40px;"><strong>Signature [Company A]:</strong> _______________________ <br/><strong>Name:</strong> _______________________ <br/><strong>Date:</strong> _______________________</p>
<p style="margin-top: 20px;"><strong>Signature [Company B]:</strong> _______________________ <br/><strong>Name:</strong> _______________________ <br/><strong>Date:</strong> _______________________</p>
</div>`
  },
  {
    id: 2,
    title: "Master Service Agreement (MSA)",
    category: "freelance",
    description: "A comprehensive Master Service Agreement that establishes the baseline terms, conditions, and payment structures between an agency/freelancer and their client for ongoing project work.",
    icon: Briefcase,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    downloads: "89K+",
    rating: 4.8,
    pages: 7,
    tags: ["Agency", "B2B", "Consulting"],
    popular: true,
    content: `<div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #111; text-align: justify; letter-spacing: 0.01em;">
<h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">MASTER SERVICE AGREEMENT</h1>
<p>This Master Service Agreement ("Agreement") is effective as of <strong>[Effective Date]</strong> by and between <strong>[Provider Name]</strong> ("Provider") and <strong>[Client Name]</strong> ("Client").</p>
<h3>1. Services</h3>
<p>Provider agrees to provide the services described in the statements of work ("SOW") executed by both parties from time to time under this Agreement. Each SOW will detail the scope, deliverables, and fees for the specific project.</p>
<h3>2. Compensation and Payment</h3>
<p>Client shall pay Provider the fees set forth in the applicable SOW. Invoices are due within <strong>[Number]</strong> days of receipt. Late payments will incur an interest charge of 1.5% per month.</p>
<h3>3. Intellectual Property Rights</h3>
<p>Upon full payment of all fees due under the applicable SOW, Provider hereby assigns to Client all rights, title, and interest in and to the deliverables created for Client.</p>
<h3>4. Term and Termination</h3>
<p>This Agreement shall commence on the Effective Date and continue until terminated by either party upon 30 days written notice. Termination of this Agreement will not affect any active SOW, which must be completed or terminated according to its own terms.</p>
<p style="margin-top: 40px;"><strong>[Provider Name]</strong><br/>Signature: _______________________<br/>Date: _______________________</p>
<p style="margin-top: 20px;"><strong>[Client Name]</strong><br/>Signature: _______________________<br/>Date: _______________________</p>
</div>`
  },
  {
    id: 3,
    title: "Software Development Contract",
    category: "dev",
    description: "Detailed agreement defining scope, milestones, IP ownership, and warranty terms for custom software, web, or mobile app development projects.",
    icon: Code,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    downloads: "56K+",
    rating: 4.7,
    pages: 6,
    tags: ["Software", "Contractor", "IP Rights"],
    popular: false,
    content: `<div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #111; text-align: justify; letter-spacing: 0.01em;">
<h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">SOFTWARE DEVELOPMENT AGREEMENT</h1>
<p>This Agreement is entered into on <strong>[Date]</strong>, between <strong>[Developer Name]</strong> ("Developer") and <strong>[Client Name]</strong> ("Client").</p>
<h3>1. Scope of Work</h3>
<p>Developer agrees to design, develop, and deliver the software application described in Exhibit A ("Software"). Developer will provide regular updates and a testing environment for Client review.</p>
<h3>2. Acceptance Testing</h3>
<p>Upon delivery of the Software, Client will have 14 days to test its functionality. If defects are found, Developer shall cure such defects within 10 days at no extra cost.</p>
<h3>3. Warranties</h3>
<p>Developer warrants that the Software will perform substantially in accordance with the specifications for a period of 90 days after final acceptance. Developer indemnifies Client against any third-party claims of intellectual property infringement.</p>
<h3>4. Source Code and Ownership</h3>
<p>Upon final payment, Client shall receive the full source code, and Developer assigns all copyrights and proprietary rights of the Software to the Client. Developer retains no rights to reuse the code.</p>
</div>`
  },
  {
    id: 4,
    title: "Executive Employment Agreement",
    category: "legal",
    description: "High-level employment offer and contract detailing executive compensation, equity grants, severance packages, and non-compete clauses.",
    icon: Users,
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    downloads: "34K+",
    rating: 4.9,
    pages: 8,
    tags: ["HR / Hiring", "Executive", "Equity"],
    popular: false,
    content: `<div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #111; text-align: justify; letter-spacing: 0.01em;">
<h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">EXECUTIVE EMPLOYMENT AGREEMENT</h1>
<p>This Agreement is entered into between <strong>[Company Name]</strong> ("Company") and <strong>[Executive Name]</strong> ("Executive"), effective <strong>[Date]</strong>.</p>
<h3>1. Position and Duties</h3>
<p>Company employs Executive as <strong>[Job Title]</strong>. Executive shall perform duties customarily associated with this role and report directly to the Board of Directors.</p>
<h3>2. Compensation and Equity</h3>
<p><strong>Base Salary:</strong> $[Amount] per annum, payable in accordance with Company's standard payroll practices.</p>
<p><strong>Bonus:</strong> Executive is eligible for an annual performance bonus of up to [Percentage]% of base salary.</p>
<p><strong>Equity:</strong> Executive will be granted [Number] stock options subject to a 4-year vesting schedule with a 1-year cliff.</p>
<h3>3. Termination and Severance</h3>
<p>If Executive's employment is terminated by Company without Cause, Executive will be entitled to Severance equal to [Number] months of base salary and accelerated vesting of options scheduled to vest in the subsequent 6 months.</p>
</div>`
  },
  {
    id: 5,
    title: "Commercial Lease Agreement",
    category: "realestate",
    description: "A legally robust commercial lease agreement covering rent, common area maintenance (CAM), insurance, and property alterations for office or retail space.",
    icon: BookOpen,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    downloads: "72K+",
    rating: 4.6,
    pages: 12,
    tags: ["Real Estate", "Commercial", "Landlord"],
    popular: true,
    content: `<div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #111; text-align: justify; letter-spacing: 0.01em;">
<h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">COMMERCIAL LEASE AGREEMENT</h1>
<p>This Lease Agreement is made between <strong>[Landlord Name]</strong> ("Landlord") and <strong>[Tenant Name]</strong> ("Tenant") collectively referred to as the "Parties".</p>
<h3>1. Premises</h3>
<p>Landlord leases to Tenant the commercial space located at <strong>[Property Address]</strong> comprising approximately [Square Footage] rentable square feet.</p>
<h3>2. Term</h3>
<p>The term of this lease shall be [Number] years, commencing on [Start Date] and ending on [End Date]. Tenant has one option to renew for an additional 3-year term.</p>
<h3>3. Base Rent and NNN Expenses</h3>
<p>Tenant shall pay a Base Rent of $[Amount] per month. Tenant is also responsible for a pro-rata share of Property Taxes, Insurance, and Common Area Maintenance (CAM).</p>
<h3>4. Use of Premises</h3>
<p>Tenant shall use the Premises solely for the purpose of operating a [Business Type] and for no other purpose without Landlord's prior written consent.</p>
</div>`
  },
  {
    id: 6,
    title: "Website Terms of Service (SaaS)",
    category: "dev",
    description: "Standard compliant Terms of Service and End User License Agreement (EULA) tailored for B2B and B2C Software-as-a-Service platforms.",
    icon: Globe,
    color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    downloads: "215K+",
    rating: 4.9,
    pages: 5,
    tags: ["SaaS", "Compliance", "EULA"],
    popular: true,
    content: `<div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #111; text-align: justify; letter-spacing: 0.01em;">
<h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">TERMS OF SERVICE</h1>
<p><strong>Last Updated: [Date]</strong></p>
<p>Welcome to <strong>[SaaS Company Name]</strong>. These Terms of Service ("Terms") dictate your use of our software and website.</p>
<h3>1. Account Registration</h3>
<p>You must provide accurate information when registering an account. You represent that you are at least 18 years old and authorized to bind the entity you represent.</p>
<h3>2. License and Restrictions</h3>
<p>We grant you a non-exclusive, non-transferable license to use our platform. You may not reverse engineer, copy, or resell the platform or its features.</p>
<h3>3. User Data and Privacy</h3>
<p>We respect your privacy. All user-generated content and data uploaded to the platform is governed by our Privacy Policy. You retain all rights to your data.</p>
<h3>4. Limitation of Liability</h3>
<p>IN NO EVENT SHALL [Company Name] BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.</p>
</div>`
  },
  {
    id: 7,
    title: "Independent Contractor Agreement",
    category: "business",
    description: "Clear contract delineating the relationship between a business and an independent contractor (1099), ensuring non-employee status and defining scope.",
    icon: FileBadge,
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    downloads: "105K+",
    rating: 4.8,
    pages: 5,
    tags: ["1099", "Tax Compliance", "Hiring"],
    popular: false,
    content: `<div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #111; text-align: justify; letter-spacing: 0.01em;">
<h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">INDEPENDENT CONTRACTOR AGREEMENT</h1>
<p>This Agreement defines the relationship between <strong>[Company Name]</strong> and <strong>[Contractor Name]</strong>.</p>
<h3>1. Independent Contractor Status</h3>
<p>The Contractor is an independent contractor and not an employee, partner, or joint venturer of the Company. The Contractor is solely responsible for all taxes, withholdings, and insurance.</p>
<h3>2. Scope of Services</h3>
<p>The Contractor will perform the services outlined in Exhibit A. The Contractor determines their own schedule and method of performing the tasks.</p>
<h3>3. Payment</h3>
<p>The Company shall pay the Contractor $[Rate] per hour. Invoices are to be submitted monthly and paid within 15 days.</p>
<h3>4. Return of Property</h3>
<p>Upon termination of this Agreement, Contractor shall return all company-owned equipment, documents, and data within 3 days.</p>
</div>`
  },
  {
    id: 8,
    title: "Founders' Agreement",
    category: "business",
    description: "Crucial agreement for startup co-founders detailing equity splits, vesting schedules, roles, and IP assignment to the newly formed entity.",
    icon: Scale,
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    downloads: "42K+",
    rating: 4.9,
    pages: 6,
    tags: ["Startups", "Equity", "Founders"],
    popular: true,
    content: `<div style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.8; color: #111; text-align: justify; letter-spacing: 0.01em;">
<h1 style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px;">CO-FOUNDER AGREEMENT</h1>
<p>This Founders' Agreement is established by the undersigned Co-Founders for the purpose of organizing a new business venture known as <strong>[Startup Name]</strong>.</p>
<h3>1. Ownership and Equity</h3>
<p>The equity of the Company shall be distributed as follows: [Founder A]: [X]% | [Founder B]: [Y]%.</p>
<h3>2. Vesting</h3>
<p>All equity is subject to a 4-year vesting schedule with a 1-year cliff. If a founder leaves the company before the cliff, all their shares are forfeited.</p>
<h3>3. Roles and Responsibilities</h3>
<p>[Founder A] will serve as CEO leading strategy and fundraising. [Founder B] will serve as CTO leading product development and engineering.</p>
<h3>4. IP Assignment</h3>
<p>Each Founder assigns to the Company all intellectual property related to the Company's business conceived or developed prior to or during their tenor with the Company.</p>
</div>`
  }
];

const Templates = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileProductOpen, setMobileProductOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState("en");
  
  // Preview/Edit state
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [editableContent, setEditableContent] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setEditableContent(template.content);
    setIsPreviewOpen(true);
  };

  const downloadPDF = () => {
    if (!previewRef.current) return;
    
    const opt = {
      margin: 1,
      filename: `${selectedTemplate.title.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().from(previewRef.current).set(opt).save().then(() => {
      toast.success("Document downloaded successfully!");
    });
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Visual background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Endorse">
            <Logo className="h-14 w-auto drop-shadow-sm group-hover:scale-105 transition-transform" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors flex items-center gap-1 outline-none group text-base">
                Product <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[340px] p-3 glass-strong border-border/50">
                <DropdownMenuItem asChild className="mb-1 cursor-pointer rounded-lg focus:bg-accent p-0">
                  <Link to="/#features" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <PenTool className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1 text-base">
                      <span className="font-semibold text-sm text-foreground">eSign</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Create, send, and track legally binding electronic signatures.
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg focus:bg-accent p-0">
                  <Link to="/conversion" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <FileType className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1 text-base">
                      <span className="font-semibold text-sm text-foreground">File Conversion</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Transform documents between PDF, Word, and other formats.
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/#pricing" className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors text-base">Pricing</Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors flex items-center gap-1 outline-none group text-base">
                Resources <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[340px] p-3 glass-strong border-border/50">
                <DropdownMenuItem asChild className="mb-1 cursor-pointer rounded-lg focus:bg-accent p-0">
                  <Link to="/templates" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1 text-base">
                      <span className="font-semibold text-sm text-foreground">Templates</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Free agreement templates for pros.
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="mb-1 cursor-pointer rounded-lg focus:bg-accent p-0">
                  <Link to="/blog" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1 text-base">
                      <span className="font-semibold text-sm text-foreground">Blog</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Latest updates, articles, and insights.
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/about" className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors text-base">Company</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 px-6 py-6 font-bold text-base shadow-lg shadow-primary/10">Get Started</Button>
            </Link>
            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-foreground p-2 h-12 w-12 flex items-center justify-center rounded-full hover:bg-accent transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border p-6 flex flex-col gap-6 shadow-2xl animate-in fade-in slide-in-from-top-4 h-[calc(100vh-5rem)] overflow-y-auto z-50">
            <div className="flex flex-col gap-2">
              <button
                className="flex items-center justify-between font-sans text-lg font-bold tracking-tight text-foreground p-3 hover:bg-accent rounded-xl transition-colors w-full text-left"
                onClick={() => setMobileProductOpen(!mobileProductOpen)}
              >
                Product
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileProductOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileProductOpen && (
                <div className="pl-6 flex flex-col gap-2 mt-1 border-l-2 border-primary/20 ml-3">
                  <Link to="/#features" className="flex items-center gap-3 text-base text-muted-foreground p-3 hover:text-foreground hover:bg-accent rounded-lg" onClick={() => setIsMenuOpen(false)}><PenTool className="w-5 h-5" /> eSign</Link>
                  <Link to="/conversion" className="flex items-center gap-3 text-base text-muted-foreground p-3 hover:text-foreground hover:bg-accent rounded-lg" onClick={() => setIsMenuOpen(false)}><FileType className="w-5 h-5" /> File Conversion</Link>
                </div>
              )}
            </div>
            <Link to="/#pricing" className="font-sans text-lg font-bold tracking-tight text-foreground p-3 hover:bg-accent rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <div className="flex flex-col gap-2">
              <button
                className="flex items-center justify-between font-sans text-lg font-bold tracking-tight text-foreground p-3 hover:bg-accent rounded-xl transition-colors w-full text-left"
                onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
              >
                Resources
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileResourcesOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileResourcesOpen && (
                <div className="pl-6 flex flex-col gap-2 mt-1 border-l-2 border-primary/20 ml-3">
                  <Link to="/templates" className="flex items-center gap-3 text-base text-muted-foreground p-3 hover:text-foreground hover:bg-accent rounded-lg" onClick={() => setIsMenuOpen(false)}><FileText className="w-5 h-5" /> Templates</Link>
                  <Link to="/blog" className="flex items-center gap-3 text-base text-muted-foreground p-3 hover:text-foreground hover:bg-accent rounded-lg" onClick={() => setIsMenuOpen(false)}><FileText className="w-5 h-5" /> Blog</Link>
                </div>
              )}
            </div>
            <Link to="/about" className="font-sans text-lg font-bold tracking-tight text-foreground p-3 hover:bg-accent rounded-xl transition-colors" onClick={() => setIsMenuOpen(false)}>Company</Link>
            <div className="mt-auto pb-10">
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 py-7 text-lg font-bold">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 pt-32 pb-20 relative z-10 font-sans">
        {/* Floating Graphics */}
        <div className="absolute top-[15%] left-[5%] opacity-20 hidden lg:block animate-bounce [animation-duration:6s]">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center rotate-12">
            <ClipboardList className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="absolute top-[25%] right-[5%] opacity-20 hidden lg:block animate-bounce [animation-duration:8s] [animation-delay:1s]">
          <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center -rotate-12">
            <Shield className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        {/* Hero Section */}
        <section className="px-4 md:px-6 mb-16 text-center">
          <div className="container mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-8 border border-primary/20 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <Sparkles className="w-4 h-4" />
              Template Library v2.0
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-8 tracking-tighter text-foreground leading-[1.1] animate-in fade-in slide-in-from-bottom-4 [animation-delay:200ms]">
              The fast track to <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-gradient">perfect agreements.</span>
                <div className="absolute bottom-2 left-0 w-full h-4 bg-primary/20 -rotate-1 -z-10 rounded-full blur-sm" />
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-6 [animation-delay:400ms]">
              Don't waste days on drafting. Pick a professional template, customize it in seconds, and download your ready-to-sign document.
            </p>

            <div className="max-w-2xl mx-auto relative group animate-in fade-in slide-in-from-bottom-8 [animation-delay:600ms]">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-3xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="What document do you need today?" 
                  className="pl-16 h-16 md:h-20 text-lg md:text-xl bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl md:rounded-3xl shadow-2xl focus:ring-primary/20 transition-all border-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg border border-border text-xs font-mono text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  Press / to search
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories & Filter */}
        <section className="px-4 md:px-6 mb-20">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-center gap-3 mb-16 overflow-x-auto pb-4 scrollbar-hide">
              {templateCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-7 py-3.5 rounded-2xl text-base font-bold transition-all duration-300 whitespace-nowrap ${
                    activeCategory === cat.id 
                    ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 translate-y-[-4px]' 
                    : 'bg-card/50 backdrop-blur-sm text-muted-foreground hover:bg-accent border border-border/40'
                  }`}
                >
                  <cat.icon className="w-5 h-5" />
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template, idx) => (
                  <div 
                    key={template.id} 
                    className="group relative bg-card/50 backdrop-blur-xl border border-border/60 rounded-[2.5rem] overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:border-primary/30 transition-all duration-500 flex flex-col animate-in fade-in slide-in-from-bottom-10"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {template.popular && (
                      <div className="absolute top-6 right-6 bg-orange-500/10 text-orange-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-orange-500/20 z-10 shadow-sm backdrop-blur-md">
                        <Star className="w-3 h-3 fill-orange-500" /> Popular
                      </div>
                    )}
                    
                    <div className="p-8 pb-6 border-b border-border/30 bg-gradient-to-br from-card to-muted/20">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500 shadow-sm mb-6 ${template.color} border border-background/50`}>
                        <template.icon className="w-7 h-7" />
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {template.tags?.map((tag: string) => (
                          <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-accent/50 text-muted-foreground border border-border/50">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-3 line-clamp-2">
                        {template.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base line-clamp-3 mb-2">
                        {template.description}
                      </p>
                    </div>

                    <div className="px-8 py-5 bg-card/40 flex items-center justify-between text-xs font-medium text-muted-foreground border-b border-border/30">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-foreground/80"><ArrowDownToLine className="w-4 h-4" /> {template.downloads}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span className="flex items-center gap-1.5 text-foreground/80"><Clock className="w-4 h-4" /> {template.pages} pages</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <Star className="w-4 h-4 fill-yellow-500" /> {template.rating}
                      </div>
                    </div>

                    <div className="p-8 pt-6 grid grid-cols-2 gap-3 mt-auto">
                      <Button 
                        onClick={() => handlePreview(template)}
                        variant="secondary" 
                        size="lg"
                        className="rounded-xl font-bold gap-2 py-6 text-sm hover:bg-primary hover:text-primary-foreground transition-all order-2 sm:order-1"
                      >
                        <Eye className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button 
                        className="rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all py-6 text-sm order-1 sm:order-2 px-0"
                        onClick={() => handlePreview(template)}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center glass-strong rounded-[3rem] border-dashed border-2 border-border/50">
                  <div className="bg-muted w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Search className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground mb-3 leading-tight">No templates found</h3>
                  <p className="text-muted-foreground text-xl mb-10">We couldn't find anything matching your search. </p>
                  <Button 
                    size="lg"
                    className="font-bold rounded-2xl px-12 h-14"
                    onClick={() => {setActiveCategory('all'); setSearchQuery('');}}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 md:px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="bg-[#1a1f2c] rounded-[3.5rem] p-10 md:p-24 text-center relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
               <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none" />
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
               
               <div className="relative z-10">
                 <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tighter">
                   Missing a template?
                 </h2>
                 <p className="text-gray-400 text-xl md:text-2xl max-w-2xl mx-auto mb-16 leading-relaxed">
                   Our legal team is constantly adding new documents. Let us know what you need and we'll prioritize it.
                 </p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                   <Link to="/contact">
                     <Button size="lg" className="h-16 px-12 text-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold border-none rounded-2xl shadow-xl shadow-primary/20">
                       Request a Template
                     </Button>
                   </Link>
                   <Link to="/auth">
                     <Button variant="outline" size="lg" className="h-16 px-12 text-xl text-white border-white/20 hover:bg-white/10 font-bold rounded-2xl">
                       Join Endorse Free
                     </Button>
                   </Link>
                 </div>
               </div>
            </div>
          </div>
        </section>
      </main>

      {/* Preview/Edit Modal */}
      {isPreviewOpen && selectedTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setIsPreviewOpen(false)} />
          <div className="relative z-10 w-full max-w-5xl h-[85vh] bg-card border border-border rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border-2">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-muted/30 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedTemplate.color}`}>
                  <selectedTemplate.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-sans">{selectedTemplate.title}</h2>
                  <p className="text-sm text-muted-foreground">Preview and edit before downloading</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button variant="outline" onClick={downloadPDF} className="flex-1 md:flex-none h-12 gap-2 font-bold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all">
                  <Download className="w-5 h-5" />
                  Download PDF
                </Button>
                <Button onClick={() => setIsPreviewOpen(false)} variant="ghost" className="h-12 w-12 p-0 rounded-xl hover:bg-red-500/10 hover:text-red-500">
                  <X className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {/* Modal Content - Editor Side */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 p-6 md:p-10 border-b md:border-b-0 md:border-r border-border overflow-y-auto bg-background">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-primary" />
                    Editor
                  </h3>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Live Sync</span>
                </div>
                <div className="space-y-4">
                   <p className="text-xs text-muted-foreground font-medium mb-2">Notice: Highlighted bracketed text like <strong>[Company Name]</strong> is meant to be replaced by your real details.</p>
                   <textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="w-full h-[50vh] p-6 rounded-2xl border-2 border-border/50 bg-muted/10 outline-none focus:border-primary/50 transition-all font-mono text-sm leading-relaxed resize-none shadow-inner"
                    placeholder="Start typing your agreement here..."
                  />
                </div>
              </div>

              {/* Modal Content - Preview Side */}
              <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto bg-slate-100/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" />
                    PDF Preview
                  </h3>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-border" />
                    <div className="w-2 h-2 rounded-full bg-border" />
                  </div>
                </div>
                <div 
                  ref={previewRef}
                  className="bg-white p-8 md:p-12 shadow-2xl rounded-sm min-h-[60vh] prose prose-slate max-w-none text-slate-800 border"
                  dangerouslySetInnerHTML={{ __html: editableContent }}
                />
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-border flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>All documents are ESIGN compliant once signed.</span>
              </div>
              <Link to="/auth" onClick={() => setIsPreviewOpen(false)}>
                <Button className="h-12 px-8 font-bold rounded-xl bg-primary shadow-lg shadow-primary/20">
                  Import to Endorse for Signing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-background border-t border-border pt-16 pb-8 px-4 md:px-6 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-6 group opacity-80 hover:opacity-100 transition-opacity">
                <Logo className="h-[80px] w-auto group-hover:scale-110 transition-transform" />
              </Link>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                The professional way to sign and endorse documents securely online. Join 10k+ professionals.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center bg-card hover:bg-[#1DA1F2] hover:text-white transition-all border border-border" aria-label="Twitter"><Twitter className="w-5 h-5" /></a>
                <a href="https://www.linkedin.com/company/e-ndorse/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center bg-card hover:bg-[#0A66C2] hover:text-white transition-all border border-border" aria-label="LinkedIn"><Linkedin className="w-5 h-5" /></a>
                <a href="https://www.instagram.com/e.ndorse?igsh=MWs2MnltaGdxbDU3eA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center bg-card hover:bg-[#E1306C] hover:text-white transition-all border border-border" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-lg text-foreground mb-6 uppercase tracking-widest text-sm">Product</h4>
              <ul className="space-y-4 text-base text-muted-foreground">
                <li><Link to="/#features" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Features</Link></li>
                <li><Link to="/#pricing" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Pricing</Link></li>
                <li><Link to="/templates" className="text-primary font-bold">Templates</Link></li>
                <li><Link to="/conversion" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">File Conversion</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg text-foreground mb-6 uppercase tracking-widest text-sm">Company</h4>
              <ul className="space-y-4 text-base text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">About Us</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Careers</a></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors hover:translate-x-1 inline-block">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg text-foreground mb-6 uppercase tracking-widest text-sm">Newsletter</h4>
              <p className="text-base text-muted-foreground mb-6">
                Get the latest templates and product updates delivered to your inbox.
              </p>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <Input placeholder="Enter your email" className="bg-background h-12 rounded-xl border-2" aria-label="Email address" />
                </div>
                <Button className="w-full text-base font-bold h-12 rounded-xl bg-[#FFC83D] text-black">Subscribe Now</Button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <p className="text-muted-foreground text-sm font-medium">
                © {new Date().getFullYear()} Endorse. Crafted for Professionals.
              </p>
              <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs font-bold text-muted-foreground">
                <Globe className="w-3 h-3" />
                {language === "en" ? "EN-US" : language.toUpperCase()}
              </div>
            </div>
            <div className="flex gap-8 text-sm font-bold text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors underline decoration-primary decoration-2 underline-offset-4">Terms</Link>
              <Link to="/cookie-policy" className="hover:text-primary transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Templates;
