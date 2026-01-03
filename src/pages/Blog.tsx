import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { ChevronRight, FileText, Search, User } from "lucide-react";

const Blog = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const posts = [
    {
      category: "Product Updates",
      title: "New Feature: Bulk Send for Enterprise Teams",
      excerpt: "Efficiency just got an upgrade. Learn how to send hundreds of documents for signature in minutes with our new Bulk Send feature, designed for HR and Sales teams.",
      date: "Oct 24, 2024",
      readTime: "4 min read",
      author: "Product Team",
      image: "bg-blue-500/5"
    },
    {
      category: "Compliance",
      title: "Understanding eIDAS and ESIGN: A Global Compliance Guide",
      excerpt: "Navigating the complex world of digital signature legality. We break down what you need to know about regulations in the US, EU, and beyond.",
      date: "Oct 18, 2024",
      readTime: "7 min read",
      author: "Legal Team",
      image: "bg-purple-500/5"
    },
    {
      category: "Security",
      title: "How We Protect Your Data: SOC 2 & Encryption",
      excerpt: "Security is our top priority. A deep dive into our 256-bit encryption, audit trails, and why enterprise-grade security is non-negotiable.",
      date: "Oct 12, 2024",
      readTime: "5 min read",
      author: "Security Team",
      image: "bg-green-500/5"
    },
    {
      category: "Productivity",
      title: "5 Strategies to Close Deals Faster",
      excerpt: "Reduce friction in your sales cycle. Actionable tips for preparing contracts that get signed immediately, not next week.",
      date: "Oct 05, 2024",
      readTime: "3 min read",
      author: "Success Team",
      image: "bg-orange-500/5"
    },
    {
      category: "Engineering",
      title: "Building Scalable Real-Time Collaboration",
      excerpt: "A technical look at the WebSocket architecture behind Endorse's lightning-fast signature processing and live status updates.",
      date: "Sep 28, 2024",
      readTime: "9 min read",
      author: "Engineering",
      image: "bg-red-500/5"
    },
    {
      category: "Case Study",
      title: "How a Fortune 500 Firm Digitized HR Onboarding",
      excerpt: "See how moving to digital signatures saved 1,000+ hours of administrative work annually for a global logistics company.",
      date: "Sep 20, 2024",
      readTime: "7 min read",
      author: "Endorse Team",
      image: "bg-indigo-500/5"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/40">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-10 w-auto" />
            <span className="font-display font-bold text-xl">Endorse</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <FileText className="w-4 h-4" />
              The Endorse Blog
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Insights for the <br/>
              <span className="text-gradient">Modern Workflow</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Latest product updates, industry news, and tips to help you manage documents better.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Search articles..." className="pl-10 h-12 bg-secondary/50 border-border focus:ring-primary" />
            </div>
          </div>

          {/* Featured Post */}
          <div className="mb-20">
            <div className="group relative rounded-2xl bg-card border border-border overflow-hidden grid md:grid-cols-2 gap-8 hover:shadow-lg transition-all duration-500">
              <div className="aspect-video md:aspect-auto bg-secondary/50 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-20 h-20 text-primary/20 group-hover:scale-110 transition-transform duration-700" />
                 </div>
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span className="text-primary font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-xs uppercase tracking-wide">Featured</span>
                  <span>•</span>
                  <span>Oct 24, 2024</span>
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 group-hover:text-primary transition-colors">
                  The Future of Digital Agreements: Trends to Watch in 2025
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  As remote work becomes permanent, the way we sign and manage contracts is evolving. Here are the key trends shaping the industry.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground">
                    <Logo className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Endorse Editorial</p>
                    <p className="text-xs text-muted-foreground">Industry Trends</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Post Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <Link key={i} to="#" className="group flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-300">
                <div className={`aspect-[16/9] ${post.image} relative overflow-hidden`}>
                   <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 group-hover:scale-105 transition-transform duration-500">
                      <FileText className="w-12 h-12" />
                   </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10 uppercase tracking-wide">{post.category}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                    <div className="flex items-center text-xs font-semibold text-foreground group-hover:translate-x-1 transition-transform">
                      Read <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Newsletter CTA */}
          <div className="mt-24 rounded-2xl bg-secondary/30 border border-border p-8 md:p-12 text-center">
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">Subscribe to our newsletter</h3>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Get the latest articles, resources, and product updates delivered directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input placeholder="Enter your email" className="bg-background" />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (Simple) */}
      <footer className="bg-background border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Endorse. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/auth" className="hover:text-foreground">Sign In</Link>
            <a href="#" className="hover:text-foreground">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Blog;