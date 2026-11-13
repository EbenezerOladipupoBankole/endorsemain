import { useState, useEffect } from "react";
import { useAuth } from "./components/AuthContext";
import { functions } from "./components/client";
import { FREE_LIMIT_ENFORCED } from "./lib/plan";
import { httpsCallable } from "@/lib/callable";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "./components/ui/button";
import { Logo } from "./components/Logo";

const PLANS = [
  {
    id: "pro",
    name: "Pro Plan",
    price: "8",
    // Must match PLAN_PRICES_USD × NGN_PER_USD in functions/src/index.ts.
    priceNgn: "12,800",
    description: "Perfect for individuals and professionals",
    features: ["Unlimited signing and sending", "Templates and invoices", "Signing status tracking", "Priority support"],
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "business",
    name: "Business Plan",
    price: "15",
    priceNgn: "24,000",
    description: "Advanced features for teams and companies",
    features: ["Everything in Pro", "Team management", "Custom branding", "24/7 Support"],
    color: "from-purple-500 to-pink-600",
  }
];

const Payment = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Checkout only opens once paid plans are switched on (see FREE_LIMIT_ENFORCED).
  useEffect(() => {
    if (FREE_LIMIT_ENFORCED) return;
    toast.info("Paid plans are coming soon. Everything is free for now.");
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const planFromUrl = searchParams.get("plan")?.toLowerCase();
    if (planFromUrl === "business") {
      setSelectedPlan(PLANS[1]);
    } else if (planFromUrl === "pro") {
      setSelectedPlan(PLANS[0]);
    }
    // Paystack/Stripe send the buyer back here; the plan itself is switched on by the payment webhook.
    if (searchParams.get("payment") === "success") setPaymentSuccess(true);
  }, [searchParams]);

  const handlePaystackPayment = async () => {
    setIsLoading(true);
    try {
      const initializePaystack = httpsCallable(functions, 'initializePaystackPayment');
      // The server sets the price and payment mode; only the plan is sent from here.
      const { data }: any = await initializePaystack({
        planId: selectedPlan.id,
        // Using window.location.href to handle GitHub Pages subpaths and routing
        callbackUrl: `${window.location.href.split('?')[0]}?plan=${selectedPlan.id}&payment=success`,
      });

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error("Could not initialize payment. Please try again.");
      }
    } catch (error: any) {
      console.error("Paystack Error:", error);
      toast.error(error.message || "Failed to connect to Paystack.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setIsLoading(true);
    try {
      const initializeStripeSession = httpsCallable(functions, 'initializeStripeSession');
      const { data }: any = await initializeStripeSession({
        planId: selectedPlan.id,
        successUrl: `${window.location.origin}/payment?plan=${selectedPlan.id}&payment=success`,
        cancelUrl: `${window.location.origin}/payment?plan=${selectedPlan.id}&payment=cancel`,
      });

      // initializeStripeSession returns { sessionId, url }. stripe.redirectToCheckout()
      // was removed from @stripe/stripe-js, so redirect to the hosted Checkout URL directly.
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not initialize Stripe session.");
      }
    } catch (error: any) {
      console.error("Stripe Error:", error);
      toast.error(error.message || "Failed to connect to Stripe.");
    } finally {
      setIsLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to {selectedPlan.name}!</h1>
          <p className="text-slate-600 mb-8">
            Payment received. Your {selectedPlan.name} is active for the next 30 days — it can take a minute to show on
            your dashboard. Nothing renews automatically; we'll email you before it ends.
          </p>
          <Button
            className="w-full h-12 text-lg rounded-xl bg-[#0A66C2] hover:bg-[#08519c]"
            // A full reload so the dashboard picks up the new plan from the user's profile.
            onClick={() => window.location.assign("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center p-4 lg:p-8 font-sans">
      <div className="w-full max-w-6xl bg-white rounded-[20px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col lg:flex-row min-h-[600px]">

        {/* Left Panel - Order Summary / Plan Selection */}
        <div className="w-full lg:w-[45%] bg-[#f7f9fc] p-8 lg:p-12 border-r border-slate-200/60 flex flex-col relative">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="mt-8 mb-8">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <Logo className="h-7" />
              <span className="text-slate-300">|</span>
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Checkout</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Get {selectedPlan.name}</h2>
            <p className="text-slate-500 mt-1">Unlock the full potential of digital agreements.</p>
          </div>

          {/* Plan Selector (Stripe-like radio cards) */}
          <div className="space-y-3 mb-8 flex-1">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${selectedPlan.id === plan.id
                  ? "border-indigo-600 bg-white shadow-sm ring-1 ring-indigo-600/10"
                  : "border-transparent bg-white/50 hover:bg-white hover:border-slate-200"
                  }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlan.id === plan.id ? "border-indigo-600" : "border-slate-300"}`}>
                      {selectedPlan.id === plan.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${selectedPlan.id === plan.id ? "text-slate-900" : "text-slate-600"}`}>{plan.name}</p>
                      <p className="text-xs text-slate-500">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${selectedPlan.id === plan.id ? "text-slate-900" : "text-slate-600"}`}>${plan.price}</p>
                    <p className="text-[10px] text-slate-400">/30 days</p>
                  </div>
                </div>

                {/* Features Preview for Selected Plan */}
                {selectedPlan.id === plan.id && (
                  <div className="mt-3 pl-8 flex flex-wrap gap-x-4 gap-y-1">
                    {plan.features.slice(0, 2).map((feature, i) => (
                      <span key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-indigo-600 shrink-0" /> {feature}
                      </span>
                    ))}
                    <span className="text-[11px] text-indigo-600 font-medium">+ more</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-500 text-sm">Subtotal</span>
              <span className="text-slate-900 font-medium">${selectedPlan.price}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-900 font-bold">Total due today</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-900">${selectedPlan.price}</span>
                <span className="text-xs text-slate-400 block font-normal">Covers 30 days · no auto-renewal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Payment */}
        <div className="w-full lg:w-[55%] bg-white p-8 lg:p-12 flex flex-col justify-center relative">
          <div className="max-w-md mx-auto w-full">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Payment Details</h3>

            {/* Two ways to pay: Paystack for African customers, Stripe for cards anywhere else. */}
            <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="font-semibold text-slate-900">In Africa</p>
                <p className="text-sm text-slate-600 mt-1 mb-4">
                  Card, bank transfer or USSD through Paystack. Charged as ₦{selectedPlan.priceNgn}.
                </p>
                <Button
                  onClick={handlePaystackPayment}
                  className="w-full bg-[#0BA4DB] hover:bg-[#0BA4DB]/90 text-white h-12 text-base font-semibold shadow-md shadow-blue-500/10"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay with Paystack"}
                </Button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <p className="font-semibold text-slate-900">Anywhere else</p>
                <p className="text-sm text-slate-600 mt-1 mb-4">
                  Any debit or credit card through Stripe. Charged as ${selectedPlan.price} (USD).
                </p>
                <Button
                  onClick={handleStripePayment}
                  variant="outline"
                  className="w-full h-12 text-base font-semibold border-slate-300"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay with card (USD)"}
                </Button>
              </div>

              <div className="text-center text-xs text-slate-400">
                Payments are processed securely by Paystack and Stripe
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 mt-6">
              By confirming, you agree to our <a href="/terms" className="underline hover:text-slate-600">Terms of Service</a>.
            </div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="font-semibold text-slate-900">Processing...</p>
                <p className="text-xs text-slate-500 mt-1">Please do not refresh the page.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;
