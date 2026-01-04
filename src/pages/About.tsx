import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { CheckCircle2, Globe, Heart, Shield, Users, Zap, Building2, Linkedin, Github, Mail, Quote, ChevronDown, PenTool, FileType, FileText, HelpCircle, Code } from "lucide-react";
import builderImage from "@/assets/images/bankole.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
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
                  <Link to="#" className="flex items-start gap-3 p-3 w-full">
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
            <Link to="/about" className="font-sans text-sm font-bold tracking-tight text-foreground transition-colors">Company</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32">
        {/* Hero Section */}
        <section className="px-4 md:px-6 pb-16 md:pb-20 text-center">
          <div className="container mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              Our Company
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold mb-8 tracking-tight text-foreground">
              We're changing the way <br />
              <span className="text-gradient">the world agrees.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Endorse is dedicated to making every agreement digital, secure, and accessible from anywhere on the planet.
            </p>
          </div>
        </section>

        {/* Image / Visual Break */}
        <section className="px-4 md:px-6 mb-16 md:mb-24">
          <div className="container mx-auto max-w-6xl">
            <div className="aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden relative bg-secondary">
               {/* Abstract Enterprise Visual */}
               <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-8 opacity-20 transform -rotate-12 scale-125">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className="w-64 h-40 bg-foreground rounded-xl" />
                    ))}
                  </div>
               </div>
               <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-black/80 to-transparent text-white">
                 <p className="font-display text-2xl md:text-3xl font-bold">Connecting businesses and people.</p>
               </div>
            </div>
          </div>
        </section>

        {/* Mission & Story */}
        <section className="px-4 md:px-6 py-16 md:py-20 bg-secondary/20">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Founded in 2024, Endorse started with a simple premise: paper contracts are a bottleneck to progress. We believe that agreements should be as fast and fluid as the rest of your work.
                </p>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  We are at the beginning of our journey, building a platform for forward-thinking individuals and teams. Whether you're a freelancer or a growing startup, Endorse provides the secure infrastructure to help you scale.
                </p>
                <div className="flex gap-8">
                  <div>
                    <div className="text-4xl font-bold text-primary mb-1">100%</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">Committed</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-primary mb-1">Secure</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">By Design</div>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-primary mb-1">Global</div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider">Vision</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-card border border-border p-8 rounded-2xl shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Built on Trust
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Security isn't just a feature; it's our foundation. We adhere to the strictest global standards to ensure your data remains yours.
                  </p>
                  <ul className="space-y-3">
                    {["SOC 2 Type II Certified", "ISO 27001 Compliant", "GDPR Ready", "256-bit Encryption"].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="px-4 md:px-6 py-16 md:py-24">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                The principles that guide every decision we make.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Heart,
                  title: "Customer Success",
                  desc: "We only win when our customers win. We obsess over user experience and support."
                },
                {
                  icon: Zap,
                  title: "Simplicity",
                  desc: "Complexity is the enemy of execution. We strive to make the complex simple."
                },
                {
                  icon: Users,
                  title: "Integrity",
                  desc: "We do the right thing, even when no one is watching. Trust is our currency."
                }
              ].map((val, i) => (
                <div key={i} className="bg-card p-8 rounded-2xl border border-border hover:shadow-lg transition-all duration-300 group">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <val.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{val.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Remote First / Global Team */}
        <section className="px-4 md:px-6 py-16 md:py-24 bg-[#1a1f2c] text-white relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
           <div className="container mx-auto max-w-6xl relative z-10">
             <div className="flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="md:w-1/2">
                 <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">Built for the<br/>Remote World.</h2>
                 <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                   We are a fully distributed team spanning multiple continents. This allows us to provide 24/7 support and build a product that truly understands global collaboration.
                 </p>
               </div>
               <div className="md:w-1/2 grid grid-cols-2 gap-4">
                 {[
                   { title: "Remote First", desc: "Distributed team across 12+ time zones" },
                   { title: "24/7 Support", desc: "Always on, wherever you are" },
                   { title: "Global Compliance", desc: "Adhering to international standards" },
                   { title: "Digital Native", desc: "Born in the cloud, built for speed" }
                 ].map((item, i) => (
                   <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-sm">
                     <Globe className="w-5 h-5 text-[#FFC83D] mb-3" />
                     <h4 className="font-bold text-lg">{item.title}</h4>
                     <p className="text-sm text-gray-400">{item.desc}</p>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        </section>

        {/* Builder Section */}
        <section className="px-4 md:px-6 py-16 md:py-24">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Meet the Builder</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Driving innovation in digital agreements.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Quote className="w-64 h-64" />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
                {/* Image Side */}
                <div className="shrink-0 relative">
                   <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                   <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-background shadow-2xl">
                    <img 
                      src={builderImage}
                      alt="Bankole Ebenezer" 
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>

                {/* Text Side */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                    <Building2 className="w-3 h-3" />
                    Lead Developer & Architect
                  </div>
                  
                  <h3 className="font-display text-3xl font-bold mb-6">Bankole Ebenezer</h3>
                  
                  <div className="relative">
                    <Quote className="w-8 h-8 text-primary/20 absolute -top-4 -left-4 -z-10" />
                    <p className="text-lg text-muted-foreground leading-relaxed mb-8 relative z-10">
                      With a foundation in Software Development from <span className="text-foreground font-medium">Brigham Young University - Idaho</span>, Bankole is the visionary architect behind Endorse. His passion lies in crafting elegant, user-centric solutions that solve real-world problems at scale.
                    </p>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <a href="#" className="p-2 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-full transition-colors" aria-label="LinkedIn">
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="#" className="p-2 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-full transition-colors" aria-label="GitHub">
                      <Github className="w-5 h-5" />
                    </a>
                    <a href="mailto:contact@endorse.com" className="p-2 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-full transition-colors" aria-label="Email">
                      <Mail className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="font-display text-4xl font-bold mb-6">Join the movement</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Ready to modernize your workflow? Start using Endorse today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="h-14 px-8 text-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  Get Started for Free
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
                Contact Sales
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;