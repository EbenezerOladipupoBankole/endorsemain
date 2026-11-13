import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CreditCard, ExternalLink, FileSignature, LifeBuoy, Loader2, PlayCircle, Rocket, Search, Settings2, Video } from "lucide-react";
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
    { name: "Getting Started", icon: Rocket, count: tutorials.filter(t => t.category === "Getting Started").length },
    { name: "Signatures & Documents", icon: FileSignature, count: tutorials.filter(t => t.category === "Signatures & Documents").length },
    { name: "Account & Billing", icon: CreditCard, count: tutorials.filter(t => t.category === "Account & Billing").length },
    { name: "Advanced Features", icon: Settings2, count: tutorials.filter(t => t.category === "Advanced Features").length },
  ];

  const filteredTutorials = tutorials.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-4 md:px-6 bg-slate-50 border-b border-border/50 dark:bg-slate-900/40">
        <div className="container mx-auto px-0 max-w-4xl text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 tracking-tight text-slate-900 dark:text-white">How can we help?</h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 md:mb-10">Search our tutorials and video guides to master Endorse.</p>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              className="pl-12 h-12 md:h-14 bg-background text-base md:text-lg shadow-sm border-border focus:ring-primary"
              aria-label="Search help articles"
              placeholder="Search for guides, videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 md:px-6 py-10 md:py-16 max-w-6xl">
        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-12 md:mb-20">
          {categories.map((cat, i) => (
            <div key={i} className="p-4 sm:p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                {cat.icon && <cat.icon className="w-6 h-6" />}
              </div>
              <h3 className="font-bold mb-1">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.count || 0} articles</p>
            </div>
          ))}
        </div>

        {/* Tutorials Section */}
        <div className="space-y-12">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-primary" />
              Featured Video Tutorials
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : tutorials.length === 0 ? (
            <div className="text-center py-20 bg-secondary/10 rounded-3xl border border-dashed border-border">
              <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-muted-foreground">No tutorials found.</h3>
              <p className="text-sm text-muted-foreground mt-1">Check back later or contact support if you need help.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
                    <span className="text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded w-fit mb-3">
                      {tutorial.category}
                    </span>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                      {tutorial.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                      {tutorial.description}
                    </p>
                    <Button variant="ghost" className="w-fit -ml-2 px-2 h-10 hover:bg-primary/5 text-primary hover:text-primary/80 group/btn" asChild>
                      <a href={`https://youtube.com/watch?v=${tutorial.youtubeId}`} target="_blank" rel="noopener noreferrer">
                        Watch on YouTube <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help CTA */}
        <div className="mt-16 md:mt-24 rounded-3xl bg-primary/5 border border-primary/20 p-6 sm:p-8 md:p-12 text-center">
          <LifeBuoy className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Still need help?</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our support team is available 24/7 to answer your questions and help you get the most out of Endorse.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Button size="lg" asChild className="h-12 rounded-full bg-[#FFC83D] font-bold text-black hover:bg-[#e6b435]">
              <a href="mailto:support@e-ndorse.online">Contact Support</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 rounded-full border-[#0A66C2]/30 font-bold text-[#0A66C2] hover:bg-[#0A66C2]/5 hover:text-[#08519c]">
              <Link to="/api-docs">Visit API Docs</Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HelpCenter;
