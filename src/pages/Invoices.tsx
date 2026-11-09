import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AppHeader } from "@/components/AppHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { httpsCallable } from "@/lib/callable";
import { functions } from "@/components/client";
import {
  Receipt,
  Plus,
  Search,
  Download,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Trash2,
  X,
  DollarSign,
  Building2,
  Upload,
  Check,
  Mail,
} from "lucide-react";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound" },
  { code: "NGN", symbol: "₦", label: "NGN (₦) - Nigerian Naira" },
  { code: "KES", symbol: "KSh", label: "KES (KSh) - Kenyan Shilling" },
  { code: "GHS", symbol: "GH₵", label: "GHS (GH₵) - Ghanaian Cedi" },
  { code: "CAD", symbol: "CA$", label: "CAD ($) - Canadian Dollar" },
  { code: "AUD", symbol: "AU$", label: "AUD ($) - Australian Dollar" },
  { code: "INR", symbol: "₹", label: "INR (₹) - Indian Rupee" },
  { code: "ZAR", symbol: "R", label: "ZAR (R) - South African Rand" },
];

export interface Invoice {
  id: string;
  number: string;
  companyName: string;
  companyAddress: string;
  companyTaxId?: string;
  companyLogo?: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  currencySymbol: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: "paid" | "pending" | "overdue" | "draft";
  notes?: string;
}

const STATUS_META: Record<
  Invoice["status"],
  { label: string; badge: string; bar: string; icon: typeof CheckCircle2 }
> = {
  paid: { label: "Paid", badge: "bg-success/10 text-success border-success/20", bar: "bg-success", icon: CheckCircle2 },
  pending: { label: "Pending", badge: "bg-warning/10 text-warning border-warning/20", bar: "bg-warning", icon: Clock },
  overdue: { label: "Overdue", badge: "bg-destructive/10 text-destructive border-destructive/20", bar: "bg-destructive", icon: AlertCircle },
  draft: { label: "Draft", badge: "bg-muted text-muted-foreground border-border", bar: "bg-muted-foreground/40", icon: FileText },
};

const getInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : trimmed.slice(0, 2).toUpperCase();
};

/** Pending invoices past their due date count as overdue. */
const statusOf = (inv: Invoice): Invoice["status"] =>
  inv.status === "pending" && inv.dueDate < new Date().toISOString().split("T")[0] ? "overdue" : inv.status;

const TABS: { id: "all" | "paid" | "pending" | "overdue"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "overdue", label: "Overdue" },
];

export default function Invoices() {
  const { user, userProfile } = useAuth();

  // Load invoices from localStorage (default to [] for new users)
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem("endorse_user_invoices");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem("endorse_user_invoices", JSON.stringify(invoices));
    } catch (err) {
      console.error("Failed to save invoices to localStorage", err);
    }
  }, [invoices]);

  const [activeTab, setActiveTab] = useState<"all" | "paid" | "pending" | "overdue">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sendEmailModalInvoice, setSendEmailModalInvoice] = useState<Invoice | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Your business details carry over from the last invoice you made.
  const lastInvoice = invoices[0];
  const [companyName, setCompanyName] = useState(lastInvoice?.companyName ?? user?.displayName ?? "");
  const [companyAddress, setCompanyAddress] = useState(lastInvoice?.companyAddress ?? "");
  const [companyTaxId, setCompanyTaxId] = useState(lastInvoice?.companyTaxId ?? "");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState(lastInvoice?.notes ?? "");

  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, amount: 0 },
  ]);

  useEffect(() => {
    if (!showCreateModal && !sendEmailModalInvoice) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showCreateModal, sendEmailModalInvoice]);

  const currentCurrency = CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  // Calculations
  const calculateFormSubtotal = () => formItems.reduce((acc, item) => acc + item.amount, 0);
  const calculateFormTax = () => (calculateFormSubtotal() * taxRate) / 100;
  const calculateFormTotal = () => Math.max(0, calculateFormSubtotal() + calculateFormTax() - discount);

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setFormItems([...formItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (formItems.length === 1) {
      toast.info("Invoice must have at least one line item.");
      return;
    }
    setFormItems(formItems.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, val: string | number) => {
    setFormItems(
      formItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === "quantity" || field === "unitPrice") {
            updated.amount = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
        toast.success("Logo added.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInvoice = (status: "pending" | "draft" = "pending") => {
    if (!clientName.trim() || !clientEmail.trim()) {
      toast.error("Add the client's name and email.");
      return;
    }
    if (formItems.some((item) => !item.description.trim())) {
      toast.error("Each line item needs a description.");
      return;
    }

    const nextNum = `INV-2026-${(invoices.length + 1).toString().padStart(3, "0")}`;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number: nextNum,
      companyName: companyName.trim(),
      companyAddress: companyAddress.trim(),
      companyTaxId: companyTaxId.trim(),
      companyLogo: companyLogo || undefined,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientAddress: clientAddress.trim(),
      issueDate: new Date().toISOString().split("T")[0],
      dueDate,
      currency: currentCurrency.code,
      currencySymbol: currentCurrency.symbol,
      items: formItems,
      subtotal: calculateFormSubtotal(),
      taxRate,
      taxAmount: calculateFormTax(),
      discount,
      total: calculateFormTotal(),
      status,
      notes,
    };

    setInvoices([newInvoice, ...invoices]);
    setShowCreateModal(false);
    resetForm();
    toast.success(`Invoice ${nextNum} saved.`);
  };

  const resetForm = () => {
    setClientName("");
    setClientEmail("");
    setClientAddress("");
    setTaxRate(0);
    setDiscount(0);
    setFormItems([{ id: "1", description: "", quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleClearInvoices = () => {
    if (!window.confirm(`Delete all ${invoices.length} invoices? This can't be undone.`)) return;
    setInvoices([]);
    localStorage.removeItem("endorse_user_invoices");
    toast.info("All invoices deleted.");
  };

  const handleMarkAsPaid = (id: string) => {
    setInvoices(
      invoices.map((inv) => (inv.id === id ? { ...inv, status: "paid" } : inv))
    );
    toast.success("Marked as paid.");
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter((inv) => inv.id !== id));
    toast.success("Invoice deleted.");
  };

  const handleOpenEmailModal = (inv: Invoice) => {
    setSendEmailModalInvoice(inv);
    setEmailSubject(`Invoice ${inv.number} from ${inv.companyName || "Endorse"}`);
    setEmailBody(
      `Dear ${inv.clientName},\n\nPlease find your invoice ${inv.number} attached for ${inv.currencySymbol}${inv.total.toLocaleString()}.\n\nDue Date: ${inv.dueDate}\n\nPayment Notes: ${inv.notes || "None"}\n\nThank you for doing business with us!\n\nBest regards,\n${inv.companyName || "Endorse Team"}`
    );
  };

  const handleExecuteSendEmail = async () => {
    if (!sendEmailModalInvoice) return;
    const inv = sendEmailModalInvoice;
    setIsSendingEmail(true);

    try {
      // The email function only accepts a plain "data:application/pdf;base64," URI.
      const base64 = buildInvoicePdf(inv).output("datauristring").split(",")[1];
      const sendFn = httpsCallable(functions, "sendDocument");
      await sendFn({
        recipientEmail: inv.clientEmail,
        pdfBase64: `data:application/pdf;base64,${base64}`,
        documentName: `Invoice ${inv.number}`,
        kind: "invoice",
        subject: emailSubject,
        message: emailBody,
      });
      toast.success(`Invoice ${inv.number} sent to ${inv.clientEmail}.`);
      setSendEmailModalInvoice(null);
    } catch (e: any) {
      console.error("Invoice email failed", e);
      toast.error(
        e?.message
          ? `Couldn't send the invoice: ${e.message}`
          : "Couldn't send the invoice. Download the PDF and attach it to an email instead."
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Fallback to mailto link
  const handleOpenMailto = (inv: Invoice) => {
    const subject = encodeURIComponent(`Invoice ${inv.number} from ${inv.companyName || "Endorse"}`);
    const body = encodeURIComponent(
      `Dear ${inv.clientName},\n\nHere is your invoice ${inv.number} for ${inv.currencySymbol}${inv.total.toLocaleString()}.\nDue Date: ${inv.dueDate}\n\nThank you!`
    );
    window.location.href = `mailto:${inv.clientEmail}?subject=${subject}&body=${body}`;
  };

  // Brand blue (#2A6DF4), Helvetica throughout.
  const buildInvoicePdf = (inv: Invoice) => {
    const doc = new jsPDF();
    // jsPDF's built-in Helvetica only has Western European characters, so symbols like ₦, GH₵ and ₹
    // would print as garbage; use the currency code ("NGN 1,000.00") for those instead.
    const rawSym = inv.currencySymbol || "$";
    const sym = /^[\x20-\x7E£€]+$/.test(rawSym) ? rawSym : `${inv.currency || rawSym} `;
    const BRAND = [42, 109, 244] as const;

    // Top Header Banner
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(inv.companyName ? inv.companyName.toUpperCase() : "INVOICE", 15, 22);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("INVOICE", 195, 22, { align: "right" });

    // Company & Client Details Section
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);

    // Left Column: Company Details
    doc.setFont("helvetica", "bold");
    doc.text("FROM:", 15, 48);
    doc.setFont("helvetica", "normal");
    if (inv.companyName) doc.text(inv.companyName, 15, 54);
    if (inv.companyAddress) doc.text(inv.companyAddress, 15, 60);
    if (inv.companyTaxId) doc.text(`Tax ID: ${inv.companyTaxId}`, 15, 66);

    // Right Column: Client Details & Invoice Meta
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE DETAILS:", 125, 48);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${inv.number}`, 125, 54);
    doc.text(`Issue Date: ${inv.issueDate}`, 125, 60);
    doc.text(`Due Date: ${inv.dueDate}`, 125, 66);
    doc.text(`Status: ${STATUS_META[statusOf(inv)].label}`, 125, 72);

    doc.setFont("helvetica", "bold");
    doc.text("BILLED TO:", 125, 82);
    doc.setFont("helvetica", "normal");
    doc.text(inv.clientName, 125, 88);
    doc.text(inv.clientEmail, 125, 94);
    if (inv.clientAddress) doc.text(inv.clientAddress, 125, 100);

    // Line Items Table Header
    let y = 112;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Description", 18, y + 5.5);
    doc.text("Qty", 125, y + 5.5, { align: "center" });
    doc.text("Unit Price", 155, y + 5.5, { align: "right" });
    doc.text("Amount", 190, y + 5.5, { align: "right" });

    y += 13;
    doc.setFont("helvetica", "normal");
    inv.items.forEach((item) => {
      doc.text(item.description, 18, y);
      doc.text(item.quantity.toString(), 125, y, { align: "center" });
      doc.text(`${sym}${item.unitPrice.toFixed(2)}`, 155, y, { align: "right" });
      doc.text(`${sym}${item.amount.toFixed(2)}`, 190, y, { align: "right" });
      y += 8;
    });

    // Divider Line
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 195, y);
    y += 8;

    // Totals Box
    doc.text("Subtotal:", 140, y);
    doc.text(`${sym}${inv.subtotal.toFixed(2)}`, 190, y, { align: "right" });
    y += 6;

    if (inv.taxAmount > 0) {
      doc.text(`Tax (${inv.taxRate}%):`, 140, y);
      doc.text(`${sym}${inv.taxAmount.toFixed(2)}`, 190, y, { align: "right" });
      y += 6;
    }

    if (inv.discount > 0) {
      doc.text("Discount:", 140, y);
      doc.text(`-${sym}${inv.discount.toFixed(2)}`, 190, y, { align: "right" });
      y += 6;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Total Due:", 140, y);
    doc.text(`${sym}${inv.total.toFixed(2)}`, 190, y, { align: "right" });

    // Payment Notes
    if (inv.notes) {
      y += 18;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Notes & Payment Instructions:", 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(inv.notes, 15, y + 5);
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Made with Endorse · e-ndorse.online", 105, 287, { align: "center" });

    return doc;
  };

  const handleDownloadPDF = (inv: Invoice) => {
    buildInvoicePdf(inv).save(`${inv.number}.pdf`);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesTab = activeTab === "all" || statusOf(inv) === activeTab;
    const matchesSearch =
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Invoices can be in different currencies, so each currency is totalled separately
  // (e.g. "₦250,000.00 · $120.00") rather than added together.
  const totalsBy = (list: Invoice[]) => {
    const sums = new Map<string, number>();
    for (const inv of list) {
      const sym = inv.currencySymbol || "$";
      sums.set(sym, (sums.get(sym) || 0) + inv.total);
    }
    return sums;
  };
  const totalInvoiced = totalsBy(invoices);
  const countOf = (status: Invoice["status"]) => invoices.filter((inv) => statusOf(inv) === status);
  const totalPaid = totalsBy(countOf("paid"));
  const totalPending = totalsBy(countOf("pending"));
  const totalOverdue = totalsBy(countOf("overdue"));

  const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatTotals = (sums: Map<string, number>) =>
    sums.size === 0 ? money(0) : [...sums].map(([sym, n]) => `${sym}${money(n)}`).join(" · ");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 container mx-auto max-w-7xl px-4 md:px-6 py-8 space-y-8">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <h1 className="font-display text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Invoices</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Create an invoice, email it to your client as a PDF, and mark it paid when the money arrives.
              Invoices are saved in this browser, so download a PDF of anything you need to keep.
            </p>
          </div>

          <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
            {invoices.length > 0 && (
              <button
                onClick={handleClearInvoices}
                className="min-h-[40px] px-2 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Delete all
              </button>
            )}
            <Button size="lg" className="h-12 w-full rounded-xl font-bold sm:w-auto bg-[#0A66C2] hover:bg-[#08519c] text-white shadow-sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              New Invoice
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-border/70">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:[&>*:nth-child(2)]:border-t-0 lg:grid-cols-4 lg:divide-y-0 lg:divide-x">
              <div className="flex items-center gap-4 p-4 sm:p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0A66C2] text-white shadow-sm">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Invoiced</p>
                  <h3 className="mt-0.5 truncate font-display text-xl font-bold text-foreground sm:text-2xl" title={formatTotals(totalInvoiced)}>{formatTotals(totalInvoiced)}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{invoices.length} total invoices</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 sm:p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paid</p>
                  <h3 className="mt-0.5 truncate font-display text-xl font-bold text-foreground sm:text-2xl" title={formatTotals(totalPaid)}>{formatTotals(totalPaid)}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{countOf("paid").length} paid</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 sm:p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending</p>
                  <h3 className="mt-0.5 truncate font-display text-xl font-bold text-foreground sm:text-2xl" title={formatTotals(totalPending)}>{formatTotals(totalPending)}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{countOf("pending").length} awaiting payment</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 sm:p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overdue</p>
                  <h3 className="mt-0.5 truncate font-display text-xl font-bold text-foreground sm:text-2xl" title={formatTotals(totalOverdue)}>{formatTotals(totalOverdue)}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{countOf("overdue").length} past due date</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-2.5 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full items-center gap-1 rounded-xl bg-muted/60 p-1 md:w-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 min-h-[40px] whitespace-nowrap rounded-lg px-2 sm:px-4 py-2 text-sm font-semibold transition-all md:flex-initial",
                  activeTab === tab.id
                    ? "bg-[#0A66C2] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search client or invoice #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card px-4 py-16 text-center">
            <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0A66C2]/10 text-[#0A66C2]">
                <Receipt className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-semibold text-foreground">
                  {invoices.length === 0 ? "No invoices yet" : "No invoices match your filters"}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {invoices.length === 0
                    ? "Your invoices will show up here, with what's been paid and what's still owed."
                    : "Try a different search or another tab."}
                </p>
              </div>
              <div className="flex w-full flex-col items-stretch justify-center gap-3 pt-1 sm:w-auto sm:flex-row sm:items-center">
                <Button className="h-11 rounded-xl font-bold bg-[#0A66C2] hover:bg-[#08519c] text-white shadow-sm" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4" /> New invoice
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvoices.map((inv) => {
              const meta = STATUS_META[statusOf(inv)];
              const StatusIcon = meta.icon;
              return (
                <div
                  key={inv.id}
                  className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card lg:flex-row lg:items-center sm:p-5"
                >
                  <span className={cn("absolute inset-y-4 left-0 w-1 rounded-full", meta.bar)} />

                  <div className="flex min-w-0 flex-1 items-center gap-3 pl-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A66C2]/10 font-display text-sm font-bold text-[#0A66C2]">
                      {getInitials(inv.clientName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-foreground">{inv.clientName}</p>
                        <Badge variant="outline" className={cn("hidden gap-1 text-xs font-semibold capitalize sm:inline-flex", meta.badge)}>
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{inv.number}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pl-3 lg:flex-nowrap lg:justify-end lg:gap-8 lg:pl-0">
                    <div className="hidden text-xs md:block">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Due</p>
                      <p className="font-medium text-foreground">{inv.dueDate}</p>
                    </div>

                    <Badge variant="outline" className={cn("gap-1 text-xs font-semibold capitalize sm:hidden", meta.badge)}>
                      <StatusIcon className="h-3 w-3" />
                      {meta.label}
                    </Badge>

                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-foreground">
                        {inv.currencySymbol}{money(inv.total)}
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground">{inv.currency}</p>
                    </div>

                    <div className="flex w-full items-center justify-end gap-1 border-t border-border pt-2 lg:w-auto lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                      {inv.status !== "paid" && (
                        <button
                          onClick={() => handleMarkAsPaid(inv.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-success transition-colors hover:bg-success/10"
                          title="Mark as paid"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEmailModal(inv)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10"
                        title="Email invoice"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(inv)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv.id)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10"
                        title="Delete invoice"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* New invoice */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-0 sm:p-4 backdrop-blur-sm">
          <div className="flex h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[92vh] w-full max-w-5xl animate-in zoom-in-95 flex-col overflow-hidden rounded-none sm:rounded-3xl border border-border bg-card shadow-2xl lg:flex-row">

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A66C2] text-white">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-foreground">New Invoice</h3>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain p-4 sm:p-6 text-sm">

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0A66C2]/10 text-xs font-bold text-[#0A66C2]">1</span>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Your Business</h4>
                    {companyLogo && (
                      <img src={companyLogo} alt="Company Logo" className="ml-auto h-7 w-auto rounded-md border border-border object-contain" />
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-foreground mb-1 block text-xs">Company Name</label>
                      <Input
                        placeholder="Your business name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground mb-1 block text-xs">Tax ID / VAT #</label>
                      <Input
                        placeholder="Optional"
                        value={companyTaxId}
                        onChange={(e) => setCompanyTaxId(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground mb-1 block text-xs">Company Logo</label>
                      <label className="flex items-center gap-2 border border-input rounded-lg px-3 py-2 bg-background cursor-pointer hover:bg-muted transition-colors">
                        <Upload className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">{companyLogo ? "Change Logo" : "Upload Logo"}</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground mb-1 block text-xs">Company Address</label>
                    <Input
                      placeholder="Street, city"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0A66C2]/10 text-xs font-bold text-[#0A66C2]">2</span>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Bill To</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-foreground mb-1.5 block text-xs">Client Name *</label>
                      <Input
                        placeholder="Who you're billing"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground mb-1.5 block text-xs">Client Email *</label>
                      <Input
                        type="email"
                        placeholder="client@example.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground mb-1.5 block text-xs">Client Billing Address</label>
                      <Input
                        placeholder="Optional"
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-foreground mb-1.5 block text-xs">Due Date</label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground mb-1.5 block text-xs">Currency</label>
                    <select
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value)}
                      className="w-full h-10 px-3 py-1.5 rounded-lg border border-input bg-background text-sm text-foreground font-medium outline-none focus:ring-2 focus:ring-ring"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0A66C2]/10 text-xs font-bold text-[#0A66C2]">3</span>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Line Items</h4>
                    </div>
                    <button
                      onClick={handleAddItem}
                      className="min-h-[40px] px-2 text-sm text-[#0A66C2] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formItems.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-muted/40 p-2.5 rounded-xl border border-border">
                        <div className="col-span-12 sm:col-span-6">
                          <Input
                            placeholder="What you're charging for"
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                            className="bg-background"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground sm:sr-only">Qty</label>
                          <Input
                            inputMode="numeric"
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                            className="bg-background"
                          />
                        </div>
                        <div className="col-span-5 sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground sm:sr-only">Price</label>
                          <Input
                            inputMode="decimal"
                            type="number"
                            min="0"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(item.id, "unitPrice", Number(e.target.value))}
                            className="bg-background"
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2 flex min-w-0 items-center justify-between gap-1 self-end pl-1 sm:self-center">
                          <span className="min-w-0 truncate font-semibold text-foreground">
                            {currentCurrency.symbol}{item.amount.toFixed(2)}
                          </span>
                          <button onClick={() => handleRemoveItem(item.id)} aria-label="Remove item" className="flex h-10 w-10 items-center justify-center text-destructive hover:text-destructive/80">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0A66C2]/10 text-xs font-bold text-[#0A66C2]">4</span>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Notes</h4>
                    </div>
                    <textarea
                      rows={5}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 text-base md:text-sm rounded-xl border border-input bg-background text-foreground"
                      placeholder="Bank details or how to pay you"
                    />
                  </div>

                  <div className="bg-muted/40 p-4 rounded-xl space-y-2 border border-border">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-semibold text-foreground">
                        {currentCurrency.symbol}{calculateFormSubtotal().toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tax Rate (%)</span>
                      <Input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        inputMode="decimal"
                        className="w-24 text-right h-10 bg-background"
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Discount ({currentCurrency.symbol})</span>
                      <Input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        inputMode="decimal"
                        className="w-24 text-right h-10 bg-background"
                      />
                    </div>

                    <Separator className="my-2" />

                    <div className="flex justify-between items-center text-base font-bold text-foreground">
                      <span>Total Due</span>
                      <span className="text-primary text-lg font-display font-bold">
                        {currentCurrency.symbol}{calculateFormTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                <Button variant="outline" className="h-11 rounded-xl" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button className="h-11 rounded-xl font-bold bg-[#0A66C2] hover:bg-[#08519c] text-white shadow-sm" onClick={() => handleSaveInvoice("pending")}>
                  Save invoice
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="hidden w-[340px] shrink-0 flex-col border-l border-border bg-muted/30 p-6 lg:flex">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Preview</p>
              <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-white text-[11px] shadow-xl">
                <div className="bg-[#0A66C2] p-5 text-white">
                  <div className="flex items-center justify-between">
                    {companyLogo ? (
                      <img src={companyLogo} alt="Logo" className="h-8 w-auto max-w-[100px] rounded-md object-contain" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 font-display text-sm font-bold">
                        {(companyName || "E").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Invoice</span>
                  </div>
                  <p className="mt-4 truncate font-display text-base font-bold">{companyName || "Your Business"}</p>
                  <p className="truncate text-[10px] opacity-80">{companyAddress || "Company address"}</p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  <div className="flex items-start justify-between gap-2 text-muted-foreground">
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide">Billed To</p>
                      <p className="truncate font-semibold text-foreground">{clientName || "Client Name"}</p>
                      <p className="truncate">{clientEmail || "client@email.com"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[9px] font-semibold uppercase tracking-wide">Due</p>
                      <p className="font-semibold text-foreground">{dueDate}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-dashed border-border pt-3">
                    {formItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-muted-foreground">
                        <span className="truncate">
                          {item.description || "Item description"} <span className="text-muted-foreground/60">×{item.quantity}</span>
                        </span>
                        <span className="shrink-0 font-medium text-foreground">{currentCurrency.symbol}{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 border-t border-border pt-3 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{currentCurrency.symbol}{calculateFormSubtotal().toFixed(2)}</span>
                    </div>
                    {taxRate > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({taxRate}%)</span>
                        <span>{currentCurrency.symbol}{calculateFormTax().toFixed(2)}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span>-{currentCurrency.symbol}{discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border pt-2 font-display text-sm font-bold text-foreground">
                      <span>Total Due</span>
                      <span className="text-primary">{currentCurrency.symbol}{calculateFormTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  {notes && (
                    <div className="border-t border-dashed border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
                      {notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email an invoice */}
      {sendEmailModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm">
          <div className="my-auto w-full max-w-lg animate-in zoom-in-95 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between bg-[#0A66C2] px-4 py-4 sm:px-6 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold">Send Invoice</h3>
                  <p className="text-xs text-white/80">{sendEmailModalInvoice.number}</p>
                </div>
              </div>
              <button onClick={() => setSendEmailModalInvoice(null)} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="font-semibold text-foreground mb-1 flex items-center gap-1.5 text-xs">
                  <Mail className="h-3 w-3 text-primary" /> To
                </label>
                <Input value={sendEmailModalInvoice.clientEmail} readOnly className="bg-muted/50 font-medium" />
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block text-xs">Subject</label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="font-medium" />
              </div>

              <div>
                <label className="font-semibold text-foreground mb-1 block text-xs">Message</label>
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-3 text-base md:text-sm rounded-xl border border-input bg-background text-foreground leading-relaxed"
                />
              </div>

              <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-primary flex items-center justify-between">
                <span>Or send it from your own email</span>
                <button
                  onClick={() => handleOpenMailto(sendEmailModalInvoice)}
                  className="min-h-[40px] px-2 font-semibold underline hover:no-underline"
                >
                  Open mail app
                </button>
              </div>
            </div>

            <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
              <Button variant="outline" className="h-11 rounded-xl" onClick={() => setSendEmailModalInvoice(null)}>
                Cancel
              </Button>
              <Button className="h-11 rounded-xl font-bold bg-[#0A66C2] hover:bg-[#08519c] text-white shadow-sm" onClick={handleExecuteSendEmail} disabled={isSendingEmail}>
                {isSendingEmail ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
