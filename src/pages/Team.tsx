import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
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
  const { user, userProfile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const teamId = userProfile?.teamId;
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
  }, [userProfile?.teamId]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error("Please enter an email address to invite.");
      return;
    }
    setIsInviting(true);
    try {
      const inviteTeamMemberFn = httpsCallable(functions, 'inviteTeamMember');
      await inviteTeamMemberFn({ inviteEmail, role: 'member' });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to send invite: ${error.message}`);
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
          if (!userProfile?.teamId) throw new Error("Team ID not found on profile.");
          const removeTeamMemberFn = httpsCallable(functions, 'removeTeamMember');
          await removeTeamMemberFn({ teamId: userProfile.teamId, memberId: member.id });
        }
        toast.success("Member removed.", { id: toastId });
      } catch (error: any) {
        toast.error(`Failed to remove member: ${error.message}`, { id: toastId });
      }
    }
  };
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
            </CardContent>
          </Card>

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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          member.role === 'admin' ? 'bg-primary/10 text-primary' :
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