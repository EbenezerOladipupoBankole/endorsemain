import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { 
  Search, 
  PlayCircle, 
  BookOpen, 
  HelpCircle, 
  ChevronRight, 
  Video,
  FileText,
  LifeBuoy,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { db } from "@/components/client";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
}

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const q = query(collection(db, "tutorials"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Tutorial[];
        setTutorials(data);
      } catch (error) {
        console.error("Error fetching tutorials:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutorials();
  }, []);

  const categories = [
    { name: "Getting Started", icon: BookOpen, count: tutorials.filter(t => t.category === "Getting Started").length },
    { name: "Signatures & Documents", icon: FileText, count: tutorials.filter(t => t.category === "Signatures & Documents").length },
    { name: "Account & Billing", icon: HelpCircle, count: tutorials.filter(t => t.category === "Account & Billing").length },
    { name: "Advanced Features", icon: LifeBuoy, count: tutorials.filter(t => t.category === "Advanced Features").length },
  ];

  const filteredTutorials = tutorials.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-6 h-24 md:h-32 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-12 md:h-20 w-auto" />
          </Link>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/blog">Blog</Link>
            </Button>
            {user ? (
              <Button asChild className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-secondary/20 border-b border-border/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">How can we help?</h1>
          <p className="text-xl text-muted-foreground mb-10">Search our tutorials and video guides to master Endorse.</p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              className="pl-12 h-14 bg-background text-lg shadow-sm border-border focus:ring-primary"
              placeholder="Search for guides, videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-16 max-w-6xl">
        {/* Categories */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          {categories.map((cat, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all cursor-pointer group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                <cat.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-1">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.count || 0} articles</p>
            </div>
          ))}
        </div>

        {/* Tutorials Section */}
        <div className="space-y-12">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              Featured Video Tutorials
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : tutorials.length === 0 ? (
            <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border">
              <PlayCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No tutorials found.</h3>
              <p className="text-sm text-muted-foreground mt-1">Check back later or contact support if you need help.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTutorials.map((tutorial) => (
                <div key={tutorial.id} className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
                  {/* YouTube Embed */}
                  <div className="aspect-video w-full bg-black relative">
                    <iframe
                      src={`https://www.youtube.com/embed/${tutorial.youtubeId}`}
                      title={tutorial.title}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded w-fit mb-3">
                      {tutorial.category}
                    </span>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                      {tutorial.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                      {tutorial.description}
                    </p>
                    <Button variant="ghost" className="w-fit p-0 h-auto hover:bg-transparent text-primary hover:text-primary/80 group/btn" asChild>
                      <a href={`https://youtube.com/watch?v=${tutorial.youtubeId}`} target="_blank" rel="noopener noreferrer">
                        Watch on YouTube <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help CTA */}
        <div className="mt-24 rounded-3xl bg-primary/5 border border-primary/20 p-8 md:p-12 text-center">
          <HelpCircle className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our support team is available 24/7 to answer your questions and help you get the most out of Endorse.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">Contact Support</Button>
            <Button size="lg" variant="outline">Visit API Docs</Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <Logo className="h-8 w-auto grayscale opacity-50" />
          <div className="flex gap-8">
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
          <p>© {new Date().getFullYear()} Endorse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HelpCenter;
