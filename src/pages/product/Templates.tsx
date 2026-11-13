import { FeaturePage, serif } from "@/components/FeaturePage";

function TemplateMockup() {
  const field = (text: string) => (
    <span className="rounded bg-[#FFC83D]/40 px-1 font-semibold text-[#0F172A] dark:text-white">{text}</span>
  );
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-[#DCE6F2] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(10,102,194,0.35)] dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">Template · Offer Letter</p>
      <p className="mt-3 text-2xl text-[#0F172A] dark:text-white" style={serif}>Dear {field("Kofi Mensah")},</p>
      <p className="mt-3 text-sm leading-relaxed text-[#475569] dark:text-slate-300">
        We are pleased to offer you the position of {field("Operations Lead")} at {field("Brightway Ltd, Accra")}, starting{" "}
        {field("3 November 2026")}, with an annual salary of {field("GH₵ 180,000")}.
      </p>
      <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-mono text-[#0A66C2]">
        {["{{RECIPIENT_NAME}}", "{{JOB_TITLE}}", "{{START_DATE}}", "{{SALARY}}"].map((t) => (
          <span key={t} className="rounded-md bg-[#0A66C2]/10 px-2 py-1">{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function ProductTemplates() {
  return (
    <FeaturePage
      metaTitle="Agreement Templates — NDA, offer letter, services agreement | Endorse"
      metaDescription="Start from a ready-made NDA, services agreement or offer letter, or save your own. Each signer's name, email and the date fill in automatically. Free to start with Endorse."
      eyebrow="Templates"
      title={<>Write it once. <em className="text-[#0A66C2]">Send it</em> to everyone.</>}
      intro="Turn the agreements you send again and again into templates. Each signer's name, email and today's date fill in for you — you only type what's different."
      appPath="/team"
      mockup={<TemplateMockup />}
      stepsTitle="How it works"
      steps={[
        { title: "Pick a template", text: "Start with a Mutual NDA, Services Agreement or Offer Letter, or one you've saved yourself." },
        { title: "Fill in the blanks", text: "Signer details and the date fill in automatically. Add anything else, like a job title or fee, once." },
        { title: "Send for signature", text: "Each person gets their own personalised copy to sign by email or WhatsApp." },
      ]}
      highlightsTitle="Less typing, fewer mistakes"
      highlights={[
        { title: "Ready-made agreements", text: "Mutual NDA, Services Agreement and Offer Letter are ready to use from day one." },
        { title: "Your own templates", text: "Save the agreements your business uses and reuse them whenever you need." },
        { title: "Automatic details", text: "Each signer's name and email, your name and organisation, and today's date fill in on their copy." },
        { title: "Custom fields", text: "Add your own placeholders — like {{FEE}} or {{START_DATE}} — and fill them in when you send." },
        { title: "One template, many signers", text: "Send the same agreement to several people and each copy is personalised to them." },
        { title: "Straight to signing", text: "Templates go out through Send for Signature, so you can track every copy." },
      ]}
      faqs={[
        { q: "Which templates are included?", a: "A Mutual Non-Disclosure Agreement, a Services Agreement and an Offer Letter. You can also create and save your own." },
        { q: "How do the blanks get filled in?", a: "Placeholders like {{RECIPIENT_NAME}} and {{DATE}} fill in automatically. Any other placeholder you add becomes a box to fill in when you send." },
        { q: "Can I use my own wording?", a: "Yes. Create a template with your own text and placeholders, save it, and it's there next time." },
        { q: "Are the templates legal advice?", a: "No. They're a starting point — check that the wording suits your situation before you send." },
      ]}
      closingTitle={<>Stop retyping the <span className="text-[#FFC83D]">same agreement</span>.</>}
    />
  );
}
