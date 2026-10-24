import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useDocumentMeta } from "@/components/FeaturePage";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthContext";
import { CheckCircle2, Mail, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };

// Mirrors what Endorse stores for a signed document (see SignDocument / AgreementsList).
const RECORD = [
  { event: "Sent for signature", detail: "By email to legal@enterprise.com", at: "27 Aug 2026, 02:31" },
  { event: "Signed", detail: "By the verified invitee — signature image and where all 3 fields were placed", at: "27 Aug 2026, 02:43" },
];

const FRAMEWORKS = [
  {
    name: "Evidence Act 2011",
    where: "Nigeria (section 93)",
    says: "An electronic signature can be used to prove a document was signed, where it's shown the signer meant to sign it.",
    how: "Each signer adopts their signature with an explicit agreement, after proving who they are by email or WhatsApp code.",
  },
  {
    name: "ECT Act 2002",
    where: "South Africa (section 13)",
    says: "Electronic signatures are valid for most agreements. Where a law specifically requires a signature, an advanced electronic signature is needed.",
    how: "Endorse provides simple electronic signatures — suitable for most commercial agreements, not for documents that legally need an advanced one.",
  },
  {
    name: "Electronic Transactions Act 2008",
    where: "Ghana (Act 772)",
    says: "Electronic records and signatures can't be denied legal effect solely because they're electronic.",
    how: "Signed documents are stored and can be downloaded as a PDF whenever you need them.",
  },
  {
    name: "ESIGN Act",
    where: "United States (federal)",
    says: "A signature or contract can't be denied legal effect solely because it's electronic.",
    how: "Signers adopt their signature by ticking an explicit agreement before they sign, and the signed record is kept.",
  },
  {
    name: "UETA",
    where: "United States (49 states + DC)",
    says: "Electronic records and signatures satisfy state laws requiring writing or a signature.",
    how: "Signed documents are stored and can be downloaded as a PDF whenever you need them.",
  },
  {
    name: "eIDAS",
    where: "European Union",
    says: "Electronic signatures can't be refused as evidence solely for being electronic (Art. 25).",
    how: "Endorse provides simple electronic signatures (SES), with each signer's identity checked by email or WhatsApp.",
  },
];

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

function RecordCard() {
  return (
    <div className="relative mx-auto w-full max-w-md bg-white p-6 shadow-[0_1px_0_#e7e5e4,0_30px_60px_-30px_rgba(28,25,23,0.35)] ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">Signing record</p>
      <p className="mt-2 text-xl text-slate-900 dark:text-white" style={serif}>Master Services Agreement</p>

      <dl className="mt-6 space-y-2.5 text-[13px]">
        {[
          ["Signer", "legal@enterprise.com"],
          ["Verified by", "Invited email address"],
          ["Signed", "27 Aug 2026, 02:43"],
          ["Status", "Signed"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-dotted border-slate-300 pb-1.5 dark:border-slate-700">
            <dt className="text-slate-500">{k}</dt>
            <dd className="truncate text-right font-medium text-slate-800 dark:text-slate-200">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="text-2xl italic text-[#0A66C2]" style={serif}>A. Mensah</span>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> Signed
        </span>
      </div>
    </div>
  );
}

export default function LegalCompliance() {
  const { user } = useAuth();
  useDocumentMeta(
    "Endorse for Legal & Compliance — Verified signers, a record of every signature",
    "Every signer proves who they are by email or WhatsApp code, and every signed document records who signed and when. Simple electronic signatures under ESIGN, UETA and eIDAS."
  );
  const ctaHref = user ? "/dashboard" : "/auth?mode=signup&redirect=%2Fdashboard";

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <SiteHeader />

      {/* Hero */}
      <section className="px-4 pb-20 pt-14 md:px-8 md:pt-20">
        <div className="container mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0A66C2]">Endorse for Legal &amp; Compliance</p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.08] text-slate-900 sm:text-[3.6rem] dark:text-white" style={serif}>
              The right person,
              <br />
              on the record.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Every signer proves who they are before they sign, and every signed document keeps who signed, what they
              placed on the page and exactly when — so you have more than a name on a page.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Button asChild className="h-12 rounded-full bg-[#0A66C2] px-7 font-semibold text-white hover:bg-[#08519c]">
                <Link to={ctaHref}>Start signing securely</Link>
              </Button>
            </div>
          </div>

          <RecordCard />
        </div>
      </section>

      <Section
        mark="§ 1"
        title="Signers prove who they are."
        intro="A signing link on its own isn't enough. Before anyone can sign, Endorse checks they're the person you sent it to."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <Mail className="h-5 w-5 text-[#0A66C2]" />
            <p className="mt-4 text-xl text-slate-900 dark:text-white" style={serif}>By email</p>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              The signer signs in with the exact, verified email address you sent the document to. Anyone else who
              opens the link can't see the document.
            </p>
          </div>
          <div className="bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <MessageCircle className="h-5 w-5 text-[#0A66C2]" />
            <p className="mt-4 text-xl text-slate-900 dark:text-white" style={serif}>By WhatsApp</p>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              The signer enters a 6-digit code sent to the WhatsApp number you entered. Codes expire after 5 minutes
              and lock after 5 wrong attempts.
            </p>
          </div>
        </div>
      </Section>

      <Section
        mark="§ 2"
        title="The record behind every signature."
        intro="Here's what Endorse keeps for each document you send, visible to you in its signing record."
      >
        <div className="overflow-x-auto bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:border-slate-800">
                <th className="px-5 py-3 font-semibold">Event</th>
                <th className="px-5 py-3 font-semibold">Detail</th>
                <th className="px-5 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {RECORD.map((r) => (
                <tr key={r.event}>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{r.event}</td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{r.detail}</td>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{r.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          For WhatsApp signers you also see when the message was delivered and read, and when they opened the document.
          You're emailed a link to the signed copy as soon as it's signed.
        </p>
      </Section>

      <Section
        mark="§ 3"
        title="Where it stands up."
        intro="Electronic signatures are recognised across Africa and most major jurisdictions. Here's how Endorse lines up with some of the main frameworks."
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
            ["Encryption", "TLS in transit, and AES-256 at rest on Google Cloud."],
            ["Access control", "Only you and the people you send a document to can open it."],
            ["Delete any time", "Delete a sent document and its signing link stops working immediately."],
            ["Export", "Download the signed PDF whenever you need it."],
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
              Know exactly who signed, and when.
            </p>
            <Button asChild className="h-12 rounded-full bg-[#FFC83D] px-7 font-bold text-slate-900 hover:bg-[#e6b435]">
              <Link to={ctaHref}>Get started free</Link>
            </Button>
          </div>
          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-slate-500">
            Endorse is not a law firm and this page is not legal advice. Requirements vary by jurisdiction and document type
            — some documents (for example certain wills or court filings) may need a different form of signature. Check with
            your counsel for your specific use.
          </p>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
