import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { functions } from "@/components/client";
import { httpsCallable } from "firebase/functions";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, MessageCircle, RotateCw, ShieldCheck } from "lucide-react";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_EXPIRY_SECONDS = 300;

interface SigningInfo {
  name: string;
  senderName: string;
  recipientName: string;
  maskedPhone: string;
  status: string;
}

const WhatsAppVerify = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = getAuth();

  const [info, setInfo] = useState<SigningInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SECONDS);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialSendRef = useRef(false);

  const startResendCooldown = () => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendTimerRef.current) clearInterval(resendTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startExpiryTimer = () => {
    setExpirySeconds(OTP_EXPIRY_SECONDS);
    if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    expiryTimerRef.current = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
          setErrorMsg("Your code has expired. Please request a new one.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (secs: number) =>
    `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  // The code always goes to the number the sender entered — the server looks it up.
  const sendOtp = useCallback(async () => {
    if (!id) return;
    setIsSendingOtp(true);
    setErrorMsg("");
    try {
      await httpsCallable(functions, "sendWhatsAppOTP")({ documentId: id });
      startResendCooldown();
      startExpiryTimer();
      toast.success("Verification code sent to your WhatsApp.");
    } catch (err: any) {
      const msg = err?.message || "Couldn't send the code. Please try again.";
      setErrorMsg(msg);
    } finally {
      setIsSendingOtp(false);
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      // Already verified for this document in this browser — go straight to signing.
      if (auth.currentUser?.uid === `whatsapp-signer-${id}`) {
        navigate(`/sign/${id}`, { replace: true });
        return;
      }
      try {
        const result = await httpsCallable<{ documentId: string }, SigningInfo>(functions, "getWhatsAppSigningInfo")({ documentId: id });
        setInfo(result.data);
        if (result.data.status === "pending" && !initialSendRef.current) {
          initialSendRef.current = true;
          await sendOtp();
        }
      } catch {
        setLoadError("This signing link is invalid or has been removed. Ask the sender to send it again.");
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
      if (expiryTimerRef.current) clearInterval(expiryTimerRef.current);
    };
  }, [id, sendOtp, navigate, auth]);

  const handleVerify = async (code?: string) => {
    const finalCode = code || otp.join("");
    if (finalCode.length !== 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }
    if (isLocked || isVerifying) return;
    setIsVerifying(true);
    setErrorMsg("");
    try {
      const result = await httpsCallable<{ documentId: string; otp: string }, { success: boolean; customToken: string }>(
        functions,
        "verifyWhatsAppOTP"
      )({ documentId: id!, otp: finalCode });
      await signInWithCustomToken(auth, result.data.customToken);
      setIsSuccess(true);
      setTimeout(() => navigate(`/sign/${id}`, { replace: true }), 1000);
    } catch (err: any) {
      const msg = err?.message || "Incorrect code. Please try again.";
      setErrorMsg(msg);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      if (msg.toLowerCase().includes("too many")) setIsLocked(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "") && value !== "") handleVerify(next.join(""));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      handleVerify(pasted);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="mb-8">
        <Logo />
      </div>
      {children}
      <p className="mt-6 text-center text-xs text-slate-500">
        Secure signing powered by <a href="https://e-ndorse.online" className="underline">Endorse</a>
      </p>
    </div>
  );

  if (loading) {
    return shell(
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-[#0A66C2]" />
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  if (loadError || !info) {
    return shell(<p className="max-w-sm text-center text-sm text-slate-600">{loadError || "Something went wrong."}</p>);
  }

  if (info.status !== "pending") {
    return shell(
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h1 className="text-lg font-semibold text-slate-900">Already signed</h1>
        <p className="text-sm text-slate-600">
          <span className="font-medium">{info.name}</span> has already been signed. Nothing else to do here.
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return shell(
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Number verified</h2>
        <p className="text-sm text-slate-500">Opening your document…</p>
      </div>
    );
  }

  return shell(
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="flex items-center gap-3 bg-[#0A66C2] px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
          <MessageCircle className="h-5 w-5 text-[#FFC83D]" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-white">Verify your WhatsApp number</h1>
          <p className="text-xs text-white/80">So only you can open this document</p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="space-y-1 text-center">
          <p className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">{info.senderName || "Someone"}</span> invited you to sign{" "}
            <span className="font-medium text-slate-700">{info.name}</span>
          </p>
          <p className="pt-2 text-sm font-medium text-slate-900">We sent a 6-digit code to</p>
          <p className="text-sm font-bold text-slate-900">{info.maskedPhone}</p>
        </div>

        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              id={`otp-input-${index}`}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={isVerifying || isLocked}
              aria-label={`Digit ${index + 1}`}
              className={[
                "h-12 w-11 rounded-lg border-2 bg-white text-center text-lg font-bold outline-none transition-all",
                digit ? "border-[#0A66C2] text-[#0A66C2]" : "border-slate-200",
                isLocked ? "cursor-not-allowed opacity-40" : "focus:border-[#0A66C2]",
                errorMsg && !isLocked ? "border-red-400" : "",
              ].join(" ")}
            />
          ))}
        </div>

        {errorMsg && <p className="text-center text-xs font-medium text-red-600">{errorMsg}</p>}

        {!isLocked && expirySeconds > 0 && resendCooldown > 0 && (
          <p className="text-center text-xs text-slate-500">
            Code expires in{" "}
            <span className={`font-semibold ${expirySeconds < 60 ? "text-red-600" : "text-slate-900"}`}>{formatTime(expirySeconds)}</span>
          </p>
        )}

        <Button
          id="verify-otp-btn"
          className="w-full bg-[#0A66C2] font-semibold text-white hover:bg-[#08519c]"
          onClick={() => handleVerify()}
          disabled={isVerifying || isLocked || otp.join("").length !== 6}
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" /> Verify &amp; open document
            </>
          )}
        </Button>

        <div className="text-center">
          {resendCooldown > 0 ? (
            <p className="text-xs text-slate-500">
              Resend in <span className="font-semibold text-slate-900">{resendCooldown}s</span>
            </p>
          ) : (
            <button
              id="resend-otp-btn"
              type="button"
              onClick={sendOtp}
              disabled={isSendingOtp || isLocked}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0A66C2] transition-colors hover:underline disabled:opacity-40"
            >
              {isSendingOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
              {isSendingOtp ? "Sending…" : "Send code"}
            </button>
          )}
        </div>

        {isLocked && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-xs text-red-700">
            Too many incorrect attempts. Ask the sender to send the invitation again.
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppVerify;
