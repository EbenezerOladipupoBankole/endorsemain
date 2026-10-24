import { BadgeCheck, Calculator, Coins, FileDown, Filter, Receipt } from "lucide-react";
import { FeaturePage, serif } from "@/components/FeaturePage";

const LINES = [
  { item: "Brand design", qty: 1, price: 18000 },
  { item: "Website pages", qty: 4, price: 4500 },
];

function InvoiceMockup() {
  const subtotal = LINES.reduce((sum, l) => sum + l.qty * l.price, 0);
  const tax = subtotal * 0.15;
  const fmt = (n: number) => `R ${n.toLocaleString("en-ZA")}`;
  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-[#DCE6F2] bg-white p-6 shadow-[0_30px_60px_-30px_rgba(10,102,194,0.35)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl text-[#0F172A] dark:text-white" style={serif}>Invoice</p>
          <p className="text-xs text-[#64748B]">INV-0042 · Due 5 Nov 2026</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Paid</span>
      </div>
      <table className="mt-5 w-full text-sm">
        <tbody>
          {LINES.map((l) => (
            <tr key={l.item} className="border-b border-[#E8EFF7] dark:border-slate-800">
              <td className="py-2 text-[#0F172A] dark:text-slate-200">{l.item} <span className="text-[#94A3B8]">× {l.qty}</span></td>
              <td className="py-2 text-right font-semibold text-[#0F172A] dark:text-white">{fmt(l.qty * l.price)}</td>
            </tr>
          ))}
          <tr>
            <td className="pt-3 text-[#64748B]">VAT 15%</td>
            <td className="pt-3 text-right text-[#64748B]">{fmt(tax)}</td>
          </tr>
          <tr>
            <td className="pt-1 font-bold text-[#0F172A] dark:text-white">Total</td>
            <td className="pt-1 text-right text-lg font-bold text-[#0A66C2]">{fmt(subtotal + tax)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ProductInvoices() {
  return (
    <FeaturePage
      metaTitle="Free Invoice Generator — PDF invoices in Naira, Shillings, Cedis, Rand and more | Endorse"
      metaDescription="Create professional invoices with line items, tax and discounts in Naira, Kenyan Shillings, Ghanaian Cedis, Rand, Dollars and more. Download as PDF and track what's been paid. Free with Endorse."
      eyebrow="Invoices"
      title={<>Professional invoices, <em className="text-[#0A66C2]">done in a minute</em>.</>}
      intro="Add your client, your line items and your tax rate — Endorse does the maths and gives you a clean PDF invoice to send. Then keep track of what's been paid."
      appPath="/invoices"
      mockup={<InvoiceMockup />}
      stepsTitle="How it works"
      steps={[
        { title: "Add the details", text: "Your business name and tax ID, your client, and a due date." },
        { title: "List what you're charging", text: "Add line items with quantities and prices. Tax, discount and totals calculate themselves." },
        { title: "Send and track", text: "Email the PDF to your client or download it, then mark the invoice as paid when the money arrives." },
      ]}
      highlightsTitle="All the basics, none of the spreadsheet"
      highlights={[
        { icon: Calculator, title: "Automatic totals", text: "Quantities, prices, tax percentage and discounts add up for you — no formulas to break." },
        { icon: Coins, title: "10 currencies", text: "Naira, Kenyan Shilling, Ghanaian Cedi and Rand, plus US Dollar, Euro, Pound, Canadian and Australian Dollar and Rupee." },
        { icon: FileDown, title: "PDF download", text: "A clean, professional PDF with your tax ID, line items and notes, ready to email or print." },
        { icon: BadgeCheck, title: "Paid or pending", text: "Mark invoices as paid in one click so you always know who still owes you." },
        { icon: Filter, title: "See who owes you", text: "Switch between paid, pending and overdue invoices, with totals for each. Unpaid invoices past their due date move to overdue on their own." },
        { icon: Receipt, title: "Notes and terms", text: "Add payment instructions or terms to the bottom of any invoice." },
      ]}
      faqs={[
        { q: "Is it free?", a: "Yes. Create an account and start making invoices straight away." },
        { q: "How do I send an invoice to my client?", a: "Click send and Endorse emails the PDF to your client with your message. You can also download the PDF and send it yourself on WhatsApp or by email." },
        { q: "Where are my invoices saved?", a: "For now, invoices are saved in the browser on the device you create them on. Download a PDF of any invoice you want to keep a permanent copy of." },
        { q: "Can my client pay online through the invoice?", a: "Not yet. Add your bank details or payment instructions in the notes, then mark the invoice as paid when the money arrives." },
      ]}
      closingTitle={<>Get your next invoice out <span className="text-[#FFC83D]">today</span>.</>}
    />
  );
}
