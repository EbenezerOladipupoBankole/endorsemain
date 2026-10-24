import { Bell, CheckCircle2, Link2, Mail, MessageCircle, ShieldCheck, Users } from "lucide-react";
import { FeaturePage } from "@/components/FeaturePage";

const RECIPIENTS = [
  { name: "Tolu Adeyemi", via: "Email", icon: Mail, signed: true },
  { name: "Amina Hassan", via: "WhatsApp", icon: MessageCircle, signed: true },
  { name: "Thabo Nkosi", via: "Email", icon: Mail, signed: false },
];

function TrackingMockup() {
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-[#DCE6F2] bg-white p-5 sm:p-6 shadow-[0_30px_60px_-30px_rgba(10,102,194,0.35)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[#0F172A] dark:text-white">Supplier agreement</p>
        <span className="rounded-full bg-[#FFC83D]/30 px-2.5 py-1 text-[11px] font-bold text-[#0F172A] dark:text-[#FFC83D]">2 of 3 signed</span>
      </div>
      <ul className="mt-5 divide-y divide-[#E8EFF7] dark:divide-slate-800">
        {RECIPIENTS.map((r) => (
          <li key={r.name} className="flex items-center gap-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A66C2]/10 text-[#0A66C2]">
              <r.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[#0F172A] dark:text-white">{r.name}</span>
              <span className="block text-xs text-[#64748B]">via {r.via}</span>
            </span>
            {r.signed ? (
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Signed
              </span>
            ) : (
              <span className="shrink-0 rounded-full border border-[#DCE6F2] px-2.5 py-1 text-xs font-semibold text-[#0A66C2] dark:border-slate-700">
                Remind
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProductSendForSignature() {
  return (
    <FeaturePage
      metaTitle="Send for Signature — Collect e-signatures by email or WhatsApp | Endorse"
      metaDescription="Send a document for signature by email or WhatsApp, see who has signed, send reminders and get notified when it's done. Free to start with Endorse."
      eyebrow="Send for Signature"
      title={<>Get it signed without <em className="text-[#0A66C2]">chasing</em> anyone.</>}
      intro="Send a document to one person or several, by email or WhatsApp. See who has signed at a glance and get an email the moment they do."
      appPath="/team"
      mockup={<TrackingMockup />}
      stepsTitle="How it works"
      steps={[
        { title: "Choose a document", text: "Upload a PDF, or start from a ready-made template like an NDA or offer letter." },
        { title: "Add your signers", text: "Enter each person's email address or WhatsApp number, and add a personal note if you like." },
        { title: "Track and get notified", text: "Watch each signature come in, nudge anyone who hasn't signed, and download the signed copy." },
      ]}
      highlightsTitle="Built for getting a yes"
      highlights={[
        { icon: MessageCircle, title: "Email or WhatsApp", text: "Reach people where they actually are. WhatsApp signers don't need an Endorse account." },
        { icon: ShieldCheck, title: "Verified signers", text: "Email signers sign in with the address you sent to. WhatsApp signers confirm a one-time code sent to their number." },
        { icon: Users, title: "Several signers at once", text: "Send to as many people as you need — each gets their own copy and their own status." },
        { icon: CheckCircle2, title: "Live status", text: "See what's awaiting signature and what's signed, with search and filters to find any document fast." },
        { icon: Bell, title: "Reminders in one click", text: "Resend the invitation to anyone who hasn't signed yet." },
        { icon: Link2, title: "Share it your way", text: "Prefer your own app? Copy the signing link, or share it through your email or WhatsApp." },
      ]}
      faqs={[
        { q: "Do my signers need an Endorse account?", a: "WhatsApp signers don't — they confirm a one-time code sent to their phone. Email signers sign in or create a free account with the address you sent to, so you know the right person signed." },
        { q: "Will I know when someone signs?", a: "Yes. You get an email with a link to the signed copy as soon as they sign, and the status updates on your dashboard straight away." },
        { q: "Can I send to more than one person?", a: "Yes. Each person gets their own copy to sign, and you can track each one separately." },
        { q: "What can I send?", a: "Any PDF, or one of the templates — Mutual NDA, Services Agreement, Offer Letter — or a template of your own." },
      ]}
      closingTitle={<>Send it today. <span className="text-[#FFC83D]">Get it back signed.</span></>}
    />
  );
}
