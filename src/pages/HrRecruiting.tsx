import { useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { ArrowRight, Check } from "lucide-react";

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };

const TIMELINE = [
  { time: "9:02", who: "hr", text: "You approve the offer. Endorse texts Jordan a link." },
  { time: "9:04", who: "candidate", text: "Jordan opens it on the bus. Salary, start date, benefits — readable on a phone." },
  { time: "9:05", who: "candidate", text: "Signs with a thumb. Offer accepted." },
  { time: "9:05", who: "hr", text: "You get a notification. The NDA, W-4 and handbook go out as the next steps — automatically." },
  { time: "9:13", who: "candidate", text: "Jordan finishes the packet before their stop." },
  { time: "9:13", who: "hr", text: "Every signed document is filed to Jordan's employee record. Nothing to download, rename or upload." },
] as const;

const PACKET = [
  { name: "Offer letter", note: "Role, compensation and start date. The one they've been waiting for." },
  { name: "Mutual NDA", note: "Signed in the same sitting, not chased a week later." },
  { name: "W-4", note: "Fillable fields on mobile — no printer, no scanner app." },
  { name: "Direct deposit", note: "Bank details captured once, stored encrypted." },
  { name: "Handbook acknowledgement", note: "A clear record that they received and read it." },
];

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      <div className="rounded-[2.6rem] bg-[#0F172A] p-2.5 shadow-[0_40px_80px_-30px_rgba(60,40,20,0.45)]">
        <div className="overflow-hidden rounded-[2.1rem] bg-white">
          <div className="flex justify-center pt-2.5">
            <div className="h-5 w-24 rounded-full bg-[#0F172A]" />
          </div>

          <div className="px-5 pb-6 pt-5">
            <p className="text-[11px] font-medium text-[#64748B]">Northwind · Offer of employment</p>
            <p className="mt-3 text-[26px] leading-tight text-[#0F172A]" style={serif}>
              Welcome aboard, <em>Jordan.</em>
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-[#475569]">
              We're delighted to offer you the role of Product Designer, starting Monday 3 November.
            </p>

            <div className="mt-5 space-y-2 rounded-2xl bg-[#FFF4D6] p-3.5 text-[11px]">
              <div className="flex justify-between"><span className="text-[#64748B]">Base salary</span><span className="font-semibold text-[#0F172A]">$118,000</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Equity</span><span className="font-semibold text-[#0F172A]">2,400 options</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Location</span><span className="font-semibold text-[#0F172A]">Hybrid · Chicago</span></div>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-[#C9D8EA] px-4 py-3 text-center">
              <span className="text-2xl italic text-[#0A66C2]" style={serif}>Jordan Lee</span>
            </div>

            <div className="mt-3 rounded-full bg-[#0A66C2] py-3 text-center text-[12px] font-semibold text-white">
              Accept offer
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-10 top-24 hidden rotate-[-4deg] rounded-xl bg-white px-3 py-2 text-[11px] font-medium text-[#0F172A] shadow-lg sm:block">
        Opened · 9:04 am
      </div>
      <div className="absolute -right-12 bottom-24 hidden rotate-[3deg] items-center gap-1.5 rounded-xl bg-[#FFC83D] px-3 py-2 text-[11px] font-semibold text-[#0F172A] shadow-lg sm:flex">
        <Check className="h-3.5 w-3.5" /> Signed in 58s
      </div>
    </div>
  );
}

function PacketStack() {
  const [active, setActive] = useState(0);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div className="relative mx-auto h-[340px] w-full max-w-[340px]">
        {PACKET.map((doc, i) => {
          const offset = i - active;
          const isActive = i === active;
          return (
            <button
              key={doc.name}
              onClick={() => setActive(i)}
              aria-label={doc.name}
              className="absolute left-1/2 top-1/2 h-[300px] w-[230px] rounded-md border border-[#DCE6F2] bg-white text-left shadow-md transition-all duration-500 ease-out"
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * 26}px) translateY(${isActive ? -12 : Math.abs(offset) * 6}px) rotate(${offset * 5}deg)`,
                zIndex: 10 - Math.abs(offset),
                opacity: Math.abs(offset) > 2 ? 0 : 1,
              }}
            >
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">{String(i + 1).padStart(2, "0")} / 05</p>
                <p className="mt-3 text-xl text-[#0F172A]" style={serif}>{doc.name}</p>
                <div className="mt-5 space-y-2">
                  {[92, 80, 86, 64, 74, 50].map((w, k) => (
                    <div key={k} className="h-1.5 rounded-full bg-[#E8EFF7]" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between border-t border-[#E8EFF7] pt-3">
                  <span className="text-lg italic text-[#0A66C2]" style={serif}>J. Lee</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div>
        <ol className="divide-y divide-[#DCE6F2] border-y border-[#DCE6F2] dark:divide-slate-800 dark:border-slate-800">
          {PACKET.map((doc, i) => (
            <li key={doc.name}>
              <button onClick={() => setActive(i)} className="flex w-full items-baseline gap-4 py-4 text-left">
                <span className={`font-mono text-xs ${i === active ? "text-[#0A66C2]" : "text-[#CBD5E1]"}`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1">
                  <span className={`block text-lg ${i === active ? "text-[#0F172A] dark:text-white" : "text-[#64748B]"}`} style={serif}>
                    {doc.name}
                  </span>
                  {i === active && <span className="mt-1 block text-sm text-[#475569] dark:text-slate-400">{doc.note}</span>}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function HrRecruiting() {
  const { user } = useAuth();
  const ctaHref = user ? "/dashboard" : "/auth?redirect=/dashboard";

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white font-sans text-[#0F172A] dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />

      {/* Hero */}
      <section className="px-4 pb-20 pt-14 md:px-8 md:pt-20">
        <div className="container mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="text-sm font-medium text-[#64748B] dark:text-slate-400">Endorse for HR &amp; Recruiting</p>
            <h1 className="mt-4 text-[2.6rem] leading-[1.08] text-[#0F172A] sm:text-6xl dark:text-white" style={serif}>
              Their first <em className="text-[#0A66C2]">yes</em> should feel like day one.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#475569] dark:text-slate-400">
              Offer letter, NDA, tax forms and handbook — sent as one link your candidate can finish from their phone,
              and filed for you the moment they do.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link to={ctaHref}>
                <Button className="h-12 rounded-full bg-[#0A66C2] px-7 font-semibold text-white hover:bg-[#08519c]">
                  Send an offer <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <span className="text-sm text-[#64748B]">Free to start · works on any phone</span>
            </div>
          </div>

          <PhoneMockup />
        </div>
      </section>

      {/* Two-lane timeline */}
      <section className="border-t border-[#DCE6F2] bg-white px-4 py-20 md:px-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl text-[#0F172A] sm:text-4xl dark:text-white" style={serif}>
            Tuesday, 9:02 am to 9:13 am.
          </h2>
          <p className="mt-3 max-w-lg text-[#475569] dark:text-slate-400">
            Eleven minutes, from approved offer to a complete employee file. Here's who did what.
          </p>

          <div className="mt-12 hidden grid-cols-[1fr_72px_1fr] text-xs font-semibold uppercase tracking-[0.14em] text-[#94A3B8] md:grid">
            <span className="text-right">Jordan, the candidate</span>
            <span />
            <span>You, in HR</span>
          </div>

          <ol className="relative mt-4 md:mt-6">
            <span className="absolute bottom-0 left-[27px] top-0 w-px bg-[#DCE6F2] md:left-1/2 dark:bg-slate-700" />
            {TIMELINE.map((e, i) => (
              <li key={i} className="relative grid grid-cols-[56px_1fr] gap-4 py-4 md:grid-cols-[1fr_72px_1fr] md:gap-0">
                <span
                  className={`relative z-10 flex h-8 items-center justify-center self-start rounded-full bg-[#F3F8FD] font-mono text-xs font-semibold text-[#0F172A] ring-1 ring-[#DCE6F2] md:col-start-2 md:row-start-1 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700`}
                >
                  {e.time}
                </span>
                <p
                  className={`text-[15px] leading-relaxed md:row-start-1 ${
                    e.who === "candidate"
                      ? "md:col-start-1 md:pr-8 md:text-right text-[#0F172A] dark:text-slate-100"
                      : "md:col-start-3 md:pl-8 text-[#475569] dark:text-slate-400"
                  }`}
                >
                  <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8] md:hidden">
                    {e.who === "candidate" ? "Jordan" : "You"}
                  </span>
                  {e.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The packet */}
      <section className="px-4 py-20 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl text-[#0F172A] sm:text-4xl dark:text-white" style={serif}>
            The whole packet, in one sitting.
          </h2>
          <p className="mb-12 mt-3 max-w-lg text-[#475569] dark:text-slate-400">
            Bundle the documents once. Every new hire gets them in order, and you get them back signed.
          </p>
          <PacketStack />
        </div>
      </section>

      {/* Both sides */}
      <section className="px-4 pb-20 md:px-8">
        <div className="container mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-[#FFF4D6] p-8 dark:bg-slate-900">
            <p className="text-2xl text-[#0F172A] dark:text-white" style={serif}>For your new hire</p>
            <ul className="mt-5 space-y-3 text-[15px] text-[#475569] dark:text-slate-400">
              <li>No account to create, no app to install.</li>
              <li>Readable on a phone — no pinch-zooming a PDF.</li>
              <li>A copy of everything they signed, in their inbox.</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-[#0A66C2] p-8 text-white">
            <p className="text-2xl" style={serif}>For your team</p>
            <ul className="mt-5 space-y-3 text-[15px] text-white/80">
              <li>See who's opened, who's signed and who's stuck.</li>
              <li>Automatic reminders, so you're not the one nagging.</li>
              <li>A timestamped audit trail on every document.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-[#DCE6F2] px-4 py-20 text-center md:px-8 dark:border-slate-800">
        <h2 className="mx-auto max-w-2xl text-3xl text-[#0F172A] sm:text-[2.75rem] sm:leading-tight dark:text-white" style={serif}>
          Make your next offer the <span className="bg-[linear-gradient(transparent_62%,#FFC83D_62%)]">easiest thing</span> they sign this year.
        </h2>
        <Link to={ctaHref} className="mt-8 inline-block">
          <Button className="h-12 rounded-full bg-[#0A66C2] px-8 font-semibold text-white hover:bg-[#08519c]">
            Get started free <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
