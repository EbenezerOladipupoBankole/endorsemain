import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Trash2, PenTool } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/components/client";
import { collection, onSnapshot, doc, deleteDoc, query, where } from "firebase/firestore";

interface TeamMember {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'pending';
  name?: string;
}

const Team = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    console.log("Team Management Module Loaded - v1.1");
  }, []);

  useEffect(() => {
    if (userProfile?.teamId) {
      setActiveTeamId(userProfile.teamId);
    }
  }, [userProfile?.teamId]);

  useEffect(() => {
    const teamId = activeTeamId;
    if (!teamId) {
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);
    let activeMembers: TeamMember[] = [];
    let pendingMembers: TeamMember[] = [];

    const updateCombined = () => {
      setTeamMembers([...activeMembers, ...pendingMembers]);
    };

    const membersRef = collection(db, 'teams', teamId, 'members');
    const unsubMembers = onSnapshot(query(membersRef), (snapshot) => {
      activeMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().email,
        ...doc.data(),
      } as TeamMember));
      updateCombined();
      setLoadingMembers(false);
    });

    const invitesRef = collection(db, 'invites');
    const unsubInvites = onSnapshot(query(invitesRef, where('teamId', '==', teamId), where('status', '==', 'pending')), (snapshot) => {
      pendingMembers = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().toEmail,
        role: 'pending',
        name: 'Pending Invitation',
      } as TeamMember));
      updateCombined();
    });

    return () => {
      unsubMembers();
      unsubInvites();
    };
  }, [activeTeamId]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToInvite = inviteEmail.trim();

    if (!emailToInvite) {
      toast.error("Please enter an email address to invite.");
      return;
    }

    if (!emailToInvite.includes('@')) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsInviting(true);
    try {
      const inviteTeamMemberFn = httpsCallable(functions, 'requestTeamInvite');
      const result = await inviteTeamMemberFn({ 
        inviteEmail: emailToInvite, 
        role: 'member'
      });
      const data = result.data as any;

      if (data.success) {
        // Update userProfile with the teamId returned from backend
        if (data.teamId && userProfile) {
          userProfile.teamId = data.teamId;
          setActiveTeamId(data.teamId);
        }
        toast.success(`Invitation sent to ${emailToInvite}!`);
        setInviteEmail("");
      } else {
        toast.error(`Invite Failed: ${data.error || "Please check your plan or try again."}`);
      }
    } catch (error: any) {
      console.error("Invite error details:", error);
      console.error("Error code:", error?.code);
      console.error("Error message:", error?.message);
      
      const code = error?.code || "";
      const message = error?.message || "Unknown error";
      
      if (code.includes("unauthenticated")) {
        toast.error("Your session has expired. Please refresh the page and sign in again.");
      } else if (code.includes("permission-denied")) {
        toast.error(message || "Only Business plan users can invite team members. Please upgrade your plan.");
      } else if (code.includes("invalid-argument")) {
        toast.error(message || "Invalid input. Please check the email address and try again.");
      } else if (code === "not-found" || code === "5") {
        // Distinguish between actual logic errors (which might throw internal) and function missing
        toast.error("The invite service is not reachable. Please verify your internet connection or check if the backend is deployed correctly.");
      } else if (code.includes("internal")) {
        // Backend threw an explicit error (like database config or email failure)
        toast.error(message || "Server error occurred while sending invite.");
      } else {
        toast.error(`Failed to send invite: ${message || "Please try again."}`);
      }
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (window.confirm(`Are you sure you want to remove ${member.email}?`)) {
      const toastId = toast.loading("Removing member...");
      try {
        if (member.role === 'pending') {
          await deleteDoc(doc(db, 'invites', member.id));
        } else {
          if (!activeTeamId) {
            throw new Error("Team ID not found. Please refresh the page and try again.");
          }
          const removeTeamMemberFn = httpsCallable(functions, 'removeTeamMember');
          await removeTeamMemberFn({ teamId: activeTeamId, memberId: member.id });
        }
        toast.success("Member removed.", { id: toastId });
      } catch (error: any) {
        toast.error(`Failed to remove member: ${error.message}`, { id: toastId });
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Logo className="h-8 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
              <Link to="/team" className="text-foreground">Team Management</Link>
              <Link to="/settings?tab=profile" className="text-muted-foreground hover:text-foreground">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {user?.email}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-10 px-4 md:px-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">Invite and manage your team members.</p>
          </div>

          <Separator />

          {/* Invite Members */}
          <Card>
            <CardHeader>
              <CardTitle>Invite New Member</CardTitle>
              <CardDescription>Enter the email of the person you want to add to your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteMember} className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="invite-email" className="sr-only">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isInviting}>
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Send Invite
                </Button>
              </form>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowEmailPreview(!showEmailPreview)} className="text-xs font-semibold text-primary hover:bg-primary/5">
                  {showEmailPreview ? "Hide Invite Preview" : "View Invitation Email Design"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Preview Section */}
          {showEmailPreview && (
            <Card className="border-primary/20 bg-muted/5 animate-in fade-in slide-in-from-top-2 duration-300">
              <CardHeader className="p-6 pb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-lg">
                    <PenTool className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider opacity-60">Professional Invitation Design</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 md:p-10">
                <div className="max-w-[600px] mx-auto bg-white rounded-[24px] overflow-hidden shadow-2xl border border-border/50 text-slate-800 pointer-events-none select-none origin-top scale-[0.85] md:scale-100">
                  <div className="bg-[#1a1f2c] p-12 text-center">
                    <Logo className="h-14 w-auto mx-auto" />
                    <p className="text-[#94a3b8] text-[10px] mt-3 font-bold tracking-[0.2em] uppercase">Team Workspace</p>
                  </div>
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto mb-6 flex items-center justify-center border border-border/40">
                      <UserPlus className="w-8 h-8 text-slate-900" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">You've been invited!</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                      <strong>{user?.email}</strong> has requested for you to join their official team
                      <span className="block mt-4 font-bold text-blue-600 bg-blue-50/50 px-5 py-3 rounded-xl border border-blue-100/50 inline-block font-sans">
                        {userProfile?.fullName || 'Ebenezer'}'s Team
                      </span>
                    </p>
                    <div className="bg-[#FFC83D] text-black font-bold px-10 py-4 rounded-2xl inline-block shadow-xl shadow-primary/20">
                      Accept Invitation
                    </div>
                    <p className="text-xs text-slate-400 mt-8">
                      New to Endorse? Please use this email address <br /> when creating your account.
                    </p>
                  </div>
                  <div className="bg-slate-50 p-8 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider font-bold">
                      © {new Date().getFullYear()} ENDORSE TECHNOLOGIES. ALL RIGHTS RESERVED.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>A list of people in your organization.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <div className="flex justify-center items-center h-24">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-muted-foreground">
                          {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || member.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${member.role === 'admin' ? 'bg-primary/10 text-primary' :
                          member.role === 'member' ? 'bg-slate-100 text-slate-600' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                          {member.role}
                        </span>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMember(member)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Team;