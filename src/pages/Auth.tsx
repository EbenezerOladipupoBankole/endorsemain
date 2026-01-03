import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  MultiFactorError
} from "firebase/auth";
import { auth } from "@/components/client";
import { useAuth } from "@/components/AuthContext";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Note: Firebase doesn't store full_name on sign-up directly like this.
        // This is typically done by creating a user document in Firestore.
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error.code === 'auth/multi-factor-auth-required') {
        setMfaRequired(true);
        setMfaResolver(getMultiFactorResolver(auth, error as MultiFactorError));
        toast.info("Two-factor authentication required.");
      } else {
        toast.error(error.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (error: any) {
      if (error.code === 'auth/multi-factor-auth-required') {
        setMfaRequired(true);
        setMfaResolver(getMultiFactorResolver(auth, error as MultiFactorError));
        toast.info("Two-factor authentication required.");
      } else {
        toast.error(error.message || "Failed to sign in with Google");
      }
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const hint = mfaResolver.hints[0];
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(
        hint.uid,
        verificationCode
      );
      
      await mfaResolver.resolveSignIn(assertion);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error("Invalid verification code.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-10 w-auto brightness-0 invert" />
          </Link>
          
          <div className="space-y-6">
            <h1 className="font-display text-4xl font-bold text-primary-foreground leading-tight">
              Sign documents<br />with confidence
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-md leading-relaxed">
              Join over 50,000 professionals who trust Endorse for secure, 
              legally binding electronic signatures.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-primary-foreground/30 border-2 border-primary-foreground/50 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-foreground/70" />
                  </div>
                ))}
              </div>
              <p className="text-primary-foreground/80 text-sm">
                <span className="font-semibold text-primary-foreground">4.9/5</span> from 2,000+ reviews
              </p>
            </div>
          </div>

          <p className="text-primary-foreground/60 text-sm">
            © 2025 Endorse. Enterprise-grade security.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Back Button */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <Logo className="h-10 w-auto" />
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              {mfaRequired ? "Two-Factor Authentication" : isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-muted-foreground">
              {mfaRequired
                ? "Enter the 6-digit code from your authenticator app"
                : isSignUp 
                ? "Start your free 14-day trial today" 
                : "Sign in to continue to your dashboard"
              }
            </p>
          </div>

          {/* MFA Form */}
          {mfaRequired ? (
            <form onSubmit={handleMfaVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">Verification Code</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 h-11 tracking-widest"
                    autoFocus
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="hero" className="w-full h-11 font-medium" disabled={loading || verificationCode.length !== 6}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Verify"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full" 
                onClick={() => { setMfaRequired(false); setVerificationCode(""); }}
              >
                Back to Login
              </Button>
            </form>
          ) : (
          <>
          {/* Security Check */}
          <div className="mb-6 bg-secondary/30 p-4 rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <input
                  type="checkbox"
                  id="security-check"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary cursor-pointer accent-primary"
                />
              </div>
              <label htmlFor="security-check" className="text-sm text-muted-foreground cursor-pointer select-none">
                <span className="font-medium text-foreground flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Security Check
                </span>
                I confirm I am authorized to access this system and agree to the Terms of Service.
              </label>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full h-11 mb-6 font-medium"
            onClick={handleGoogleSignIn}
            disabled={loading || !agreedToTerms}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full h-11 font-medium" disabled={loading || !agreedToTerms}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </Button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <p className="text-center text-muted-foreground mt-6 text-sm">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? "Sign in" : "Sign up for free"}
            </button>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
