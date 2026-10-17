import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, multiFactor, TotpMultiFactorGenerator, TotpSecret } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions, auth, db, storage } from "@/components/client";
import { setDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  User,
  Lock,
  Shield,
  Users,
  Palette,
  UploadCloud,
  Check,
  CheckCircle2,
  Copy,
  ArrowLeft,
  Building,
  Camera,
  Trash2,
  AlertTriangle,
  CreditCard,
  PenTool,
  X
} from "lucide-react";

const Settings = () => {
  const { user, userProfile, isAdmin, loading } = useAuth();
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
  const [primaryColor, setPrimaryColor] = useState(userProfile?.branding?.primaryColor || "#000000");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState(user?.photoURL || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPlan = isAdmin ? 'business' : (userProfile?.plan || "free");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "billing") {
      handleTabChange("profile");
      return;
    }
    if (["profile", "security", "team", "branding"].includes(tab as string)) {
      setActiveTab(tab as string);
    }

    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const reference = searchParams.get("reference");

    if (success || reference) {
      toast.success("Subscription updated successfully! Refreshing page...");
      navigate('/settings?tab=profile', { replace: true });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else if (canceled) {
      toast.info("Payment cancelled.");
      navigate('/settings?tab=profile', { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
    if (user?.photoURL) {
      setPhotoUrl(user.photoURL);
    }
    // Check if 2FA is already enabled. multiFactor() throws if the user object isn't a full
    // Firebase user (e.g. while auth is still restoring), so never let it take the page down.
    try {
      setIs2FAEnabled(user ? multiFactor(user).enrolledFactors.length > 0 : false);
    } catch (error) {
      console.warn("Could not read 2FA status:", error);
      setIs2FAEnabled(false);
    }

    // Set branding from profile
    if (userProfile?.branding) {
      if (userProfile.branding.primaryColor) {
        setPrimaryColor(userProfile.branding.primaryColor);
      }
    }
  }, [user, userProfile]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setPhotoFile(file);
    setIsUploadingPhoto(true);
    const toastId = toast.loading("Uploading profile image...");
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setPhotoUrl(url);
      await updateProfile(user, { photoURL: url });
      toast.success("Profile image updated!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload profile image", { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
    }
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

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingBranding(true);

    try {
      let logoUrl = userProfile?.branding?.logoUrl;

      if (logoFile) {
        toast.loading("Uploading logo...", { id: "uploading-logo" });
        const storageRef = ref(storage, `logos/${user.uid}/${logoFile.name}`);
        await uploadBytes(storageRef, logoFile);
        logoUrl = await getDownloadURL(storageRef);
        toast.success("Logo uploaded!", { id: "uploading-logo" });
      }

      await setDoc(doc(db, "users", user.uid), {
        branding: {
          primaryColor: primaryColor,
          logoUrl: logoUrl || null
        }
      }, { merge: true });

      toast.success("Branding settings saved!");
    } catch (error: any) {
      console.error("Error saving branding:", error);
      toast.error(`Failed to save branding settings: ${error.message}`);
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleUpgrade = (plan: string) => {
    navigate(`/payment?plan=${plan.toLowerCase()}`);
  };

  const handleManageBilling = async () => {
    setIsUpgrading(true);
    try {
      const useStripe = !!userProfile?.stripeCustomerId || (window.location.hostname !== "localhost");
      const functionName = useStripe ? 'manageStripeSubscription' : 'managePaystackSubscription';
      const manageSubscription = httpsCallable(functions, functionName);

      const { data }: any = await manageSubscription({
        returnUrl: window.location.href,
      });

      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.message) {
        toast.info(data.message);
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
      if (!window.confirm("Are you sure you want to disable 2FA? Your account will be less secure.")) return;
      try {
        const enrolledFactors = multiFactor(user!).enrolledFactors;
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
          toast.error("Failed to start 2FA setup. Ensure you have Identity Platform in Firebase Console.");
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const userInitials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 font-sans flex flex-col">
      <AppHeader />

      <main className="flex-1 w-full container py-6 sm:py-8 px-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link to="/dashboard" className="shrink-0">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border shadow-sm bg-white dark:bg-slate-900" aria-label="Return to Dashboard">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Workspace Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Configure your corporate account details, authentication layers, and visual branding.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Left Column: Sidebar tabs navigation */}
          <aside
            role="tablist"
            aria-label="Settings sections"
            className="w-full lg:w-64 lg:shrink-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-1.5 lg:p-4 shadow-sm flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap lg:sticky lg:top-24"
          >
            <div className="hidden lg:block px-3 py-2 text-xs uppercase font-extrabold tracking-wider text-slate-500">Settings Sections</div>
            {[
              { id: "profile", label: "Profile Information", short: "Profile", icon: User },
              { id: "security", label: "Security & 2FA", short: "Security", icon: Lock },
              { id: "team", label: "Team Management", short: "Team", icon: Users, show: isAdmin || userProfile?.plan === "business" },
              { id: "branding", label: "Custom Branding", short: "Branding", icon: Palette, show: isAdmin || userProfile?.plan === "business" }
            ].map((tab) => {
              if (tab.show === false) return null;
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 basis-[30%] lg:basis-auto lg:w-full min-h-[44px] flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-2 lg:px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-[#0A66C2] text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                  }`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span className="lg:hidden">{tab.short}</span>
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Right Column: Tab Content */}
          <div className="flex-1 w-full min-w-0">
            {activeTab === "profile" && (
              <div className="grid gap-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Profile Details</CardTitle>
                    <CardDescription className="text-sm">Update your corporate identity and photo avatar details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Photo Upload card */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                      <div className="relative group w-20 h-20 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center text-2xl font-extrabold text-[#0A66C2] shadow-inner">
                        {photoUrl ? (
                          <img src={photoUrl} alt="Profile preview" className="w-full h-full object-cover" />
                        ) : (
                          userInitials
                        )}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer disabled:cursor-not-allowed"
                          aria-label="Upload photo"
                        >
                          <Camera className="w-5 h-5 mb-1" />
                          <span>Upload</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleAvatarChange}
                          accept="image/png, image/jpeg"
                          className="hidden"
                        />
                      </div>
                      <div className="space-y-1 text-center sm:text-left">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Profile Photo</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                          JPEG or PNG, up to 2MB.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="mt-2 h-10 rounded-xl font-bold gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {isUploadingPhoto ? "Uploading..." : "Change photo"}
                        </Button>
                      </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Display Name</Label>
                        <Input
                          id="name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your Name"
                          className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Workspace Email</Label>
                        <Input
                          id="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-slate-100 border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-xs rounded-xl"
                        />
                      </div>
                      <div className="pt-2">
                        <Button type="submit" disabled={isSaving} className="h-11 rounded-xl shadow-sm font-bold bg-[#0A66C2] hover:bg-[#08519c] text-white w-full sm:w-auto">
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "security" && (
              <div className="grid gap-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Change Password Card */}
                <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Change Account Password</CardTitle>
                    <CardDescription className="text-sm">Ensure your account is using a long, random password to stay secure.</CardDescription>
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
                          className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm"
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
                          className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm"
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
                          className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm"
                        />
                      </div>
                      <div className="pt-2">
                        <Button type="submit" disabled={isChangingPassword} className="h-11 rounded-xl shadow-sm font-bold bg-[#0A66C2] hover:bg-[#08519c] text-white w-full sm:w-auto">
                          {isChangingPassword ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Two-Factor Authentication Card */}
                <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</CardTitle>
                    <CardDescription className="text-sm">Add an extra verification shield to protect corporate documents.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-[#0A66C2]/10 rounded-xl text-[#0A66C2] shrink-0">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">Authenticator App</Label>
                        <p className="text-sm text-muted-foreground">
                          Use standard code generator apps (Google Authenticator, Microsoft, or Authy) to secure credentials.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={is2FAEnabled ? "destructive" : "outline"}
                      onClick={handleToggle2FA}
                      className="h-11 rounded-xl font-bold shrink-0 w-full sm:w-auto"
                    >
                      {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
                    </Button>
                  </CardContent>
                </Card>

                {/* 2FA Setup Overlay Modal */}
                {show2FASetup && totpSecret && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setShow2FASetup(false)} />
                    <Card className="w-full max-w-md relative z-10 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 animate-in zoom-in-95 duration-200">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-3 h-10 w-10 rounded-full"
                        onClick={() => setShow2FASetup(false)}
                        aria-label="Close setup"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <CardHeader>
                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Configure Authenticator App</CardTitle>
                        <CardDescription className="text-sm">Follow the steps below to enroll your credential key.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6 text-left">
                        {/* Step 1 */}
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">1. Enter Secret Key Code</p>
                          <p className="text-xs text-muted-foreground">Type or paste this unique code manually into your authenticator app:</p>
                          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl break-all font-mono text-xs flex items-center justify-between gap-2 shadow-inner">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{totpSecret.secretKey}</span>
                            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-[#0A66C2] hover:bg-slate-200/50 dark:hover:bg-slate-900" onClick={() => copyToClipboard(totpSecret.secretKey)} aria-label="Copy key">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">2. Input Verification Code</p>
                          <div className="space-y-1">
                            <Label htmlFor="2fa-code" className="text-xs uppercase font-extrabold tracking-wider text-slate-500">Verification Code</Label>
                            <Input
                              id="2fa-code"
                              placeholder="Enter 6-digit code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="rounded-xl font-mono text-center tracking-widest text-lg font-bold h-12 shadow-sm border-slate-200 dark:border-slate-800"
                            />
                          </div>
                        </div>

                        <Button className="w-full h-11 rounded-xl font-bold bg-[#0A66C2] hover:bg-[#08519c] text-white" onClick={handleVerifyAndEnroll} disabled={verificationCode.length !== 6}>
                          Verify & Activate 2FA
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {activeTab === "team" && (
              <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Workspace Teammates</CardTitle>
                    <CardDescription className="text-sm">Invite teammates, assign legal authority roles, and audit login access.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-10 text-center max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-[#0A66C2]/10 rounded-2xl flex items-center justify-center text-[#0A66C2] mb-5 shadow-inner">
                        <Users className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Manage workspace users</h3>
                      <p className="text-sm text-muted-foreground mt-2 mb-6">
                        Add teammate email contacts, delegate document signing limits, and configure workspace admin structures.
                      </p>
                      <Button onClick={() => navigate('/team')} className="h-11 rounded-xl shadow-md font-bold px-6 bg-[#0A66C2] hover:bg-[#08519c] text-white">
                        Open Team Management
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "branding" && (
              <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-col xl:flex-row gap-6 items-start">

                  {/* Left branding card form */}
                  <Card className="flex-1 w-full border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Company Identity & Color Themes</CardTitle>
                      <CardDescription className="text-sm">Customize the eSign interface logo and signature buttons for clients.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSaveBranding} className="space-y-6">
                        {/* Logo Upload dropzone */}
                        <div className="space-y-2">
                          <Label htmlFor="logo-upload" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Workspace Logo</Label>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 shadow-inner p-1">
                              {userProfile?.branding?.logoUrl ? (
                                <img src={userProfile.branding.logoUrl} alt="Company logo preview" className="object-contain h-full w-full" />
                              ) : (
                                <Building className="w-8 h-8 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 w-full min-w-0 space-y-1 text-left">
                              <Input
                                id="logo-upload"
                                type="file"
                                onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                                accept="image/png, image/jpeg"
                                className="cursor-pointer rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs shadow-sm"
                              />
                              <p className="text-xs text-muted-foreground">PNG or JPEG, maximum 2MB. Transparent backgrounds look best.</p>
                            </div>
                          </div>
                        </div>

                        {/* Theme Primary Color Selector */}
                        <div className="space-y-2">
                          <Label htmlFor="primary-color" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Primary Theme Color</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id="primary-color"
                              type="color"
                              value={primaryColor}
                              onChange={(e) => setPrimaryColor(e.target.value)}
                              className="w-12 h-12 p-1 rounded-xl cursor-pointer border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
                            />
                            <div className="flex-1">
                              <Input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                placeholder="#000000"
                                className="font-mono rounded-xl border-slate-200 dark:border-slate-800 shadow-sm text-sm"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            This custom brand color will be applied to key workspace buttons and links visible to signers.
                          </p>
                        </div>

                        <div className="pt-2">
                          <Button type="submit" disabled={isSavingBranding} className="h-11 rounded-xl shadow-sm font-bold w-full sm:w-auto bg-[#0A66C2] hover:bg-[#08519c] text-white">
                            {isSavingBranding ? "Saving..." : "Save Branding"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Right Branding Preview Frame Mock */}
                  <div className="w-full xl:w-72 space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Preview Simulator</div>
                    <Card className="border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 rounded-2xl overflow-hidden p-5 text-left space-y-5">
                      <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-950/20 text-center font-bold text-xs text-slate-500">
                        Signer Workspace Mock
                      </div>

                      {/* Simulated signature button */}
                      <div className="space-y-2">
                        <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Button Preview</span>
                        <button
                          type="button"
                          style={{ backgroundColor: primaryColor }}
                          className="w-full text-white font-bold text-xs py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-1.5 pointer-events-none"
                        >
                          <PenTool className="w-3.5 h-3.5" /> Sign Document
                        </button>
                      </div>

                      {/* Simulated border accents */}
                      <div className="space-y-2">
                        <span className="text-xs uppercase tracking-wider font-extrabold text-slate-400">Border Highlight Accent</span>
                        <div
                          style={{ borderColor: primaryColor }}
                          className="border-2 border-dashed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-center text-xs text-slate-400 font-mono"
                        >
                          eSign Area Frame
                        </div>
                      </div>
                    </Card>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;