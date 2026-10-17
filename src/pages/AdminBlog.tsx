import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/components/client";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { storage } from "@/components/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { Link, Navigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import RichTextEditor from "@/components/blog/RichTextEditor";
import { ArrowLeft, Edit, ExternalLink, Image as ImageIcon, Loader2, Plus, Send, Trash2, Upload, X } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  image: string;
  createdAt: any;
  slug: string;
}

const AdminBlog = () => {
  const { user, isAdmin } = useAuth();



  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({
    title: "",
    excerpt: "",
    content: "",
    category: "Product Updates",
    author: "Endorse Team",
    image: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchPosts();
    }
  }, [isAdmin]);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `blog/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCurrentPost({ ...currentPost, image: url });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPost.title || !currentPost.content) {
      toast.error("Please fill in title and content");
      return;
    }

    setSubmitting(true);
    try {
      const slug = currentPost.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const postData = {
        ...currentPost,
        slug,
        updatedAt: serverTimestamp(),
      };

      if (currentPost.id) {
        await updateDoc(doc(db, "blogs", currentPost.id), postData);
        toast.success("Post updated successfully");
      } else {
        await addDoc(collection(db, "blogs"), {
          ...postData,
          createdAt: serverTimestamp(),
        });
        toast.success("Post created successfully");
      }

      setIsEditing(false);
      setCurrentPost({
        title: "",
        excerpt: "",
        content: "",
        category: "Product Updates",
        author: "Endorse Team",
        image: "bg-blue-500/5",
      });
      fetchPosts();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, "blogs", id));
        toast.success("Post deleted");
        fetchPosts();
      } catch (error) {
        console.error("Error deleting post:", error);
        toast.error("Failed to delete post");
      }
    }
  };

  const startEdit = (post: BlogPost) => {
    setCurrentPost(post);
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Logo className="h-9 md:h-10" />
            </Link>
            <h1 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Blog Admin</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/blog" target="_blank"><ExternalLink className="w-4 h-4 mr-2" /> View Public Blog</Link>
          </Button>
        </div>
      </header>

      <main className="container py-10 px-4 md:px-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Manage Content</h2>
            <p className="text-muted-foreground">Create and edit blog posts for Endorse.</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Post
            </Button>
          )}
        </div>

        {isEditing && (
          <div className="fixed inset-0 z-50 bg-background overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <span className="text-sm text-muted-foreground font-medium">
                  {currentPost.id ? "Editing Post" : "Draft in Progress"}
                </span>
              </div>
              <Button onClick={handleSave} disabled={submitting} className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90 rounded-full px-6">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {currentPost.id ? "Update" : "Publish"}
              </Button>
            </div>

            <div className="max-w-3xl mx-auto py-12 px-4 md:px-0">
              <input 
                type="text" 
                value={currentPost.title} 
                onChange={e => setCurrentPost({...currentPost, title: e.target.value})}
                placeholder="Title"
                className="w-full text-5xl font-bold border-none outline-none focus:ring-0 bg-transparent placeholder:text-muted-foreground/30 mb-8 font-serif text-foreground"
              />
              
              <div className="prose prose-lg dark:prose-invert max-w-none mb-16">
                <RichTextEditor 
                  value={currentPost.content || ""} 
                  onChange={value => setCurrentPost({...currentPost, content: value})}
                  placeholder="Tell your story..."
                />
              </div>

              <div className="border-t pt-8 pb-20">
                <h3 className="text-xl font-bold mb-6 font-serif">Post Settings</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-muted-foreground text-xs uppercase tracking-wider">Category</Label>
                      <Input 
                        id="category" 
                        value={currentPost.category} 
                        onChange={e => setCurrentPost({...currentPost, category: e.target.value})}
                        placeholder="e.g. Product Updates"
                        className="bg-secondary/50 border-transparent focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author" className="text-muted-foreground text-xs uppercase tracking-wider">Author</Label>
                      <Input 
                        id="author" 
                        value={currentPost.author} 
                        onChange={e => setCurrentPost({...currentPost, author: e.target.value})}
                        className="bg-secondary/50 border-transparent focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="excerpt" className="text-muted-foreground text-xs uppercase tracking-wider">Excerpt</Label>
                      <Textarea 
                        id="excerpt" 
                        value={currentPost.excerpt} 
                        onChange={e => setCurrentPost({...currentPost, excerpt: e.target.value})}
                        placeholder="Short summary for the grid view..."
                        rows={3}
                        className="bg-secondary/50 border-transparent focus:bg-background resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Featured Image</Label>
                    <div className="flex flex-col gap-4">
                      {currentPost.image ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                          {currentPost.image.startsWith('bg-') ? (
                            <div className={`w-full h-full ${currentPost.image}`} />
                          ) : (
                            <img src={currentPost.image} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <Button 
                            type="button"
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-sm"
                            onClick={() => setCurrentPost({ ...currentPost, image: "" })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-secondary/30 text-muted-foreground hover:bg-secondary/50 transition-colors">
                          <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-sm font-medium">Add a cover image</span>
                        </div>
                      )}
                      <div>
                        <label className="cursor-pointer inline-block w-full">
                          <div className="flex justify-center items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors w-full text-sm font-medium">
                            {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {currentPost.image ? "Change Image" : "Upload Image"}
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                          />
                        </label>
                        <p className="text-[11px] text-center text-muted-foreground mt-2">Recommended: 1200x630px. High-quality WebP, PNG, or JPG.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Existing Posts</h3>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">No posts found. Create your first one!</p>
          ) : (
            <div className="grid gap-4">
              {posts.map(post => (
                <Card key={post.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {post.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'Draft'}
                        </span>
                      </div>
                      <h4 className="font-bold">{post.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(post)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(post.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminBlog;
