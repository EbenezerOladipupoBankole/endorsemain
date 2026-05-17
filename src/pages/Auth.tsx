import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
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

  const handleAppleSignIn = async () => {
    toast.info("Apple Sign In coming soon!");
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[32px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-slate-100 p-8 md:p-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[32px] font-bold text-[#1e293b] mb-2 tracking-tight">
              {isSignUp ? "Create Account" : "Account"}
            </h1>
            <p className="text-slate-500 text-[15px]">
              {isSignUp 
                ? "Enter your details to create your account" 
                : "Enter your email and password to log in"}
            </p>
          </div>

          {/* Form Content */}
          {mode === "resetPassword" && oobCode ? (
            <form onSubmit={handleConfirmReset} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-[56px] rounded-2xl bg-slate-50 border-none px-4 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-[56px] rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-lg transition-all shadow-lg shadow-blue-500/20" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Save New Password"}
              </Button>
            </form>
          ) : mfaRequired ? (
            <form onSubmit={handleMfaVerify} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-[15px] font-medium text-slate-700">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-[56px] rounded-2xl bg-slate-50 border-none px-4 text-center text-2xl tracking-[12px] font-bold focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full h-[56px] rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-lg transition-all shadow-lg shadow-blue-500/20" disabled={loading || verificationCode.length !== 6}>
                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Verify"}
              </Button>
              <button
                type="button"
                className="w-full text-slate-500 font-medium hover:text-slate-800 transition-colors py-2"
                onClick={() => { setMfaRequired(false); setVerificationCode(""); }}
              >
                Back to Login
              </button>
            </form>
          ) : needsVerification ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Verify Email</h3>
              <p className="text-slate-500 text-[15px] leading-relaxed">
                We've sent a link to <span className="font-semibold text-slate-900">{email}</span>. Please click it to continue.
              </p>
              <div className="space-y-3">
                <Button onClick={handleRefreshStatus} disabled={loading} className="w-full h-[56px] rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold shadow-lg shadow-blue-500/20">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "I've Verified My Email"}
                </Button>
                <Button onClick={handleResendVerification} disabled={loading} variant="ghost" className="w-full h-[56px] rounded-2xl text-slate-600 font-medium hover:bg-slate-50">
                  Resend Verification
                </Button>
              </div>
            </div>
          ) : forgotPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-[15px] font-medium text-slate-700">Work Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[56px] rounded-2xl bg-slate-50 border-none px-4 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-[56px] rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-lg shadow-lg shadow-blue-500/20" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
              </Button>
              <button
                type="button"
                onClick={() => setForgotPassword(false)}
                className="w-full text-slate-500 font-medium hover:text-slate-800 transition-colors py-2"
              >
                Back to Login
              </button>
            </form>
          ) : (
            <>
              {/* Main Auth Form */}
              <form onSubmit={handleEmailAuth} className="space-y-5">
                {isSignUp && (
                  <div className="space-y-2">
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-[56px] rounded-2xl bg-slate-50 border-none px-4 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                      required={isSignUp}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Loisbecket@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-[56px] rounded-2xl bg-slate-50 border-none px-4 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="*******"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-[56px] rounded-2xl bg-slate-50 border-none px-4 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all"
                    />
                    <label htmlFor="remember" className="text-[14px] text-slate-500 cursor-pointer select-none">
                      Remember me
                    </label>
                  </div>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setForgotPassword(true)}
                      className="text-[14px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot Password ?
                    </button>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-[56px] rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-lg transition-all shadow-lg shadow-blue-500/20 mt-2" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    isSignUp ? "Sign Up" : "Log In"
                  )}
                </Button>
              </form>

              {/* Security Check (Preserved but styled more subtly) */}
              {!isSignUp && (
                <div className="mt-4 flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    id="security-check"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="security-check" className="text-xs text-slate-400">
                    I agree to the Terms of Service.
                  </label>
                </div>
              )}

              {/* Separator */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-slate-400">Or</span>
                </div>
              </div>

              {/* Social Logins */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-[56px] rounded-2xl bg-white border border-slate-100 flex items-center justify-center gap-3 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={loading}
                  className="w-full h-[56px] rounded-2xl bg-white border border-slate-100 flex items-center justify-center gap-3 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05 1.79-3.48 1.79-1.42 0-1.89-.88-3.56-.88-1.68 0-2.2.85-3.51.88-1.33.03-2.52-.94-3.52-1.93-2.03-2.02-3.58-5.71-3.58-8.94 0-3.21 1.63-5.22 4.04-5.25 1.25-.01 2.24.77 3.01.77.74 0 1.95-.92 3.44-.79 1.54.06 2.7.63 3.47 1.75-2.85 1.71-2.4 5.37.47 6.64-.67 1.73-1.54 3.45-2.84 4.76zm-3.08-16.14c.67-.81 1.12-1.94.99-3.06-1.01.04-2.24.67-2.96 1.51-.65.75-1.22 1.9-.1 3.03.11.02.21.03.31.03 1.05-.01 2.09-.69 1.76-1.51z"/>
                  </svg>
                  Continue with Apple
                </button>
              </div>

              {/* Footer */}
              <div className="mt-10 text-center">
                <p className="text-slate-500 text-[15px]">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-[#3b82f6] font-bold hover:underline transition-all"
                  >
                    {isSignUp ? "Log In" : "Sign Up"}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
