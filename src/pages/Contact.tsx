import { useEffect, useState, useRef } from "react";
import emailjs from '@emailjs/browser';
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
  Mail,
  MapPin,
  PhoneCall,
  Send,
  MessageSquare,
  Globe,
  Twitter,
  Linkedin,
  Facebook,
  Instagram
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Contact = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileProductOpen, setMobileProductOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [language, setLanguage] = useState("en");

  const form = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current) return;

    setIsSubmitting(true);

    // Note: Replace these with your actual EmailJS credentials
    emailjs
      .sendForm('service_6jotgng', 'template_98l8hhh', form.current, {
        publicKey: 'gElZBL18i5EFwVMx3',
      })
      .then(
        () => {
          alert('Message sent successfully!');
          form.current?.reset();
          setIsSubmitting(false);
        },
        (error) => {
          console.error('FAILED...', error.text);
          alert('Failed to send message. Please try again later.');
          setIsSubmitting(false);
        },
      );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Endorse">
            <Logo className="h-14 w-auto drop-shadow-sm" />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <DropdownMenu>
              <DropdownMenuTrigger className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors flex items-center gap-1 outline-none group">
                Product <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[340px] p-3">
                <DropdownMenuItem asChild className="mb-1 cursor-pointer rounded-lg focus:bg-accent">
                  <Link to="/#features" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <PenTool className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-foreground">eSign</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Create, send, and track legally binding electronic signatures.
                      </span>
                    </div>
                  </Link>
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
            <Link to="/#pricing" className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors">Pricing</Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="font-sans text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors flex items-center gap-1 outline-none group">
                Resources <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[340px] p-3">
                <DropdownMenuItem asChild className="mb-1 cursor-pointer rounded-lg focus:bg-accent">
                  <Link to="/templates" className="flex items-start gap-3 p-3 w-full">
                    <div className="bg-primary/10 p-2.5 rounded-md shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-foreground">Templates</span>
                      <span className="text-xs text-muted-foreground leading-snug">
                        Free agreement templates for pros.
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
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
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">Get Started</Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-foreground p-2" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-background border-b border-border p-4 flex flex-col gap-4 shadow-lg animate-in slide-in-from-top-5 h-[calc(100vh-5rem)] overflow-y-auto">
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
                  <Link to="/#features" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}><PenTool className="w-4 h-4" /> eSign</Link>
                  <Link to="/conversion" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}><FileType className="w-4 h-4" /> File Conversion</Link>
                </div>
              )}
            </div>
            <Link to="/#pricing" className="font-sans text-sm font-bold tracking-tight text-foreground p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
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
                  <Link to="/templates" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}><FileText className="w-4 h-4" /> Templates</Link>
                  <Link to="/blog" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}><FileText className="w-4 h-4" /> Blog</Link>
                  <Link to="#" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}><HelpCircle className="w-4 h-4" /> Help Center</Link>
                  <Link to="#" className="flex items-center gap-2 text-sm text-muted-foreground p-2 hover:text-foreground hover:bg-accent/50 rounded-md" onClick={() => setIsMenuOpen(false)}><Code className="w-4 h-4" /> API Docs</Link>
                </div>
              )}
            </div>
            <Link to="/about" className="font-sans text-sm font-bold tracking-tight text-foreground p-2 hover:bg-accent rounded-md transition-colors" onClick={() => setIsMenuOpen(false)}>Company</Link>
            <div className="flex flex-col gap-3 mt-2">
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 pt-32 pb-16">
        <section className="px-4 md:px-6 mb-16">
          <div className="container mx-auto max-w-6xl">
            {/* Header section */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <MessageSquare className="w-4 h-4" />
                Contact Us
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight text-foreground">
                Get in touch with our team
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.
              </p>
            </div>

            <div className="grid md:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Contact Information & General Help */}
              <div className="md:col-span-5 space-y-10">
                <div className="bg-card border border-border rounded-3xl p-8 shadow-md">
                  <h3 className="font-display text-2xl font-bold mb-6 text-foreground">Contact Information</h3>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-1">Email us</h4>
                        <p className="text-muted-foreground mb-2 leading-relaxed">Our friendly team is here to help.</p>
                        <a href="mailto:support@endorse.com" className="text-primary font-medium hover:underline">admin@e-ndorse.online</a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-1">Call us</h4>
                        <p className="text-muted-foreground mb-2 leading-relaxed">Mon-Fri from 8am to 5pm.</p>
                        <a href="tel:+2347014054720" className="text-green-600 font-medium hover:underline">+1 (555) 123-4567</a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-[#0A66C2]" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-1">Social</h4>
                        <p className="text-muted-foreground mb-2 leading-relaxed">Follow and reach out to us.</p>
                        <div className="flex gap-4 mt-2">
                          <a href="https://www.linkedin.com/company/e-ndorse/" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:opacity-80 transition-opacity" aria-label="LinkedIn"><Linkedin className="w-5 h-5" /></a>
                          <a href="https://www.instagram.com/e.ndorse?igsh=MWs2MnltaGdxbDU3eA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-[#E1306C] hover:opacity-80 transition-opacity" aria-label="Instagram"><Instagram className="w-5 h-5" /></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1f2c] text-white rounded-3xl p-8 relative overflow-hidden shadow-xl">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/30 rounded-full blur-[50px] pointer-events-none" />
                  <h3 className="font-display text-2xl font-bold mb-3 z-10 relative">Need Technical Support?</h3>
                  <p className="text-gray-400 mb-6 z-10 relative">
                    Browse our Help Center for quick answers to common issues, tutorials, and documentation.
                  </p>
                  <Button className="w-full bg-white text-black hover:bg-gray-100 z-10 relative font-semibold">
                    Visit Help Center
                  </Button>
                </div>
              </div>

              {/* Contact Form */}
              <div className="md:col-span-7 bg-card border border-border shadow-xl rounded-3xl p-8 md:p-10 relative">
                {/* Decorative background element */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-secondary rounded-full -z-10 blur-xl opacity-70" />
                <div className="absolute -left-6 -top-6 w-32 h-32 bg-primary/10 rounded-full -z-10 blur-xl opacity-70" />

                <h3 className="font-display text-3xl font-bold mb-2">Send us a message</h3>
                <p className="text-muted-foreground mb-8">We'll get back to you within 24 hours.</p>

                <form ref={form} className="space-y-6" onSubmit={sendEmail}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="first-name" className="text-sm font-semibold text-foreground">First Name</label>
                      <Input
                        id="first-name"
                        name="first_name"
                        className="bg-background border-border/40 focus:border-primary h-12 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="last-name" className="text-sm font-semibold text-foreground">Last Name</label>
                      <Input
                        id="last-name"
                        name="last_name"
                        className="bg-background border-border/40 focus:border-primary h-12 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-semibold text-foreground">Email</label>
                    <Input
                      id="email"
                      type="email"
                      name="user_email"
                      className="bg-background border-border/40 focus:border-primary h-12 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-semibold text-foreground">Subject</label>
                    <select
                      id="subject"
                      name="subject"
                      className="w-full h-12 px-3 py-2 bg-background border border-border/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                      defaultValue=""
                    >
                      <option value="" disabled>Select a topic</option>
                      <option value="sales">Sales & Pricing</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-semibold text-foreground">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      className="w-full px-3 py-2 bg-background border border-border/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y transition-all"
                      placeholder="How can we help you?"
                      required
                    ></textarea>
                  </div>

                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full h-14 bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 font-semibold text-lg flex items-center justify-center gap-2 group">
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    {!isSubmitting && <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By submitting this form, you agree to our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border pt-12 md:pt-16 pb-8 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-6 opacity-80 hover:opacity-100 transition-opacity">
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
                <li><Link to="/#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/templates" className="hover:text-foreground transition-colors">Templates</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-lg text-foreground mb-6">Company</h4>
              <ul className="space-y-4 text-base text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="text-foreground transition-colors">Contact</Link></li>
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
    </div>
  );
};

export default Contact;
