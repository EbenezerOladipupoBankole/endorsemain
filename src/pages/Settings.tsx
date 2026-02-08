import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, Shield, Zap, CreditCard, User, Lock, Smartphone, Copy, X } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, multiFactor, TotpMultiFactorGenerator, TotpSecret } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions, auth } from "@/components/client";

const Settings = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState<TotpSecret | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  const currentPlan = userProfile?.plan || "free";

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "billing" || tab === "profile" || tab === "security") {
      setActiveTab(tab);
    }

    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const reference = searchParams.get("reference");

    if (success || reference) {
      toast.success("Subscription updated successfully!");
      setSearchParams({ tab: "billing" });
    } else if (canceled) {
      toast.info("Payment cancelled.");
      setSearchParams({ tab: "billing" });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
    // Check if 2FA is already enabled
    setIs2FAEnabled(user?.multiFactor?.enrolledFactors.length > 0);
  }, [user]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, {
        displayName: displayName
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        toast.error("Incorrect current password");
      } else {
        toast.error("Failed to update password. Please check your current password.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpgrade = (plan: string) => {
    navigate(`/payment?plan=${plan.toLowerCase()}`);
  };

  const handleManageBilling = async () => {
    setIsUpgrading(true);
    try {
      // TODO: This uses Paystack, but your upgrade flow uses PayPal. You should unify these to use the same provider.
      const managePaystackSubscription = httpsCallable(functions, 'managePaystackSubscription');
      const { data }: any = await managePaystackSubscription({
        returnUrl: window.location.href,
      });
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load billing portal.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleToggle2FA = async () => {
    if (is2FAEnabled) {
      // Disable 2FA
      if (!window.confirm("Are you sure you want to disable 2FA? Your account will be less secure.")) return;
      try {
        const enrolledFactors = multiFactor(user!).enrolledFactors;
        // Unenroll all TOTP factors
        for (const factor of enrolledFactors) {
          await multiFactor(user!).unenroll(factor);
        }
        setIs2FAEnabled(false);
        toast.success("Two-Factor Authentication disabled");
      } catch (error: any) {
        console.error(error);
        toast.error("Failed to disable 2FA");
      }
    } else {
      // Enable 2FA - Start Enrollment
      try {
        const multiFactorSession = await multiFactor(user!).getSession();
        const secret = await TotpMultiFactorGenerator.generateSecret(multiFactorSession);
        setTotpSecret(secret);
        setShow2FASetup(true);
      } catch (error: any) {
        console.error(error);
        if (error.code === 'auth/requires-recent-login') {
          toast.error("Please sign out and sign in again to enable 2FA.");
        } else {
          toast.error("Failed to start 2FA setup. Ensure you have upgraded to Identity Platform in Firebase Console.");
        }
      }
    }
  };

  const handleVerifyAndEnroll = async () => {
    if (!totpSecret || !verificationCode) return;

    try {
      const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode
      );

      await multiFactor(user!).enroll(multiFactorAssertion, "Authenticator App");

      setIs2FAEnabled(true);
      setShow2FASetup(false);
      setTotpSecret(null);
      setVerificationCode("");
      toast.success("Two-Factor Authentication enabled successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Invalid verification code. Please try again.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Logo className="h-8 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
              <Link to="/settings?tab=profile" className="text-foreground">Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {user?.email}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-10 px-4 md:px-6 max-w-5xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and subscription.</p>
          </div>

          <Separator />

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              onClick={() => handleTabChange("profile")}
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button
              variant={activeTab === "security" ? "default" : "ghost"}
              onClick={() => handleTabChange("security")}
            >
              <Lock className="w-4 h-4 mr-2" />
              Security
            </Button>
            <Button
              variant={activeTab === "billing" ? "default" : "ghost"}
              onClick={() => handleTabChange("billing")}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </Button>
          </div>

          {activeTab === "profile" ? (
            <div className="grid gap-6 max-w-2xl animate-in fade-in slide-in-from-left-4 duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your account profile details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                    </div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "security" ? (
            <div className="grid gap-6 max-w-2xl animate-in fade-in slide-in-from-left-4 duration-300">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Smartphone className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-base">Authenticator App</Label>
                      <p className="text-sm text-muted-foreground">
                        Use an app like Google Authenticator to generate verification codes.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={is2FAEnabled ? "destructive" : "outline"}
                    onClick={handleToggle2FA}
                  >
                    {is2FAEnabled ? "Disable" : "Enable"}
                  </Button>
                </CardContent>
              </Card>

              {/* 2FA Setup Modal/Overlay */}
              {show2FASetup && totpSecret && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                  <Card className="w-full max-w-md relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-4"
                      onClick={() => setShow2FASetup(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <CardHeader>
                      <CardTitle>Set up Authenticator</CardTitle>
                      <CardDescription>Scan the QR code or enter the key manually in your authenticator app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-secondary rounded-lg break-all font-mono text-sm flex items-center justify-between gap-2">
                        <span>{totpSecret.secretKey}</span>
                        <Button variant="ghost" size="icon" onClick={() => copyToClipboard(totpSecret.secretKey)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <Label>Verification Code</Label>
                        <Input
                          placeholder="Enter 6-digit code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        />
                      </div>
                      <Button className="w-full" onClick={handleVerifyAndEnroll} disabled={verificationCode.length !== 6}>
                        Verify & Activate
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ) : activeTab === "billing" ? (
            <div className="grid gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Current Subscription */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Subscription</CardTitle>
                  <CardDescription>You are currently on the <span className="font-semibold capitalize text-foreground">{currentPlan}</span> plan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${currentPlan === 'business' ? 'bg-purple-100 text-purple-600' : currentPlan === 'pro' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-600'}`}>
                      {currentPlan === 'business' ? <Shield className="w-6 h-6" /> : currentPlan === 'pro' ? <Zap className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg capitalize">{currentPlan} Plan</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentPlan === 'free' ? 'Basic features for individuals.' :
                          currentPlan === 'pro' ? 'Advanced features for professionals.' :
                            'Complete solution for teams.'}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${currentPlan === 'free' ? 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80'}`}>
                        {currentPlan === 'free' ? 'Active' : 'Active Subscription'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Manage your payment details and billing history.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-base">Payment Details</Label>
                      <p className="text-sm text-muted-foreground">
                        Update your credit card or billing address via the secure portal.
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleManageBilling} disabled={isUpgrading}>
                    {isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Manage Billing"}
                  </Button>
                </CardContent>
              </Card>

              {/* Upgrade Options */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Free Plan */}
                  <Card className={`flex flex-col ${currentPlan === 'free' ? 'border-primary shadow-sm' : ''}`}>
                    <CardHeader>
                      <CardTitle>Free</CardTitle>
                      <CardDescription>For individuals starting out</CardDescription>
                      <div className="mt-2 text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 3 documents/mo</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Basic signatures</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant="outline" disabled={currentPlan === 'free'}>
                        {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Pro Plan */}
                  <Card className={`flex flex-col relative ${currentPlan === 'pro' ? 'border-[#FFC83D] shadow-md bg-yellow-50/10' : ''}`}>
                    {currentPlan === 'pro' && <div className="absolute top-0 right-0 bg-[#FFC83D] text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">CURRENT</div>}
                    <CardHeader>
                      <CardTitle>Pro</CardTitle>
                      <CardDescription>For professionals</CardDescription>
                      <div className="mt-2 text-3xl font-bold">$15<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited documents</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Invite signers</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Audit trails</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full bg-[#FFC83D] hover:bg-[#FFC83D]/90 text-black"
                        disabled={currentPlan === 'pro' || isUpgrading}
                        onClick={() => handleUpgrade('Pro')}
                      >
                        {currentPlan === 'pro' ? 'Current Plan' : isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade to Pro'}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Business Plan */}
                  <Card className={`flex flex-col ${currentPlan === 'business' ? 'border-primary shadow-md' : ''}`}>
                    <CardHeader>
                      <CardTitle>Business</CardTitle>
                      <CardDescription>For teams & organizations</CardDescription>
                      <div className="mt-2 text-3xl font-bold">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Everything in Pro</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Team management</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Custom branding</li>
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        disabled={currentPlan === 'business' || isUpgrading}
                        onClick={() => handleUpgrade('Business')}
                      >
                        {currentPlan === 'business' ? 'Current Plan' : isUpgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upgrade to Business'}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            null
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;