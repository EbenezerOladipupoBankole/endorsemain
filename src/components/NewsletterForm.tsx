import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/components/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2 } from "lucide-react";

const EMAIL_RE = /^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/;

/**
 * Newsletter signup. Each subscriber is stored at newsletter_subscribers/{email}, so signing up
 * twice is harmless: the security rules only allow creating a new document, never overwriting one.
 */
export function NewsletterForm({ source, className = "" }: { source: string; className?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "already" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean) || clean.length > 254) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setStatus("saving");
    try {
      await setDoc(doc(db, "newsletter_subscribers", clean), {
        email: clean,
        source,
        createdAt: serverTimestamp(),
      });
      setStatus("done");
    } catch (err: any) {
      // An existing subscriber can't be overwritten, so the write is rejected — they're already on the list.
      if (err?.code === "permission-denied") {
        setStatus("already");
      } else {
        console.error("Newsletter signup failed:", err);
        setStatus("error");
        setError("Something went wrong. Please try again in a moment.");
      }
    }
  };

  if (status === "done" || status === "already") {
    return (
      <div className={`flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 ${className}`} role="status">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        {status === "done" ? "You're subscribed. Watch your inbox for our next update." : "You're already on the list — thanks!"}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={className} noValidate>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="h-12 bg-white text-base"
          aria-label="Email address"
          aria-invalid={!!error}
          disabled={status === "saving"}
        />
        <Button type="submit" disabled={status === "saving"} className="h-12 shrink-0 rounded-full bg-[#0A66C2] px-6 font-bold text-white hover:bg-[#08519c]">
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
        </Button>
      </div>
      {error && <p className="mt-2 text-left text-sm text-red-600">{error}</p>}
    </form>
  );
}
