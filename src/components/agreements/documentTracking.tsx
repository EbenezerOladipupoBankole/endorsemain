import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from '@/lib/callable';
import { db, functions } from '@/components/client';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

/**
 * Documents sent for signature live in Firestore `documents`. The dashboard and the
 * Send for Signature page both read them through here, so their counts always agree.
 */
export interface SignatureRecord {
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
  deliveredAt?: any;
  readAt?: any;
  signature_data?: string;
  signature_positions?: any[];
  /** SHA-256 of the signed content, set by the server when the document is sealed. */
  documentHash?: string;
  sealedAt?: any;
  signerUid?: string;
}

export const VERIFY_BASE_URL = 'https://www.e-ndorse.online/verify';

export const isSigned = (r: SignatureRecord) => r.status === 'signed' || r.status === 'completed';
export const contactOf = (r: SignatureRecord) => r.recipientEmail || r.recipientPhone || '';
export const displayName = (r: SignatureRecord) => r.recipientName || r.studentName || contactOf(r);
export const isWhatsApp = (r: SignatureRecord) => r.channel === 'whatsapp';
export const toMillis = (ts: any) => (ts?.toMillis ? ts.toMillis() : 0);
export const formatDate = (ts: any) =>
  ts?.toDate ? ts.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
export const formatDateTime = (ts: any) =>
  ts?.toDate ? ts.toDate().toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : null;

/** Live lists of what the user has sent, and what is waiting for their own signature. */
export const useSignatureDocuments = (email?: string | null) => {
  const [sent, setSent] = useState<SignatureRecord[]>([]);
  const [received, setReceived] = useState<SignatureRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    const lower = email.toLowerCase();

    const unsubSent = onSnapshot(
      query(collection(db, 'documents'), where('ownerEmail', '==', email)),
      (snap) => {
        setSent(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as SignatureRecord)
            .filter((d) => (d.recipientEmail && d.recipientEmail !== lower) || (isWhatsApp(d) && d.recipientPhone))
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
        );
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load sent documents:', err);
        setLoading(false);
      }
    );

    const unsubReceived = onSnapshot(
      query(collection(db, 'documents'), where('recipientEmail', '==', lower)),
      (snap) => {
        setReceived(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as SignatureRecord)
            .filter((d) => !isSigned(d))
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
        );
      },
      (err) => console.warn('Failed to load documents awaiting signature:', err)
    );

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [email]);

  return { sent, received, loading };
};

export const sendReminder = async (r: SignatureRecord) => {
  try {
    await httpsCallable(functions, isWhatsApp(r) ? 'sendWhatsAppInvite' : 'sendAgreementInvite')({ documentId: r.id });
    toast.success(`Reminder sent to ${contactOf(r)}`);
  } catch {
    toast.error('Could not send the reminder. Try sharing the link instead.');
  }
};

/** Signing counts as opening, so documents signed before open-tracking existed still read correctly. */
const isOpened = (r: SignatureRecord) => !!r.viewedAt || isSigned(r) || r.deliveryStatus === 'read';

/** Compact Sent → Opened → Signed tracker for list rows. */
export const SigningProgress = ({ record }: { record: SignatureRecord }) => {
  const steps = [
    { label: 'Sent', done: true },
    { label: 'Opened', done: isOpened(record) },
    { label: 'Signed', done: isSigned(record) },
  ];
  return (
    <ol className="flex items-center gap-1" aria-label="Signing progress">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-1">
          {i > 0 && <span className={`h-px w-3 sm:w-5 ${s.done ? 'bg-[#0A66C2]' : 'bg-slate-200'}`} aria-hidden />}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              s.done
                ? s.label === 'Signed'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-blue-50 text-[#0A66C2]'
                : 'bg-slate-50 text-slate-400'
            }`}
          >
            {s.done && <Check className="h-2.5 w-2.5" />}
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
};

const DELIVERY_EVENTS: { key: keyof SignatureRecord; status: string; label: string }[] = [
  { key: 'deliveredAt', status: 'delivered', label: 'Delivered on WhatsApp' },
  { key: 'readAt', status: 'read', label: 'Read on WhatsApp' },
];

/** The audit trail: every event Endorse records for a sent document, oldest first. */
export const SigningRecord = ({ record }: { record: SignatureRecord }) => {
  const signed = isSigned(record);
  const whatsapp = isWhatsApp(record);
  const failed = whatsapp && record.deliveryStatus === 'failed';

  const rows: { label: string; at: string | null; done: boolean; tone?: 'error' | 'success' }[] = [
    { label: `Sent to ${displayName(record)} by ${whatsapp ? 'WhatsApp' : 'email'}`, at: formatDateTime(record.createdAt), done: true },
  ];
  if (failed) rows.push({ label: "WhatsApp message couldn't be delivered", at: null, done: true, tone: 'error' });
  if (whatsapp) {
    for (const e of DELIVERY_EVENTS) {
      if (record[e.key] || record.deliveryStatus === e.status) {
        rows.push({ label: e.label, at: formatDateTime(record[e.key]), done: true });
      }
    }
  }
  rows.push(
    record.viewedAt
      ? { label: whatsapp ? 'Opened after verifying their WhatsApp code' : `Opened by ${displayName(record)}`, at: formatDateTime(record.viewedAt), done: true }
      : { label: signed ? 'Opened' : 'Not opened yet', at: null, done: signed }
  );
  rows.push(
    signed
      ? { label: `Signed by ${displayName(record)}`, at: formatDateTime(record.signedAt), done: true, tone: 'success' }
      : { label: 'Waiting for signature', at: null, done: false }
  );

  return (
    <ol className="relative space-y-3">
      {rows.map((row, i) => (
        <li key={i} className="relative flex items-start justify-between gap-3 pl-5 text-xs">
          {i < rows.length - 1 && <span className="absolute left-[3px] top-3 h-[calc(100%+0.25rem)] w-px bg-slate-200" aria-hidden />}
          <span
            className={`absolute left-0 top-1 h-2 w-2 rounded-full ${
              row.tone === 'error' ? 'bg-rose-500'
                : row.tone === 'success' ? 'bg-emerald-500'
                : row.done ? 'bg-[#0A66C2]'
                : 'border border-slate-300 bg-white'
            }`}
          />
          <span className={row.done ? 'text-slate-700' : 'text-slate-400'}>{row.label}</span>
          {row.at && <span className="shrink-0 text-slate-400">{row.at}</span>}
        </li>
      ))}
    </ol>
  );
};
