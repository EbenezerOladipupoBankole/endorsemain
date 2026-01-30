import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "./client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthContext";

interface InviteUserFormProps {
  documentId: string;
}

export function InviteUserForm({ documentId }: InviteUserFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { userProfile, user } = useAuth();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    // Check if user is on a paid plan (Bypass for admin email)
    const isPro = userProfile?.plan === 'pro' || userProfile?.plan === 'business';
    const isAdmin = user?.email === 'bankoleebenezer111@gmail.com';

    if (!isPro && !isAdmin) {
      toast.error("Inviting signers is a Pro feature. Please upgrade your plan.");
      return;
    }

    setLoading(true);
    try {
      // 1. Reference the 'inviteToSign' function deployed to Firebase
      const inviteToSign = httpsCallable(functions, 'inviteToSign');

      // 2. Call the function with the document ID and email
      await inviteToSign({
        documentId: documentId,
        recipientEmail: email,
        signingLink: `${window.location.origin}/sign/${documentId}`
      });

      toast.success("Invitation sent successfully!");
      setEmail("");
    } catch (error: any) {
      console.error("Error sending invite:", error);
      // Show a friendly error message
      const message = error.message || "Failed to send invite.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleInvite} className="flex w-full max-w-sm items-center space-x-2">
      <input
        type="email"
        placeholder="recipient@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      >
        {loading ? "Sending..." : "Send Invite"}
      </button>
    </form>
  );
}