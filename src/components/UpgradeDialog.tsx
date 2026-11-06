import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FREE_DOCUMENT_LIMIT } from "@/lib/plan";

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
}

const PLANS = [
  { id: "pro", name: "Pro", price: "$8", perks: ["Unlimited signing and sending", "All templates and invoices"] },
  { id: "business", name: "Business", price: "$15", perks: ["Everything in Pro", "Team members and custom branding"] },
];

/** Shown when a free account has used all of its free documents. */
export function UpgradeDialog({ open, onClose }: UpgradeDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      {/* Above the z-[70] send modal it can open from. */}
      <DialogContent className="z-[80] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl" style={{ fontFamily: "Gilroy, Inter, system-ui, sans-serif" }}>
            You've used your {FREE_DOCUMENT_LIMIT} free documents
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            Upgrade to keep signing and sending. Your existing documents stay available either way.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => navigate(`/payment?plan=${plan.id}`)}
              className="rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-[#0A66C2] hover:bg-[#0A66C2]/5"
            >
              <p className="font-bold text-slate-900">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold text-[#0A66C2]">
                {plan.price}
                <span className="text-xs font-medium text-slate-500"> / 30 days</span>
              </p>
              <ul className="mt-3 space-y-1.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0A66C2]" /> {perk}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500">One payment covers 30 days. Nothing renews automatically.</p>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onClose}>Not now</Button>
          <Button className="bg-[#FFC83D] font-bold text-black hover:bg-[#e6b435]" onClick={() => navigate("/payment?plan=pro")}>
            Upgrade to Pro
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
