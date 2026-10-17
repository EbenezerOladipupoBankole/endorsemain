import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { NewsletterForm } from "@/components/NewsletterForm";
import { toast } from "sonner";
import { ArrowRight, FileText, Image as ImageIcon, Search, Share2, Sparkles, User, X } from "lucide-react";

const plainText = (html: unknown) =>
  String(html ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

const postUrl = (post: any) => `${window.location.origin}/blog/${post.slug || post.id}`;

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { collection, getDocsFromServer, query, orderBy } = await import("firebase/firestore");
        const { db } = await import("@/components/client");
        
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocsFromServer(q);
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (fetchedPosts.length > 0) {
          setPosts(fetchedPosts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    window.scrollTo(0, 0);
  }, []);

  // Matches every word typed, anywhere in the title, summary, category, author or article body.
  const query = search.trim().toLowerCase();
  const results = useMemo(() => {
    if (!query) return posts;
    const words = query.split(/\s+/);
    return posts.filter((post) => {
      const haystack = [post.title, post.excerpt, post.category, post.author, plainText(post.content)].join(" ").toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
  }, [posts, query]);
  const featured = query ? null : results[0];
  const gridPosts = query ? results : results.slice(1);

  const sharePost = async (post: any) => {
    const url = postUrl(post);
    if (navigator.share) {
      navigator.share({ title: post.title, text: post.excerpt, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="pt-10 md:pt-16 pb-16 md:pb-20 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl px-0">
          {/* Header */}
          <div className="text-center mb-12 md:mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              The Endorse Blog
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Insights for the <br/>
              <span className="text-[#0A66C2]">Modern Workflow</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10">
              Latest product updates, industry news, and tips to help you manage documents better.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="pl-10 pr-11 h-12 bg-secondary/50 border-border text-base focus:ring-primary [&::-webkit-search-cancel-button]:hidden"
                aria-label="Search articles"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {query && !loading && (
              <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
                {results.length === 0
                  ? `No articles match "${search.trim()}".`
                  : `${results.length} article${results.length === 1 ? "" : "s"} found for "${search.trim()}"`}
              </p>
            )}
          </div>

          {/* Featured Post */}
          {featured && (
            <div className="mb-12 md:mb-20">
              <Link to={`/blog/${featured.slug || featured.id}`} className="group relative rounded-2xl bg-card border border-border overflow-hidden grid md:grid-cols-2 md:gap-8 hover:shadow-lg transition-all duration-500 block">
                <div className="aspect-video md:aspect-auto bg-secondary/50 relative overflow-hidden">
                   {featured.image?.startsWith('http') || featured.image?.startsWith('/') ? (
                     <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <div className={`w-full h-full ${featured.image || 'bg-primary/5'} flex items-center justify-center text-muted-foreground/20 group-hover:scale-105 transition-transform duration-500`}>
                        <FileText className="w-24 h-24" />
                     </div>
                   )}
                </div>
                <div className="p-6 md:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <span className="text-primary font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-xs uppercase tracking-wide">Featured</span>
                    <span>•</span>
                    <span>{featured.createdAt?.seconds ? new Date(featured.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4 group-hover:text-primary transition-colors break-words">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground text-base md:text-lg mb-6 md:mb-8 leading-relaxed line-clamp-3">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{featured.author}</p>
                      <p className="text-xs text-muted-foreground">{featured.category}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Post Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {gridPosts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="group flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="aspect-[16/9] relative overflow-hidden bg-muted">
                   {post.image?.startsWith('http') || post.image?.startsWith('/') ? (
                     <img 
                       src={post.image} 
                       alt={post.title} 
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                     />
                   ) : (
                     <div className={`w-full h-full ${post.image || 'bg-primary/5'} flex items-center justify-center text-muted-foreground/20 group-hover:scale-105 transition-transform duration-500`}>
                        <ImageIcon className="w-12 h-12" />
                     </div>
                   )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10 uppercase tracking-wide">{post.category}</span>
                    {post.readTime && (
                      <>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </>
                    )}
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          sharePost(post);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        aria-label="Share post"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center text-xs font-semibold text-foreground group-hover:translate-x-1 transition-transform">
                        Read <ArrowRight className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {!loading && posts.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">No articles yet — check back soon.</p>
          )}
          {loading && <p className="py-12 text-center text-muted-foreground">Loading articles…</p>}

          {/* Newsletter CTA */}
          <div className="mt-16 md:mt-24 rounded-2xl bg-secondary/30 border border-border p-6 md:p-12 text-center">
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">Subscribe to our newsletter</h3>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Get the latest articles, resources, and product updates delivered directly to your inbox.
            </p>
            <NewsletterForm source="blog" className="max-w-md mx-auto" />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Blog;
