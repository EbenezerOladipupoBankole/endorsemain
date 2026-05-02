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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, Save, Eye, Video, Youtube } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Logo } from "@/components/Logo";

interface Tutorial {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
  createdAt: any;
}

const AdminHelpCenter = () => {
  const { user, isAdmin } = useAuth();



  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<Partial<Tutorial>>({
    title: "",
    description: "",
    youtubeId: "",
    category: "Getting Started",
  });

  useEffect(() => {
    if (isAdmin) {
      fetchTutorials();
    }
  }, [isAdmin]);

  const fetchTutorials = async () => {
    try {
      const q = query(collection(db, "tutorials"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetched = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Tutorial[];
      setTutorials(fetched);
    } catch (error) {
      console.error("Error fetching tutorials:", error);
      toast.error("Failed to load tutorials");
    } finally {
      setLoading(false);
    }
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTutorial.title || !currentTutorial.youtubeId) {
      toast.error("Please fill in title and YouTube ID/Link");
      return;
    }

    setSubmitting(true);
    try {
      const youtubeId = extractYoutubeId(currentTutorial.youtubeId!);
      const data = {
        ...currentTutorial,
        youtubeId,
        updatedAt: serverTimestamp(),
      };

      if (currentTutorial.id) {
        await updateDoc(doc(db, "tutorials", currentTutorial.id), data);
        toast.success("Tutorial updated");
      } else {
        await addDoc(collection(db, "tutorials"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast.success("Tutorial published");
      }

      setIsEditing(false);
      setCurrentTutorial({
        title: "",
        description: "",
        youtubeId: "",
        category: "Getting Started",
      });
      fetchTutorials();
    } catch (error) {
      console.error("Error saving tutorial:", error);
      toast.error("Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this tutorial?")) {
      try {
        await deleteDoc(doc(db, "tutorials", id));
        toast.success("Deleted");
        fetchTutorials();
      } catch (error) {
        toast.error("Delete failed");
      }
    }
  };

  if (!isAdmin) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard"><Logo className="h-12 md:h-20 w-auto" /></Link>
            <h1 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Help Center Admin</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/help-center" target="_blank"><Eye className="w-4 h-4 mr-2" /> Preview Help Center</Link>
          </Button>
        </div>
      </header>

      <main className="container py-10 px-4 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Tutorial Management</h2>
            <p className="text-muted-foreground">Post YouTube demos and masterclass videos.</p>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Tutorial
            </Button>
          )}
        </div>

        {isEditing && (
          <Card className="mb-10 border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader>
              <CardTitle>{currentTutorial.id ? "Edit Tutorial" : "New Video Tutorial"}</CardTitle>
              <CardDescription>Enter a YouTube link or ID and we'll handle the embedding.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Tutorial Title</Label>
                    <Input 
                      id="title" 
                      value={currentTutorial.title} 
                      onChange={e => setCurrentTutorial({...currentTutorial, title: e.target.value})}
                      placeholder="How to use Endorse..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={currentTutorial.category} 
                      onValueChange={v => setCurrentTutorial({...currentTutorial, category: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Getting Started">Getting Started</SelectItem>
                        <SelectItem value="Signatures & Documents">Signatures & Documents</SelectItem>
                        <SelectItem value="Account & Billing">Account & Billing</SelectItem>
                        <SelectItem value="Advanced Features">Advanced Features</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="youtubeId">YouTube Video Link or ID</Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="youtubeId" 
                      className="pl-10"
                      value={currentTutorial.youtubeId} 
                      onChange={e => setCurrentTutorial({...currentTutorial, youtubeId: e.target.value})}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={currentTutorial.description} 
                    onChange={e => setCurrentTutorial({...currentTutorial, description: e.target.value})}
                    placeholder="What will users learn in this video?"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting} className="bg-[#FFC83D] text-black hover:bg-[#FFC83D]/90">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {currentTutorial.id ? "Update Tutorial" : "Publish Tutorial"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : tutorials.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed">No tutorials yet.</p>
          ) : (
            tutorials.map(t => (
              <Card key={t.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-48 aspect-video bg-black flex items-center justify-center shrink-0">
                    <img 
                        src={`https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`} 
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {t.category}
                        </span>
                      </div>
                      <h4 className="font-bold">{t.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => {setCurrentTutorial(t); setIsEditing(true); window.scrollTo(0,0);}}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminHelpCenter;
