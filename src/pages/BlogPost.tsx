import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/components/client";
import { doc, getDocFromServer, collection, query, where, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft, Calendar, FileText, Loader2, Share2, User } from "lucide-react";

import { toast } from "sonner";

interface BlogPost {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  image: string;
  createdAt: any;
}


const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        // Try to fetch by ID first
        try {
          const docSnap = await getDocFromServer(doc(db, "blogs", id));
          if (docSnap.exists()) {
            setPost(docSnap.data() as BlogPost);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Ignore error and fall back to slug query
        }

        // Fetch by slug
        const q = query(collection(db, "blogs"), where("slug", "==", id));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setPost(querySnapshot.docs[0].data() as BlogPost);
        } else {
          toast.error("Post not found");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [id]);


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
          <h1 className="text-2xl md:text-3xl font-bold">Post not found</h1>
          <p className="text-muted-foreground">This article may have been moved or removed.</p>
          <Button asChild className="h-12 rounded-full bg-[#0A66C2] px-6 font-bold text-white hover:bg-[#08519c]">
            <Link to="/blog">Back to Blog</Link>
          </Button>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="pt-6 md:pt-10 pb-16 md:pb-20 px-4 md:px-6">
        <article className="container mx-auto max-w-3xl px-0">
          <Link to="/blog" className="-ml-2 mb-4 md:mb-6 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/5 hover:text-[#08519c]">
            <ArrowLeft className="w-4 h-4" /> All articles
          </Link>
          <header className="mb-10 md:mb-12">
            <div className="flex items-center gap-3 text-sm text-primary font-bold uppercase tracking-wider mb-6">
              <span className="px-3 py-1 rounded-full bg-primary/10">{post.category}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6 md:mb-8 leading-tight tracking-tight break-words">
              {post.title}
            </h1>

            {post.image && (
              <div className="w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden mb-8 md:mb-12 shadow-xl">
                {post.image.startsWith('http') || post.image.startsWith('/') ? (
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className={`w-full h-full ${post.image} flex items-center justify-center text-muted-foreground/10`}>
                    <FileText className="w-32 h-32" />
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 md:py-6 border-y border-border/50">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="font-medium text-foreground">{post.author}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={() => {
                    if (navigator.share) {
                        navigator.share({
                            title: post.title,
                            url: window.location.href
                        });
                    } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied to clipboard");
                    }
                 }} aria-label="Share post">
                    <Share2 className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          </header>

          <div 
            className="prose md:prose-lg lg:prose-xl dark:prose-invert max-w-none mb-16 leading-relaxed
              prose-img:rounded-2xl prose-img:shadow-lg prose-img:mx-auto
              prose-headings:font-display prose-headings:font-bold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            style={{ overflowWrap: 'break-word' }}
            // Editor content often joins every word with &nbsp;, which makes a whole
            // paragraph one unbreakable "word" that then splits mid-word on phones.
            dangerouslySetInnerHTML={{ __html: (post.content || "").replace(/&nbsp;|\u00a0/g, " ") }}
          />



          <footer className="pt-10 md:pt-12 border-t border-border">
            <div className="bg-secondary/30 rounded-2xl p-6 md:p-8 text-center">
              <h3 className="text-xl font-bold mb-4">Enjoyed this article?</h3>
              <p className="text-muted-foreground mb-6">Share it with your network or check out more insights from the Endorse team.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <Button variant="outline" asChild className="h-12 rounded-full border-[#0A66C2]/30 px-6 font-bold text-[#0A66C2] hover:bg-[#0A66C2]/5 hover:text-[#08519c]">
                  <Link to="/blog">Browse More Posts</Link>
                </Button>
                <Button className="h-12 rounded-full bg-[#FFC83D] px-6 font-bold text-black hover:bg-[#e6b435]" asChild>
                  <Link to="/auth">Start Signing Free</Link>
                </Button>
              </div>
            </div>
          </footer>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
};

export default BlogPost;
