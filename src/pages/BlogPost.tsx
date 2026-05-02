import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/components/client";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Calendar, User, Clock, Share2, Loader2, FileText } from "lucide-react";
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

import { staticPosts } from "@/lib/blog-data";

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, "blogs", id));
        if (docSnap.exists()) {
          setPost(docSnap.data() as BlogPost);
        } else {
          // Check static posts fallback
          const staticPost = staticPosts.find(p => p.id === id);
          if (staticPost) {
            setPost(staticPost as unknown as BlogPost);
          } else {
            toast.error("Post not found");
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        // Try static fallback even on error
        const staticPost = staticPosts.find(p => p.id === id);
        if (staticPost) {
          setPost(staticPost as unknown as BlogPost);
        } else {
          toast.error("Failed to load post");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [id]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Button asChild>
          <Link to="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 md:h-16 w-auto" />
          </Link>
          <Button variant="ghost" size="sm" asChild className="text-xs md:text-sm">
            <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-1 md:mr-2" /> Back to Blog</Link>
          </Button>
        </div>
      </nav>


      <main className="pt-32 pb-20 px-4 md:px-6">
        <article className="container mx-auto max-w-3xl">
          <header className="mb-12">
            <div className="flex items-center gap-3 text-sm text-primary font-bold uppercase tracking-wider mb-6">
              <span className="px-3 py-1 rounded-full bg-primary/10">{post.category}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-8 leading-tight tracking-tight">
              {post.title}
            </h1>

            {post.image && (
              <div className="w-full aspect-video rounded-3xl overflow-hidden mb-12 shadow-2xl">
                {post.image.startsWith('http') || post.image.startsWith('/') ? (
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className={`w-full h-full ${post.image} flex items-center justify-center text-muted-foreground/10`}>
                    <FileText className="w-24 h-24" />
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap items-center justify-between gap-6 py-6 border-y border-border/50">
              <div className="flex items-center gap-6">
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
                 <Button variant="ghost" size="icon" className="rounded-full" onClick={() => {
                    if (navigator.share) {
                        navigator.share({
                            title: post.title,
                            url: window.location.href
                        });
                    } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied to clipboard");
                    }
                 }}>
                    <Share2 className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          </header>

          <div 
            className="prose prose-lg md:prose-xl dark:prose-invert max-w-none mb-16 leading-relaxed
              prose-img:rounded-2xl prose-img:shadow-lg prose-img:mx-auto
              prose-headings:font-display prose-headings:font-bold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />



          <footer className="pt-12 border-t border-border">
            <div className="bg-secondary/30 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold mb-4">Enjoyed this article?</h3>
              <p className="text-muted-foreground mb-6">Share it with your network or check out more insights from the Endorse team.</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" asChild>
                  <Link to="/blog">Browse More Posts</Link>
                </Button>
                <Button className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90" asChild>
                  <Link to="/auth">Start Signing Free</Link>
                </Button>
              </div>
            </div>
          </footer>
        </article>
      </main>
    </div>
  );
};

export default BlogPost;
