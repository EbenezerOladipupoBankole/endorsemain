import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { ArrowRight, RotateCcw } from "lucide-react";

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };

const ORIGINAL_CLAUSE =
  "7.2 Payment Terms. Client shall pay all undisputed invoices within thirty (30) days of receipt. Late amounts accrue interest at 1.5% per month.";

const LEDGER = [
  { event: "Document created", at: "2026-08-27 02:31:04", actor: "a.mensah@northwind.co", ip: "203.0.113.18" },
  { event: "Sent for signature", at: "2026-08-27 02:31:40", actor: "a.mensah@northwind.co", ip: "203.0.113.18" },
  { event: "Email link opened", at: "2026-08-27 02:39:12", actor: "legal@enterprise.com", ip: "198.51.100.42" },
  { event: "Identity confirmed (email token)", at: "2026-08-27 02:39:15", actor: "legal@enterprise.com", ip: "198.51.100.42" },
  { event: "Signature applied", at: "2026-08-27 02:43:10", actor: "legal@enterprise.com", ip: "198.51.100.42" },
  { event: "Document sealed · SHA-256 recorded", at: "2026-08-27 02:43:11", actor: "Endorse", ip: "—" },
];

const FRAMEWORKS = [
  {
    name: "ESIGN Act",
    where: "United States (federal)",
    says: "A signature or contract can't be denied legal effect solely because it's electronic.",
    how: "Signer consent, intent to sign and an associated record are captured for every document.",
  },
  {
    name: "UETA",
    where: "United States (49 states + DC)",
    says: "Electronic records and signatures satisfy state laws requiring writing or a signature.",
    how: "Records are retained in a form that can be accurately reproduced later.",
  },
  {
    name: "eIDAS",
    where: "European Union",
    says: "Electronic signatures can't be refused as evidence solely for being electronic (Art. 25).",
    how: "Designed for simple electronic signatures (SES), with a full audit trail attached.",
  },
];

async function sha256(text: string) {
  if (!window.crypto?.subtle) return null;
  const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function Section({ mark, title, intro, children }: { mark: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section className="border-t border-slate-300 px-4 py-16 md:px-8 md:py-20 dark:border-slate-800">
      <div className="container mx-auto grid max-w-6xl gap-10 lg:grid-cols-[260px_1fr] lg:gap-16">
        <div>
          <p className="font-mono text-sm font-semibold text-[#0A66C2]">{mark}</p>
          <h2 className="mt-2 text-3xl leading-tight text-slate-900 dark:text-white" style={serif}>{title}</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{intro}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function Certificate() {
  return (
    <div className="relative mx-auto w-full max-w-md rotate-[0.6deg] bg-white p-7 shadow-[0_1px_0_#e7e5e4,0_30px_60px_-30px_rgba(28,25,23,0.35)] ring-1 ring-slate-200 sm:p-9">
      <div className="border border-slate-300 p-5 sm:p-6">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Certificate of Completion</p>
        <p className="mt-2 text-center text-xl text-slate-900" style={serif}>Master Services Agreement</p>
        <p className="mt-1 text-center font-mono text-[10px] text-slate-400">Envelope ED-99481</p>

        <dl className="mt-6 space-y-2.5 text-[12px]">
          {[
            ["Signer", "legal@enterprise.com"],
            ["Signed", "27 Aug 2026, 02:43:10 UTC"],
            ["IP address", "198.51.100.42"],
            ["Auth method", "Email token"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-dotted border-slate-300 pb-1.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="truncate text-right font-medium text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">SHA-256</p>
            <p className="mt-1 break-all font-mono text-[10px] leading-snug text-slate-600">e3b0c44298fc1c149afbf4c8 996fb92427ae41e4649b934c</p>
          </div>
          <svg viewBox="0 0 100 100" className="h-20 w-20 shrink-0 text-[#0A66C2]" aria-hidden>
            <defs>
              <path id="seal-path" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
            </defs>
            <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="1" />
            <text fontSize="8.5" letterSpacing="2.2" fill="currentColor" fontFamily="Inter, sans-serif" fontWeight="600">
              <textPath href="#seal-path">ENDORSE · SEALED · VERIFIED ·</textPath>
            </text>
            <text x="50" y="56" textAnchor="middle" fontSize="18" fill="currentColor" style={{ fontFamily: "'Playfair Display', serif" }}>
              §
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

function TamperDemo() {
  const [text, setText] = useState(ORIGINAL_CLAUSE);
  const [originalHash, setOriginalHash] = useState<string | null>(null);
  const [currentHash, setCurrentHash] = useState<string | null>(null);

  useEffect(() => {
    sha256(ORIGINAL_CLAUSE).then(setOriginalHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    sha256(text).then((h) => !cancelled && setCurrentHash(h));
    return () => {
      cancelled = true;
    };
  }, [text]);

  const supported = originalHash !== null;
  const intact = supported && currentHash === originalHash;

  return (
    <div className="bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Signed clause — try editing it</span>
        <button
          onClick={() => setText(ORIGINAL_CLAUSE)}
          className="-my-2 inline-flex min-h-[40px] items-center gap-1.5 px-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        spellCheck={false}
        className="block w-full resize-none bg-transparent px-5 py-4 text-[17px] leading-relaxed text-slate-900 outline-none dark:text-slate-100"
        style={serif}
      />

      <div className="grid border-t border-slate-200 font-mono text-[11px] sm:grid-cols-2 dark:border-slate-800">
        <div className="border-b border-slate-200 px-5 py-4 sm:border-b-0 sm:border-r dark:border-slate-800">
          <p className="text-slate-400">Fingerprint at signing</p>
          <p className="mt-1.5 break-all leading-relaxed text-slate-700 dark:text-slate-300">{originalHash ?? "—"}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-slate-400">Fingerprint now</p>
          <p className={`mt-1.5 break-all leading-relaxed ${intact ? "text-slate-700 dark:text-slate-300" : "text-red-700 dark:text-red-400"}`}>
            {currentHash ?? "—"}
          </p>
        </div>
      </div>

      <div
        className={`px-5 py-3 text-sm font-medium ${
          !supported
            ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            : intact
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300"
        }`}
      >
        {!supported
          ? "Your browser blocked the hashing API on this connection, so the live demo can't run here."
          : intact
            ? "Fingerprints match. This is the document that was signed."
            : "Fingerprints don't match. Even a one-character change is detected — the document has been altered since signing."}
      </div>
    </div>
  );
}

export default function LegalCompliance() {
  const { user } = useAuth();
  const ctaHref = user ? "/dashboard" : "/auth?redirect=/dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />

      {/* Hero */}
      <section className="px-4 pb-20 pt-14 md:px-8 md:pt-20">
        <div className="container mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0A66C2]">Endorse for Legal &amp; Compliance</p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.08] text-slate-900 sm:text-[3.6rem] dark:text-white" style={serif}>
              Every signature,
              <br />
              with its evidence attached.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Each document signed on Endorse is sealed with a cryptographic fingerprint and a full record of who signed,
              when, and from where — so if an agreement is ever questioned, you have more than a name on a page.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link to={ctaHref}>
                <Button className="h-12 rounded-full bg-[#0A66C2] px-7 font-semibold text-white hover:bg-[#08519c]">
                  Start signing securely <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <a href="#tamper" className="inline-flex min-h-[44px] items-center text-sm font-medium text-slate-700 underline decoration-[#FFC83D] decoration-2 underline-offset-4 hover:text-[#0A66C2] dark:text-slate-300">
                See tamper detection work
              </a>
            </div>
          </div>

          <Certificate />
        </div>
      </section>

      <div id="tamper" className="scroll-mt-20">
        <Section
          mark="§ 1"
          title="Tamper evidence you can test."
          intro="When a document is signed, Endorse records its SHA-256 fingerprint. Change anything afterwards — a comma, a number — and the fingerprint no longer matches. This demo runs the real algorithm in your browser."
        >
          <TamperDemo />
        </Section>
      </div>

      <Section
        mark="§ 2"
        title="The record behind every signature."
        intro="The certificate of completion includes an event log like this one, kept with the signed document and exportable as a PDF."
      >
        <div className="overflow-x-auto bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800">
                <th className="px-5 py-3 font-semibold">Event</th>
                <th className="px-5 py-3 font-semibold">Time (UTC)</th>
                <th className="px-5 py-3 font-semibold">Actor</th>
                <th className="px-5 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {LEDGER.map((r) => (
                <tr key={r.event}>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{r.event}</td>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{r.at}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.actor}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        mark="§ 3"
        title="Where it stands up."
        intro="Electronic signatures are recognised across most major jurisdictions. Here's how Endorse lines up with the main frameworks."
      >
        <div className="divide-y divide-slate-300 border-y border-slate-300 dark:divide-slate-800 dark:border-slate-800">
          {FRAMEWORKS.map((f) => (
            <div key={f.name} className="grid gap-3 py-6 md:grid-cols-[180px_1fr_1fr] md:gap-8">
              <div>
                <p className="text-xl text-slate-900 dark:text-white" style={serif}>{f.name}</p>
                <p className="mt-1 text-xs text-slate-500">{f.where}</p>
              </div>
              <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">The law</span>
                {f.says}
              </p>
              <p className="text-[15px] leading-relaxed text-slate-800 dark:text-slate-200">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0A66C2]">Endorse</span>
                {f.how}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        mark="§ 4"
        title="Security controls."
        intro="What protects documents between signing and the day you need them."
      >
        <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {[
            ["Encryption", "AES-256 at rest, TLS in transit."],
            ["Access control", "Role-based permissions, so contracts are visible only to the people who need them."],
            ["Retention", "Set how long agreements are kept and when they're archived."],
            ["Export", "Download the signed PDF and its certificate together, any time."],
          ].map(([k, v]) => (
            <div key={k} className="border-l-[3px] border-[#FFC83D] pl-4">
              <dt className="font-semibold text-slate-900 dark:text-white">{k}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* Closing */}
      <section className="border-t border-slate-300 px-4 py-16 md:px-8 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-6 border-t-4 border-[#FFC83D] bg-[#0A66C2] p-8 md:flex-row md:items-center md:p-10">
            <p className="max-w-xl text-2xl leading-snug text-white sm:text-3xl" style={serif}>
              Sign your next agreement with the evidence built in.
            </p>
            <Link to={ctaHref}>
              <Button className="h-12 rounded-full bg-[#FFC83D] px-7 font-bold text-slate-900 hover:bg-[#e6b435]">
                Get started free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-slate-500">
            Endorse is not a law firm and this page is not legal advice. Requirements vary by jurisdiction and document type
            — some documents (for example certain wills or court filings) may need a different form of signature. Check with
            your counsel for your specific use.
          </p>
        </div>
      </section>
    </div>
  );
}
