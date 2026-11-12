import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { httpsCallable } from "@/lib/callable";
import { db, functions } from "@/components/client";
import { collection, onSnapshot, doc, deleteDoc, query, where } from "firebase/firestore";

import { AgreementsList } from "@/components/agreements/AgreementsList";
import { TemplateStudio, AgreementTemplate } from "@/components/agreements/TemplateStudio";
import { SendAgreementModal } from "@/components/agreements/SendAgreementModal";

import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  ArrowLeft,
  Building,
  CheckCircle2,
  Clock,
  FileText,
  Send
} from "lucide-react";

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
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>("member");
  const [isInviting, setIsInviting] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [activeTeamTab, setActiveTeamTab] = useState<'agreements' | 'templates' | 'members'>('agreements');
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplateForDispatch, setSelectedTemplateForDispatch] = useState<AgreementTemplate | null>(null);

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
        name: doc.data().name || doc.data().email.split('@')[0],
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
      await inviteTeamMemberFn({ inviteEmail, role: inviteRole });
      toast.success(`Invitation sent to ${inviteEmail}!`);
      setInviteEmail("");
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to send invite: ${error.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) {
      toast.error("Please enter a team name.");
      return;
    }
    setIsCreatingTeam(true);
    try {
      const createTeamFn = httpsCallable(functions, 'createTeam');
      await createTeamFn({ teamName });
      toast.success(`Team "${teamName}" created.`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to create team: ${error.message}`);
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (window.confirm(`Remove ${member.email} from the team?`)) {
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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 font-sans flex flex-col">
      <AppHeader />

      <main className="container py-8 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="shrink-0">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border shadow-sm bg-white dark:bg-slate-900" aria-label="Return to Dashboard">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Send for Signature</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Your full sending workspace: send from a template or upload, manage everything you've sent, and invite teammates.</p>
            </div>
          </div>

          <Button
            onClick={() => {
              setSelectedTemplateForDispatch(null);
              setShowSendModal(true);
            }}
            className="bg-[#FFC83D] hover:bg-[#e6b435] text-slate-900 font-bold text-sm h-11 px-5 rounded-xl shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Send className="w-4 h-4" />
            Send a document
          </Button>
        </div>

        <div role="tablist" aria-label="Send for signature sections" className="bg-white dark:bg-slate-900 p-1 sm:p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-3 gap-1 sm:gap-2 mb-6">
          {([
            { id: 'agreements', icon: Send, label: 'Sent for signature', short: 'Sent' },
            { id: 'templates', icon: FileText, label: 'Templates', short: 'Templates' },
            { id: 'members', icon: Users, label: 'Teammates', short: 'Team' },
          ] as const).map(({ id, icon: Icon, label, short }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTeamTab === id}
              onClick={() => setActiveTeamTab(id)}
              className={`min-w-0 min-h-[44px] py-2.5 px-1 sm:px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-1 sm:gap-2 transition-all ${
                activeTeamTab === id
                  ? 'bg-[#0A66C2] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate sm:hidden">{short}</span>
              <span className="truncate hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTeamTab === 'agreements' && (
            <AgreementsList
              onOpenTemplateStudio={() => setActiveTeamTab('templates')}
              onOpenSendModal={() => {
                setSelectedTemplateForDispatch(null);
                setShowSendModal(true);
              }}
            />
          )}

          {activeTeamTab === 'templates' && (
            <TemplateStudio
              onSelectTemplateToDispatch={(tpl) => {
                setSelectedTemplateForDispatch(tpl);
                setShowSendModal(true);
              }}
            />
          )}

          {activeTeamTab === 'members' && (
            <div className="space-y-6">
              {!userProfile?.teamId ? (
                <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Create a team</CardTitle>
                    <CardDescription className="text-sm">Give your team a name, then invite the people you work with.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex-1 w-full space-y-2">
                        <Label htmlFor="team-name" className="sr-only">Team Name</Label>
                        <Input
                          id="team-name"
                          type="text"
                          placeholder="Team or company name"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          required
                          className="h-11 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm"
                        />
                      </div>
                      <Button type="submit" disabled={isCreatingTeam} className="h-11 w-full sm:w-auto rounded-xl font-bold px-6 bg-[#0A66C2] hover:bg-[#08519c] text-white">
                        {isCreatingTeam ? "Creating..." : "Create Team"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
              <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Invite a teammate</CardTitle>
                  <CardDescription className="text-sm">We'll email them an invitation to join your team.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInviteMember} className="flex flex-col md:flex-row items-stretch md:items-end gap-4">
                    <div className="flex-1 space-y-2 text-left">
                      <Label htmlFor="invite-email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="teammate@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          className="h-11 pl-10 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm text-sm"
                        />
                      </div>
                    </div>
                    <div className="w-full md:w-44 space-y-2 text-left">
                      <Label htmlFor="invite-role" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role</Label>
                      <select
                        id="invite-role"
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <Button type="submit" disabled={isInviting} className="rounded-xl font-bold h-11 px-6 shrink-0 shadow-md bg-[#0A66C2] hover:bg-[#08519c] text-white">
                      {isInviting ? "Sending..." : "Send invite"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                    Teammates {!loadingMembers && <span className="font-medium text-muted-foreground">({teamMembers.length})</span>}
                  </CardTitle>
                  <CardDescription className="text-sm">Everyone on the team, plus invitations that haven't been accepted yet.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  {loadingMembers ? (
                    <div className="flex flex-col items-center justify-center h-32 gap-2">
                      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-muted-foreground font-semibold">Loading teammates...</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {teamMembers.map(member => {
                        const isPending = member.role === "pending";
                        const isAdminRole = member.role === "admin";
                        const initials = member.name
                          ? member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : member.email[0].toUpperCase();

                        return (
                          <div key={member.id} className="flex items-center justify-between py-4 px-4 sm:px-0 transition-colors">
                            <div className="flex items-center gap-4 text-left min-w-0">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm text-primary shrink-0 overflow-hidden shadow-inner">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
                                  {isPending ? "Invited" : member.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${
                                isAdminRole 
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50' 
                                  : isPending 
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
                              }`}>
                                {isPending ? <Clock className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                {isPending ? "Pending" : isAdminRole ? "Admin" : "Member"}
                              </span>

                              {user?.email !== member.email && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-10 w-10 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-full" 
                                  onClick={() => handleRemoveMember(member)}
                                  aria-label={`Remove member ${member.email}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
        </div>
      </main>

      {/* Send for signature modal */}
      {showSendModal && (
        <SendAgreementModal
          template={selectedTemplateForDispatch}
          onClose={() => {
            setShowSendModal(false);
            setSelectedTemplateForDispatch(null);
          }}
          onSuccess={() => {
            setActiveTeamTab('agreements');
          }}
        />
      )}
    </div>
  );
};

export default Team;