import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/components/client";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage("Invalid invitation link. No token provided.");
    }
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      toast.error("You must be logged in to accept an invite.");
      navigate("/auth", { state: { from: location } });
      return;
    }
    
    setStatus('processing');
    try {
      const acceptFn = httpsCallable(functions, 'acceptTeamInvite');
      const result = await acceptFn({ token });
      const data = result.data as any;
      
      if (data.success) {
        setStatus('success');
        toast.success("You have successfully joined the team!");
        // Automatically redirect after a short delay
        setTimeout(() => navigate("/team"), 2000);
      } else {
        throw new Error(data.message || "Failed to join team.");
      }
    } catch (error: any) {
      console.error("Accept invite error:", error);
      setStatus('error');
      
      let msg = error.message || "An error occurred.";
      if (error.code === 'not-found' || msg.includes("not-found")) {
        msg = "Invitation not found. It may be invalid, expired, or sent to a different email address than the one you are logged in with.";
      } else if (error.code === 'already-exists' || msg.includes("already-exists")) {
        msg = "You have already accepted this invitation.";
      } else if (error.code === 'unauthenticated') {
        msg = "You must be logged in to accept this invitation.";
      }
      
      setErrorMessage(msg);
    }
  };

  if (authLoading) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, show prompt
  if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle>Sign In Required</CardTitle>
                    <CardDescription>Please sign in to accept this team invitation.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => navigate("/auth", { state: { from: location } })} className="w-full">
                        Go to Login
                    </Button>
                    <p className="text-xs text-center mt-4 text-muted-foreground">
                        Note: You must sign in with the email address the invite was sent to.
                    </p>
                </CardContent>
            </Card>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>You've been invited to join a team on Endorse.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === 'idle' && (
            <div className="space-y-4">
               <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                 <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Logged in as</p>
                 <p className="text-sm font-medium">{user.email}</p>
               </div>
               <Button onClick={handleAccept} className="w-full" size="lg">
                 Join Team
               </Button>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center py-6">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground font-medium">Processing your invitation...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center py-4 space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Welcome aboard!</h3>
                <p className="text-muted-foreground">You are now a member of the team.</p>
              </div>
              <Button onClick={() => navigate("/team")} className="w-full">
                Go to Team Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-4 space-y-4 animate-in fade-in zoom-in duration-300">
               <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-destructive">Invitation Failed</h3>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">{errorMessage}</p>
              </div>
              <Button variant="outline" onClick={() => navigate("/dashboard")} className="w-full">
                Return to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;