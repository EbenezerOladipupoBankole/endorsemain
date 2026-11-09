import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from '@/lib/callable';
import { db, functions } from '@/components/client';
import { useAuth } from '@/components/AuthContext';
import jsPDF from 'jspdf';
import { sanitizeHtml, shareByEmailHref, shareByWhatsAppHref, signingLink } from './signingUtils';
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  Copy,
  Send,
  Download,
  Eye,
  Trash2,
  Mail,
  MessageCircle,
  Plus,
  PenTool,
  ArrowRight,
  X,
} from 'lucide-react';

interface SignatureRecord {
  id: string;
  name: string;
  category?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  channel?: string;
  recipientName?: string;
  studentName?: string;
  senderName?: string;
  adminName?: string;
  ownerEmail?: string;
  message?: string;
  renderedHtml?: string;
  pdfBase64?: string;
  status: 'pending' | 'signed' | 'completed';
  signedAt?: any;
  createdAt?: any;
  viewedAt?: any;
  deliveryStatus?: string;
  signature_data?: string;
  signature_positions?: any[];
}

interface AgreementsListProps {
  onOpenTemplateStudio?: () => void;
  onOpenSendModal?: () => void;
}

const isSigned = (r: SignatureRecord) => r.status === 'signed' || r.status === 'completed';
const contactOf = (r: SignatureRecord) => r.recipientEmail || r.recipientPhone || '';
const displayName = (r: SignatureRecord) => r.recipientName || r.studentName || contactOf(r);
const isWhatsApp = (r: SignatureRecord) => r.channel === 'whatsapp';
const toMillis = (ts: any) => (ts?.toMillis ? ts.toMillis() : 0);
const formatDate = (ts: any) => (ts?.toDate ? ts.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const formatDateTime = (ts: any) =>
  ts?.toDate ? ts.toDate().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;

const DELIVERY_LABEL: Record<string, string> = {
  sent: 'WhatsApp message sent',
  delivered: 'Delivered on WhatsApp',
  read: 'Read on WhatsApp',
  failed: "WhatsApp message couldn't be delivered",
};

/** What Endorse actually stores about a sent document, in order. */
const SigningRecord = ({ record }: { record: SignatureRecord }) => {
  const rows = [
    { label: `Sent to ${displayName(record)} by ${isWhatsApp(record) ? 'WhatsApp' : 'email'}`, at: formatDateTime(record.createdAt) },
    ...(isWhatsApp(record) && record.deliveryStatus && DELIVERY_LABEL[record.deliveryStatus]
      ? [{ label: DELIVERY_LABEL[record.deliveryStatus], at: null }]
      : []),
    ...(record.viewedAt ? [{ label: 'Opened after verifying their WhatsApp code', at: formatDateTime(record.viewedAt) }] : []),
    isSigned(record)
      ? { label: `Signed by ${displayName(record)}`, at: formatDateTime(record.signedAt) }
      : { label: 'Waiting for signature', at: null },
  ];
  return (
    <ol className="space-y-2.5">
      {rows.map((row, i) => (
        <li key={i} className="flex items-start justify-between gap-3 text-xs">
          <span className="flex items-center gap-2 text-slate-700">
            <span className={`h-2 w-2 shrink-0 rounded-full ${i === rows.length - 1 && isSigned(record) ? 'bg-emerald-500' : 'bg-[#0A66C2]'}`} />
            {row.label}
          </span>
          {row.at && <span className="shrink-0 text-slate-400">{row.at}</span>}
        </li>
      ))}
    </ol>
  );
};

const safeFilename = (name: string) => `${name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'document'}_signed.pdf`;

export const AgreementsList: React.FC<AgreementsListProps> = ({ onOpenTemplateStudio, onOpenSendModal }) => {
  const { user, userProfile } = useAuth();
  const [sent, setSent] = useState<SignatureRecord[]>([]);
  const [received, setReceived] = useState<SignatureRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'signed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewing, setViewing] = useState<SignatureRecord | null>(null);

  const senderName = userProfile?.displayName || userProfile?.name || user?.displayName || user?.email?.split('@')[0];

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    const email = user.email.toLowerCase();

    const unsubSent = onSnapshot(
      query(collection(db, 'documents'), where('ownerEmail', '==', user.email)),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as SignatureRecord)
          .filter((d) => (d.recipientEmail && d.recipientEmail !== email) || (isWhatsApp(d) && d.recipientPhone))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setSent(items);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load sent documents:', err);
        setLoading(false);
      }
    );

    const unsubReceived = onSnapshot(
      query(collection(db, 'documents'), where('recipientEmail', '==', email)),
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as SignatureRecord)
          .filter((d) => !isSigned(d))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setReceived(items);
      },
      (err) => console.warn('Failed to load documents awaiting signature:', err)
    );

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [user?.email]);

  const copyLink = (r: SignatureRecord) => {
    navigator.clipboard.writeText(signingLink(r.id, r.channel));
    toast.success('Signing link copied');
  };

  const shareProps = (r: SignatureRecord) =>
    isWhatsApp(r)
      ? {
          href: shareByWhatsAppHref({ phone: r.recipientPhone || '', recipientName: r.recipientName, documentName: r.name, documentId: r.id, senderName }),
          target: '_blank',
          rel: 'noreferrer',
        }
      : { href: shareByEmailHref({ to: r.recipientEmail || '', recipientName: r.recipientName, documentName: r.name, documentId: r.id, senderName }) };

  const resendInvite = async (r: SignatureRecord) => {
    try {
      await httpsCallable(functions, isWhatsApp(r) ? 'sendWhatsAppInvite' : 'sendAgreementInvite')({ documentId: r.id });
      toast.success(`Reminder sent to ${contactOf(r)}`);
    } catch {
      toast.error('Could not send the reminder email. Try sharing the link instead.');
    }
  };

  const handleDelete = async (r: SignatureRecord) => {
    if (!confirm(`Delete "${r.name}" sent to ${contactOf(r)}? The signing link will stop working.`)) return;
    try {
      await deleteDoc(doc(db, 'documents', r.id));
      toast.success('Document deleted');
      if (viewing?.id === r.id) setViewing(null);
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const downloadSigned = async (r: SignatureRecord) => {
    try {
      if (r.pdfBase64) {
        const { embedItemsInPDF, downloadPDF } = await import('@/lib/pdfUtils');
        const blob = await (await fetch(r.pdfBase64)).blob();
        const file = new File([blob], `${r.name}.pdf`, { type: 'application/pdf' });
        const bytes = await embedItemsInPDF(file, r.signature_positions || []);
        downloadPDF(bytes, safeFilename(r.name));
        return;
      }

      // Template-based document: render its text plus the captured signature.
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(r.name, 40, 60);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const text = (r.renderedHtml || '').replace(/<\/(p|h\d|li|tr)>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ');
      const lines = pdf.splitTextToSize(text.trim(), 515);
      let y = 90;
      for (const line of lines) {
        if (y > 700) {
          pdf.addPage();
          y = 60;
        }
        pdf.text(line, 40, y);
        y += 14;
      }
      if (y > 660) {
        pdf.addPage();
        y = 60;
      }
      y += 20;
      pdf.setDrawColor(203, 213, 225);
      pdf.line(40, y, 555, y);
      if (r.signature_data?.startsWith('data:image')) {
        try {
          pdf.addImage(r.signature_data, 'PNG', 40, y + 10, 140, 50);
        } catch {
          /* fall through to text signature */
        }
      }
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      const signedAt = r.signedAt?.toDate ? r.signedAt.toDate().toLocaleString() : '';
      pdf.text(`Signed by ${displayName(r)} (${contactOf(r)})${signedAt ? ` on ${signedAt}` : ''}`, 40, y + 76);
      pdf.text(`Endorse document ID: ${r.id}`, 40, y + 90);
      pdf.save(safeFilename(r.name));
    } catch (err) {
      console.error(err);
      toast.error('Could not generate the signed PDF.');
    }
  };

  // Row actions, shared by the desktop table and the mobile cards (which use bigger touch targets).
  const renderActions = (r: SignatureRecord, size: string) => {
    const signed = isSigned(r);
    const btn = `${size} p-0`;
    return (
      <>
        <Button size="sm" variant="ghost" title="View" aria-label="View" onClick={() => setViewing(r)} className={`${btn} text-slate-600 hover:text-[#0A66C2]`}>
          <Eye className="h-4 w-4" />
        </Button>
        {!signed && (
          <>
            <Button size="sm" variant="ghost" title="Copy signing link" aria-label="Copy signing link" onClick={() => copyLink(r)} className={`${btn} text-slate-600 hover:text-[#0A66C2]`}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button asChild size="sm" variant="ghost" title={isWhatsApp(r) ? 'Share on WhatsApp' : 'Share via email'} className={`${btn} text-slate-600 hover:text-[#0A66C2]`}>
              <a {...shareProps(r)} aria-label={isWhatsApp(r) ? 'Share on WhatsApp' : 'Share via email'}>
                {isWhatsApp(r) ? <MessageCircle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              </a>
            </Button>
            <Button size="sm" variant="ghost" title="Send reminder" aria-label="Send reminder" onClick={() => resendInvite(r)} className={`${btn} text-amber-600 hover:bg-amber-50`}>
              <Send className="h-4 w-4" />
            </Button>
          </>
        )}
        {signed && (
          <Button size="sm" variant="ghost" title="Download signed PDF" aria-label="Download signed PDF" onClick={() => downloadSigned(r)} className={`${btn} text-emerald-600 hover:bg-emerald-50`}>
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" variant="ghost" title="Delete" aria-label="Delete" onClick={() => handleDelete(r)} className={`${btn} text-rose-500 hover:bg-rose-50`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </>
    );
  };

  const statusBadge = (r: SignatureRecord) =>
    isSigned(r) ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Signed {formatDate(r.signedAt)}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Clock className="h-3 w-3" /> Awaiting signature
      </span>
    );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return sent.filter((r) => {
      const statusOk = filterStatus === 'all' || (filterStatus === 'signed' ? isSigned(r) : !isSigned(r));
      const searchOk =
        !q ||
        r.name.toLowerCase().includes(q) ||
        contactOf(r).toLowerCase().includes(q) ||
        displayName(r).toLowerCase().includes(q);
      return statusOk && searchOk;
    });
  }, [sent, filterStatus, searchQuery]);

  const stats = {
    total: sent.length,
    pending: sent.filter((r) => !isSigned(r)).length,
    signed: sent.filter(isSigned).length,
  };

  return (
    <div className="space-y-6">
      {/* Waiting on me */}
      {received.length > 0 && (
        <div className="rounded-2xl border border-[#FFC83D] bg-[#FFF8E1] p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <PenTool className="h-4 w-4 text-[#0A66C2]" /> Waiting for your signature
          </h3>
          <ul className="mt-3 divide-y divide-[#FFE7A3]">
            {received.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                  <p className="truncate text-xs text-slate-600">From {r.senderName || r.adminName || r.ownerEmail}</p>
                </div>
                <Button asChild size="sm" className="shrink-0 bg-[#0A66C2] text-xs text-white hover:bg-[#08519c]">
                  <Link to={`/sign/${r.id}`}>
                    Review &amp; sign <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sent', value: stats.total, tone: 'text-slate-900' },
          { label: 'Awaiting signature', value: stats.pending, tone: 'text-amber-600' },
          { label: 'Signed', value: stats.signed, tone: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {([
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Awaiting' },
            { id: 'signed', label: 'Signed' },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`min-h-[40px] flex-1 rounded-md px-4 text-sm font-semibold transition-colors sm:flex-none ${
                filterStatus === f.id ? 'bg-white text-[#0A66C2] shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email or document"
              className="h-10 pl-9 text-sm"
            />
          </div>
          {onOpenTemplateStudio && (
            <Button variant="outline" size="sm" className="h-10 text-sm" onClick={onOpenTemplateStudio}>
              <FileText className="mr-1.5 h-4 w-4" /> Templates
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="space-y-3 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0A66C2]">
              <Send className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery || filterStatus !== 'all' ? 'Nothing matches' : 'No documents sent yet'}
            </h3>
            <p className="mx-auto max-w-sm text-xs text-slate-500">
              {searchQuery || filterStatus !== 'all'
                ? 'Try a different search or filter.'
                : 'Upload a PDF or pick a template, add who needs to sign, and Endorse emails them an invite.'}
            </p>
            {onOpenSendModal && !searchQuery && filterStatus === 'all' && (
              <Button onClick={onOpenSendModal} className="mt-2 bg-[#0A66C2] text-xs font-bold text-white hover:bg-[#08519c]">
                <Plus className="mr-1.5 h-4 w-4" /> Send your first document
              </Button>
            )}
          </div>
        ) : (
          <>
          {/* Phones: one card per document */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {filtered.map((r) => (
              <li key={r.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                      {isWhatsApp(r) && <MessageCircle className="h-3 w-3 shrink-0" />}
                      {displayName(r)}
                      {displayName(r) !== contactOf(r) && ` · ${contactOf(r)}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{formatDate(r.createdAt)}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {statusBadge(r)}
                  <div className="-mr-2 flex">{renderActions(r, 'h-10 w-10')}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="max-w-[220px] px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate font-semibold text-slate-900">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{displayName(r)}</div>
                        {displayName(r) !== contactOf(r) && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            {isWhatsApp(r) && <MessageCircle className="h-3 w-3" />}
                            {contactOf(r)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">{statusBadge(r)}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{formatDate(r.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">{renderActions(r, 'h-8 w-8')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-900">{viewing.name}</h3>
                <p className="truncate text-xs text-slate-500">
                  {displayName(viewing)} · {isSigned(viewing) ? `Signed ${formatDate(viewing.signedAt)}` : 'Awaiting signature'}
                </p>
              </div>
              <button onClick={() => setViewing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {viewing.renderedHtml ? (
                <div
                  className="prose prose-sm max-w-none rounded-xl border border-slate-200 p-4 text-xs text-slate-800"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(viewing.renderedHtml) }}
                />
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                  <FileText className="h-5 w-5 text-[#0A66C2]" /> PDF document
                  {isSigned(viewing) && ' — download it to see the placed signatures.'}
                </div>
              )}

              {viewing.signature_data && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <img src={viewing.signature_data} alt="Signature" className="h-12 object-contain" />
                  <div className="text-right text-xs text-slate-600">
                    <p className="font-bold text-slate-800">Signed by {displayName(viewing)}</p>
                    <p>{contactOf(viewing)}</p>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3">
                <h4 className="mb-2 text-xs font-bold text-slate-700">Signing record</h4>
                <SigningRecord record={viewing} />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
              {!isSigned(viewing) ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => copyLink(viewing)}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link
                  </Button>
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <a {...shareProps(viewing)}>
                      {isWhatsApp(viewing) ? <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> : <Mail className="mr-1.5 h-3.5 w-3.5" />}
                      {isWhatsApp(viewing) ? 'Share on WhatsApp' : 'Share via email'}
                    </a>
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="bg-emerald-600 text-xs text-white hover:bg-emerald-700" onClick={() => downloadSigned(viewing)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download signed PDF
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setViewing(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
