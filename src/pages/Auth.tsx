import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { httpsCallable } from "firebase/functions";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  getMultiFactorResolver,
  TotpMultiFactorGenerator,
  MultiFactorError,
  confirmPasswordReset,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, functions } from "@/components/client";
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
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const inviteToken = searchParams.get('inviteToken');

  // Check for Firebase Auth Action parameters (Reset Password)
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    // If we have an oobCode, we are performing an action (like resetting password)
    // Do NOT redirect to dashboard even if user is logged in
    if (oobCode && mode === "resetPassword") {
      // If someone is already logged in, sign them out so they can reset properly
      if (user) {
        auth.signOut();
      }
      return;
    }

    if (user && user.emailVerified) {
      if (inviteToken && !userProfile?.teamId) {
        const acceptInvite = httpsCallable(functions, 'acceptTeamInvite');
        toast.promise(acceptInvite({ token: inviteToken }), {
          loading: 'Joining team...',
          success: (res: any) => {
            return res.data.message || 'Successfully joined team! Redirecting...';
          },
          error: (err) => `Failed to join team: ${err.message}`,
        }).finally(() => {
          // Use a short delay to allow user to see the toast before reload
          setTimeout(() => window.location.href = "/team", 1500);
        });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [user, userProfile, navigate, from, inviteToken, oobCode, mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setNeedsVerification(true);
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setNeedsVerification(true);
          toast.info("Please verify your email before continuing.");
        } else {
          toast.success("Welcome back!");
          navigate("/dashboard");
        }
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

  const handleResendVerification = async () => {
    if (auth.currentUser) {
      setLoading(true);
      try {
        await sendEmailVerification(auth.currentUser);
        toast.success("Verification email resent!");
      } catch (error: any) {
        toast.error(error.message || "Failed to resend email.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success("Password has been reset! You can now sign in.");
      await auth.signOut(); // Clear old session to prevent auto-redirect
      setIsResetting(false);
      setForgotPassword(false);
      setIsSignUp(false); // Switch to sign in mode
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (auth.currentUser) {
      setLoading(true);
      try {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          toast.success("Email verified! Redirecting...");
          navigate("/dashboard");
        } else {
          toast.info("Email not verified yet. Please check your inbox.");
        }
      } catch (error: any) {
        toast.error("Failed to refresh status.");
      } finally {
        setLoading(false);
      }
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
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1f2c] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo className="h-12 md:h-20 w-auto brightness-0 invert" />
          </Link>

          <div className="space-y-6">
            <h1 className="font-display text-4xl font-bold text-white leading-tight">
              Sign documents<br />with confidence
            </h1>
            <p className="text-white/80 text-lg max-w-md leading-relaxed">
              Join thousands of businesses who trust Endorse for secure,
              legally binding electronic signatures.
            </p>
          </div>

          <p className="text-white/60 text-sm">
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

          {/* Form Header */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              {mode === "resetPassword" && oobCode ? "Set New Password" : mfaRequired ? "Two-Factor Authentication" : needsVerification ? "Verify Email" : isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "resetPassword" && oobCode
                ? "Enter your new password below to regain access to your account."
                : mfaRequired ? "Enter the 6-digit code from your authenticator app"
                  : needsVerification
                    ? "Check your inbox to activate your account"
                    : isSignUp
                      ? "Start your free 14-day trial today"
                      : "Sign in to continue to your dashboard"
              }
            </p>
          </div>

          {/* New Password Form (Action Handler) */}
          {mode === "resetPassword" && oobCode ? (
            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
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
              <Button type="submit" className="w-full h-11 bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black border-none" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save New Password"}
              </Button>
            </form>
          ) : mfaRequired ? (
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
              <Button type="submit" variant="hero" className="w-full h-11 font-medium bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black border-none" disabled={loading || verificationCode.length !== 6}>
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
          ) : needsVerification ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white border border-slate-200/60 p-8 md:p-10 rounded-3xl text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FFC83D]/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#FFC83D] to-[#ffda75] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#FFC83D]/30 border-4 border-white">
                    <Mail className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-3xl font-display font-bold text-slate-900 mb-3">Welcome to Endorse! 🎉</h3>
                  <p className="text-slate-600 mb-8 text-base leading-relaxed">
                    We're thrilled to have you on board. We've sent a verification link to <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{email}</span>.
                    Just click the link to activate your account and start signing.
                  </p>
                  <div className="space-y-4">
                    <Button
                      onClick={handleRefreshStatus}
                      disabled={loading}
                      className="w-full h-12 bg-black hover:bg-slate-800 text-white font-bold rounded-xl text-base shadow-md transition-all"
                    >
                      {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "I've Verified My Email"}
                    </Button>
                    <Button
                      onClick={handleResendVerification}
                      disabled={loading}
                      variant="outline"
                      className="w-full h-12 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl"
                    >
                      {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Resend Verification Email"}
                    </Button>
                    <button
                      onClick={() => {
                        setNeedsVerification(false);
                        auth.signOut();
                      }}
                      className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors pt-2 block mx-auto"
                    >
                      Use a different account
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-slate-400 font-medium">
                Can't find the email? Don't forget to check your spam folder.
              </p>
            </div>
          ) : forgotPassword ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {resetSent ? (
                <div className="bg-white border border-slate-200/60 p-8 rounded-3xl text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-transparent" />
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-white shadow-sm">
                      <Mail className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Check your inbox</h3>
                    <p className="text-slate-600 mb-8 text-sm leading-relaxed">
                      We've sent a secure recovery link to <br/><span className="font-semibold text-slate-900">{email}</span>.
                    </p>

                    <Button
                      onClick={() => window.open('https://mail.google.com', '_blank')}
                      className="w-full h-12 bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-bold mb-4 shadow-md border-none rounded-xl"
                    >
                      Open Email App
                    </Button>
                    <Button
                      onClick={() => { setForgotPassword(false); setResetSent(false); }}
                      variant="ghost"
                      className="w-full h-12 text-slate-500 hover:text-slate-900 font-bold rounded-xl"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="bg-white border border-slate-200/60 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                  <div className="mb-6">
                    <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">Reset Password</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">Enter your email and we'll send you a secure link to reset your credentials.</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-bold text-slate-700">Work Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-12 bg-slate-50/50 border-slate-200 rounded-xl"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full h-12 bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black font-bold border-none rounded-xl shadow-md" disabled={loading}>
                      {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Send Recovery Link"}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setForgotPassword(false)}
                      className="w-full text-center text-sm text-slate-400 hover:text-slate-700 font-bold transition-colors pt-2"
                    >
                      Wait, I remember my password
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <>
              {/* Security Check */}
              <div className="mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      id="security-check"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                  <label htmlFor="security-check" className="text-sm text-slate-600 cursor-pointer select-none">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Security & Compliance
                    </span>
                    I confirm I'm authorized to use this system and agree to the Terms of Service.
                  </label>
                </div>
              </div>

              {/* Google Sign In */}
              <Button
                variant="outline"
                className="w-full h-12 mb-8 font-semibold border-slate-200 hover:bg-slate-50 shadow-sm"
                onClick={handleGoogleSignIn}
                disabled={loading || !agreedToTerms}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Or email</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-5">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-bold text-slate-700">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Your Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 h-12 bg-slate-50/50 border-slate-200"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700">Work Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-slate-50/50 border-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" name="Password" className="text-sm font-bold text-slate-700">Password</Label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => setForgotPassword(true)}
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-slate-50/50 border-slate-200"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-bold bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black border-none shadow-md shadow-[#FFC83D]/20 mt-2" disabled={loading || !agreedToTerms}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Preparing...
                    </div>
                  ) : (
                    isSignUp ? "Create My Account" : "Sign In to Endorse"
                  )}
                </Button>
              </form>

              {/* Toggle Sign Up / Sign In */}
              <p className="text-center text-slate-500 mt-8 text-sm">
                {isSignUp ? "Already a member?" : "New to Endorse?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-primary hover:text-primary/80 font-bold underline decoration-2 underline-offset-4"
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
