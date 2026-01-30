import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "./components/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./components/client";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Shield, Zap, ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { Button } from "./components/ui/button";
import { Logo } from "./components/Logo";

const PLANS = [
  {
    id: "pro",
    name: "Pro Plan",
    price: "9.99",
    description: "Perfect for individuals and professionals",
    features: ["Unlimited documents", "Invite up to 5 signers", "Audit trails", "Priority support"],
    color: "from-blue-500 to-indigo-600",
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: "business",
    name: "Business Plan",
    price: "24.99",
    description: "Advanced features for teams and companies",
    features: ["Everything in Pro", "Unlimited signers", "Team management", "Custom branding", "24/7 Support"],
    color: "from-purple-500 to-pink-600",
    icon: <Shield className="w-5 h-5" />,
  }
];

const Payment = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Detect if we are on the live domain for PayPal Client ID
  const isProduction = window.location.hostname === "e-ndorse.site" ||
    window.location.hostname === "www.e-ndorse.site" ||
    window.location.hostname === "e-ndorse.online" ||
    window.location.hostname === "endorse-app.web.app";

  useEffect(() => {
    const planFromUrl = searchParams.get("plan")?.toLowerCase();
    if (planFromUrl === "business") {
      setSelectedPlan(PLANS[1]);
    } else if (planFromUrl === "pro") {
      setSelectedPlan(PLANS[0]);
    }
  }, [searchParams]);

  const updatePlanInFirestore = async (planId: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), {
        plan: planId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update your plan in our database. Please contact support.");
      return false;
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Welcome to {selectedPlan.name}!</h1>
          <p className="text-slate-600 mb-8">Your account has been upgraded successfully. You now have access to all {selectedPlan.id} features.</p>
          <Button
            className="w-full h-12 text-lg rounded-xl bg-indigo-600 hover:bg-indigo-700"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo className="h-12 w-auto" />
          </div>
          <div className="hidden md:block text-sm text-slate-500 font-medium">
            Checkout &bull; Secure Payment
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12">

          {/* Left Side: Plan Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Complete your upgrade</h1>
              <p className="text-lg text-slate-600">Join thousands of professionals using Endorse to secure their agreements.</p>
            </div>

            <div className="grid gap-4">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${selectedPlan.id === plan.id
                      ? `border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600`
                      : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} text-white flex items-center justify-center shadow-lg`}>
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                        <p className="text-slate-500 text-sm">{plan.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-slate-900">${plan.price}</span>
                      <span className="text-slate-500 text-sm">/mo</span>
                    </div>
                  </div>
                  {selectedPlan.id === plan.id && (
                    <div className="mt-6 pt-6 border-t border-indigo-100 flex flex-wrap gap-x-6 gap-y-2 animate-in fade-in slide-in-from-top-2">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                          <Check className="w-4 h-4 text-indigo-600" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-100 rounded-2xl flex items-center gap-4 border border-slate-200">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">100% Secure Checkout</p>
                <p className="text-sm text-slate-500">Your payment information is processed securely via PayPal.</p>
              </div>
            </div>
          </div>

          {/* Right Side: Payment Methods */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 lg:p-10 sticky top-32">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              Payment Details
            </h2>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 font-medium">{selectedPlan.name} (Monthly)</span>
                  <span className="font-bold text-slate-900">${selectedPlan.price}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-900 font-bold">Total due today</span>
                  <span className="text-indigo-600 font-black text-2xl">${selectedPlan.price}</span>
                </div>
              </div>

              <div className="pt-4">
                <PayPalScriptProvider options={{
                  "client-id": isProduction ? "YOUR_PAYPAL_LIVE_CLIENT_ID" : "test",
                  currency: "USD",
                  intent: "capture"
                }}>
                  <PayPalButtons
                    forceReRender={[selectedPlan.id]}
                    style={{
                      layout: "vertical",
                      color: "gold",
                      shape: "rect",
                      label: "pay"
                    }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                          {
                            amount: {
                              currency_code: "USD",
                              value: selectedPlan.price,
                            },
                            description: `Endorse App Upgrade - ${selectedPlan.name}`,
                          },
                        ],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      if (actions.order) {
                        setIsLoading(true);
                        try {
                          const details = await actions.order.capture();
                          console.log("PayPal Success:", details);

                          const success = await updatePlanInFirestore(selectedPlan.id);
                          if (success) {
                            setPaymentSuccess(true);
                            toast.success(`Successfully upgraded to ${selectedPlan.name}!`);
                          }
                        } catch (err) {
                          console.error("Capture error:", err);
                          toast.error("Payment was successful but we couldn't update your account. Please contact support.");
                        } finally {
                          setIsLoading(false);
                        }
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
                      toast.error("An error occurred with PayPal. Please try again.");
                    }}
                  />
                </PayPalScriptProvider>
              </div>

              <div className="text-center text-xs text-slate-400 mt-8">
                By completing this purchase, you agree to our <a href="/terms" className="underline">Terms of Service</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
              </div>
            </div>

            {isLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10 transition-all">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="font-bold text-slate-900">Processing Your Payment...</p>
                  <p className="text-sm text-slate-500 text-center px-6">Please do not refresh the page.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
