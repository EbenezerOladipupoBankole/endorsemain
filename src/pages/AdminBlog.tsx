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
import { Loader2, Plus, Trash2, Edit2, Save, X, Eye, Upload, Image as ImageIcon } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Logo } from "@/components/Logo";

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
              <Logo className="h-12 md:h-20 w-auto" />
            </Link>
            <h1 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Blog Admin</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/blog" target="_blank"><Eye className="w-4 h-4 mr-2" /> View Public Blog</Link>
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
          <Card className="mb-10 border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader>
              <CardTitle>{currentPost.id ? "Edit Post" : "Create New Post"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      value={currentPost.title} 
                      onChange={e => setCurrentPost({...currentPost, title: e.target.value})}
                      placeholder="Post title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input 
                      id="category" 
                      value={currentPost.category} 
                      onChange={e => setCurrentPost({...currentPost, category: e.target.value})}
                      placeholder="e.g. Product Updates"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input 
                      id="author" 
                      value={currentPost.author} 
                      onChange={e => setCurrentPost({...currentPost, author: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Featured Image</Label>
                    <div className="flex items-center gap-4">
                      {currentPost.image ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                          {currentPost.image.startsWith('bg-') ? (
                            <div className={`w-full h-full ${currentPost.image}`} />
                          ) : (
                            <img src={currentPost.image} alt="Preview" className="w-full h-full object-cover" />
                          )}
                          <Button 
                            type="button"
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-0 right-0 h-6 w-6 rounded-none"
                            onClick={() => setCurrentPost({ ...currentPost, image: "" })}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
                          <ImageIcon className="w-8 h-8 text-muted-foreground opacity-20" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="cursor-pointer">
                          <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors w-fit text-sm font-medium">
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
                        <p className="text-[10px] text-muted-foreground mt-2">Recommended: 1200x630px. PNG, JPG or WebP.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt (Summary)</Label>
                  <Textarea 
                    id="excerpt" 
                    value={currentPost.excerpt} 
                    onChange={e => setCurrentPost({...currentPost, excerpt: e.target.value})}
                    placeholder="Short summary for the grid view..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content (Supports HTML/Markdown in rendering)</Label>
                  <Textarea 
                    id="content" 
                    value={currentPost.content} 
                    onChange={e => setCurrentPost({...currentPost, content: e.target.value})}
                    placeholder="Full article content..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {currentPost.id ? "Update Post" : "Publish Post"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
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
                        <Edit2 className="w-4 h-4" />
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
