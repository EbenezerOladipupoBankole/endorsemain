import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { db } from "@/components/client";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { Loader2, FileSignature, Calendar, User } from "lucide-react";

interface Document {
  id: string;
  name: string;
  status: string;
  invitedBy?: string;
  createdAt?: any;
}

const MyInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvitations = async () => {
      if (!user?.email) return;

      try {
        // Query for documents assigned to the current user that are pending
        const q = query(
          collection(db, "documents"),
          where("ownerEmail", "==", user.email),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Document[];

        setInvitations(docs);
      } catch (error) {
        console.error("Error fetching invitations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Logo className="h-10 w-auto" />
          <nav className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Button variant="secondary" disabled>Invitations</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container py-12 px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Invitations</h1>
        </div>

        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl bg-card/50">
            <div className="p-4 bg-secondary rounded-full mb-4">
              <FileSignature className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No pending invitations</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              You don't have any documents waiting to be signed. When someone invites you, they will appear here.
            </p>
            <Link to="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {invitations.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex flex-col bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-yellow-400/10 rounded-lg">
                      <FileSignature className="h-6 w-6 text-yellow-600" />
                    </div>
                    <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                      Action Required
                    </span>
                  </div>

                  <h3 className="font-semibold text-lg mb-1 line-clamp-1" title={doc.name}>
                    {doc.name}
                  </h3>
                  
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="mr-2 h-4 w-4 opacity-70" />
                      <span className="truncate">
                        From: <span className="font-medium text-foreground">{doc.invitedBy || "Unknown"}</span>
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4 opacity-70" />
                      <span>
                        {doc.createdAt?.seconds 
                          ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString() 
                          : "Just now"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-secondary/30 border-t border-border">
                  {/* This link assumes you have a route set up for /sign/:id */}
                  <Link to={`/sign/${doc.id}`} className="w-full">
                    <Button className="w-full bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-medium">
                      Review & Sign
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyInvitations;