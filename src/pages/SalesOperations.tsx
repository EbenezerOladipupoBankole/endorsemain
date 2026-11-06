import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useDocumentMeta } from "@/components/FeaturePage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { Bell, Check, FileText, Receipt, Send } from "lucide-react";

const STAGES = ["Draft", "Sent", "Reminded", "Signed", "Invoiced"] as const;

const BOARD: Record<(typeof STAGES)[number], { name: string; value: string }[]> = {
  Draft: [{ name: "Vertex Systems", value: "$21,000" }],
  Sent: [{ name: "Starlight Digital", value: "R 150,000" }],
  Reminded: [{ name: "Nimbus Co", value: "KSh 1.6m" }],
  Signed: [{ name: "Halcyon Labs", value: "₦9.8m" }],
  Invoiced: [{ name: "Orbit Freight", value: "$31,500" }],
};

const STAGE_NOTE = [
  "MSA drafted from template",
  "Link sent to billing@acme.com",
  "Reminder sent · 1 click",
  "Signed by J. Okafor",
  "INV-2291 created in Endorse",
];

const OLD_WAY = [
  { at: "Day 0", label: "PDF attached to email" },
  { at: "Day 2", label: "“Did you get the contract?”" },
  { at: "Day 5", label: "Printed, signed, scanned sideways" },
  { at: "Day 8", label: "Wrong version — start over" },
  { at: "Day 11", label: "Finally signed" },
  { at: "Day 14", label: "Someone remembers to invoice" },
];

const NEW_WAY = [
  { at: "0 min", label: "Signing link sent from template" },
  { at: "6 min", label: "Opened on mobile" },
  { at: "14 min", label: "Signed" },
  { at: "20 min", label: "Invoice created and sent" },
];

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function DealJourney() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl bg-[#0A66C2] p-3 sm:p-4 shadow-2xl shadow-[#0A66C2]/20">
      <div className="flex items-center justify-between px-1 pb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">How one deal moves</span>
        <span className="text-[11px] font-medium text-white/60">Illustration</span>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="grid min-w-[680px] grid-cols-5 gap-2">
          {STAGES.map((col, i) => (
            <div key={col} className="rounded-xl bg-white/10 p-2">
              <div className="flex items-center justify-between px-1 pb-2">
                <span className={`text-[11px] font-bold ${i === stage ? "text-[#FFC83D]" : "text-white"}`}>{col}</span>
                <span className="text-[10px] tabular-nums text-white/60">{BOARD[col].length + (i === stage ? 1 : 0)}</span>
              </div>

              <div className="space-y-2">
                {i === stage && (
                  <div
                    key={stage}
                    className="animate-in fade-in slide-in-from-left-4 duration-500 rounded-lg bg-white p-2.5 shadow-lg ring-2 ring-[#FFC83D]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-bold text-slate-900">Acme Industries</span>
                      <span className="text-[11px] font-black tabular-nums text-slate-900">$45k</span>
                    </div>
                    <p className="mt-1 truncate text-[10px] text-slate-500">{STAGE_NOTE[stage]}</p>
                  </div>
                )}
                {BOARD[col].map((d) => (
                  <div key={d.name} className="rounded-lg bg-white/15 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-white">{d.name}</span>
                      <span className="text-[10px] tabular-nums text-white/70">{d.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-display text-lg font-bold tabular-nums text-slate-900 dark:text-white">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#0A66C2]"
      />
    </label>
  );
}

function StuckRevenueCalculator() {
  const [deals, setDeals] = useState(20);
  const [avg, setAvg] = useState(12000);
  const [days, setDays] = useState(9);

  const { stuckNow, stuckAfter } = useMemo(() => {
    const perDay = (deals * avg) / 30;
    return { stuckNow: perDay * days, stuckAfter: perDay * 1 };
  }, [deals, avg, days]);

  return (
    <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-7">
        <Slider label="Deals closed per month" value={deals} min={1} max={200} step={1} format={(n) => String(n)} onChange={setDeals} />
        <Slider label="Average deal value" value={avg} min={500} max={100000} step={500} format={usd} onChange={setAvg} />
        <Slider label="Days from “yes” to signature today" value={days} min={1} max={30} step={1} format={(n) => `${n} days`} onChange={setDays} />
      </div>

      <div className="flex flex-col justify-between rounded-2xl bg-[#0A66C2] p-6 text-white sm:p-8">
        <div>
          <p className="text-sm text-white/70">Revenue waiting on a signature at any moment</p>
          <p className="mt-1 font-display text-4xl font-semibold tabular-nums sm:text-5xl">{usd(stuckNow)}</p>
        </div>
        <div className="mt-8 border-t border-white/20 pt-5">
          <p className="text-sm text-white/70">If contracts closed within a day</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-[#FFC83D]">{usd(stuckAfter)}</p>
          <p className="mt-4 text-xs leading-relaxed text-white/60">
            Rough estimate: monthly bookings ÷ 30 × days a deal spends waiting. Your numbers will vary.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SalesOperations() {
  const { user } = useAuth();
  useDocumentMeta(
    "Endorse for Sales & Operations — Get contracts signed the same day",
    "Send proposals and contracts as a signing link by email or WhatsApp, see the moment they're signed, and invoice the same day. Free to start."
  );
  // These buttons are about sending, so they open Send for Signature; new visitors sign up first.
  const ctaHref = user ? "/team" : "/auth?mode=signup&redirect=%2Fteam";

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />

      {/* Hero — headline over a full-width live board */}
      <section className="px-4 pb-16 pt-12 md:px-8 md:pt-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-sm font-semibold text-[#0A66C2]">Endorse for Sales</p>
              <h1 className="mt-3 font-display text-[2.6rem] font-medium leading-[1.08] text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
                The contract shouldn't be the <em className="text-[#0A66C2]">slowest</em> part of the sale.
              </h1>
            </div>
            <div className="space-y-5 lg:pb-2">
              <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
                Send proposals and MSAs as a signing link, see the moment they're signed, and get the invoice out the
                same day.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild className="h-11 rounded-lg bg-[#0A66C2] px-6 font-semibold text-white hover:bg-[#08519c]">
                  <Link to={ctaHref}>Send your first contract</Link>
                </Button>
                <a href="#calculator" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-slate-700 hover:text-[#0A66C2] dark:text-slate-300">
                  What's stuck in your pipeline?
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <DealJourney />
          </div>
        </div>
      </section>

      {/* Old way vs Endorse */}
      <section className="border-y border-slate-200 bg-white px-4 py-20 md:px-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <h2 className="max-w-xl font-display text-3xl font-medium text-slate-900 sm:text-4xl dark:text-white">
            Where deals go quiet.
          </h2>
          <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">
            The same verbal yes, two very different weeks. (Illustrative — but if the left column looks familiar, you know.)
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 dark:border-slate-700">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Email + PDF</p>
              <ol className="mt-5 space-y-4">
                {OLD_WAY.map((s) => (
                  <li key={s.at + s.label} className="flex gap-4 text-sm">
                    <span className="w-14 shrink-0 font-mono text-xs leading-5 text-slate-400">{s.at}</span>
                    <span className="text-slate-500 dark:text-slate-400">{s.label}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl bg-[#0A66C2] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FFC83D]">With Endorse</p>
              <ol className="mt-5 space-y-4">
                {NEW_WAY.map((s, i) => (
                  <li key={s.at + s.label} className="flex gap-4 text-sm">
                    <span className="w-14 shrink-0 font-mono text-xs leading-5 text-white/60">{s.at}</span>
                    <span className="flex items-center gap-2 font-medium">
                      {i === NEW_WAY.length - 1 && <Check className="h-4 w-4 text-[#FFC83D]" />}
                      {s.label}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-8 border-t border-white/20 pt-5 text-sm text-white/80">
                Same day, and you can see where every contract stands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What it does — plain three-column list */}
      <section className="px-4 py-20 md:px-8">
        <div className="container mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
          {[
            {
              icon: FileText,
              title: "Templates that fill themselves",
              desc: "Keep your services agreement and renewal terms as templates. Client details drop in, legal language stays untouched.",
            },
            {
              icon: Bell,
              title: "Reminders in one click",
              desc: "Still unsigned? Resend the signing link from your dashboard in one click — no awkward follow-up email to write.",
            },
            {
              icon: Receipt,
              title: "Invoices in the same place",
              desc: "Once it's signed, create an itemized invoice in Endorse and email the PDF to your client in a minute.",
            },
          ].map((f) => (
            <div key={f.title} className="border-t-[3px] border-[#FFC83D] pt-5">
              <f.icon className="h-5 w-5 text-[#0A66C2]" />
              <h3 className="mt-4 font-display text-xl font-medium text-slate-900 dark:text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="scroll-mt-20 px-4 pb-24 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-medium text-slate-900 sm:text-4xl dark:text-white">
            What's stuck in your pipeline?
          </h2>
          <p className="mb-10 mt-3 max-w-xl text-slate-600 dark:text-slate-400">
            Every day a deal waits on paperwork is a day the money isn't yours yet. Move the sliders.
          </p>
          <StuckRevenueCalculator />
        </div>
      </section>

      {/* Closing */}
      <section className="border-t-4 border-[#FFC83D] bg-[#0A66C2] px-4 py-14 md:px-8">
        <div className="container mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">Send one contract. Time it.</h2>
            <p className="mt-2 text-white/75">Free to start — no card, no sales call.</p>
          </div>
          <Button asChild className="h-12 rounded-lg bg-[#FFC83D] px-7 font-bold text-slate-900 hover:bg-[#e6b435]">
            <Link to={ctaHref}>
              <Send className="mr-2 h-4 w-4" /> Start sending
            </Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
