import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { db, functions } from '@/components/client';
import { httpsCallable } from '@/lib/callable';
import { Button } from '@/components/ui/button';
import {
  type SignatureRecord,
  VERIFY_BASE_URL,
  SigningRecord,
  displayName,
  contactOf,
  isSigned,
  isWhatsApp,
} from './documentTracking';

export interface AuditEvent {
  id: string;
  type: 'created' | 'opened' | 'signed' | 'sealed';
  at?: any;
  ip?: string | null;
  userAgent?: string | null;
  uid?: string | null;
  email?: string | null;
  hash?: string;
  algorithm?: string;
  note?: string;
}

const EVENT_LABEL: Record<AuditEvent['type'], string> = {
  created: 'Document created',
  opened: 'Document opened',
  signed: 'Signature applied',
  sealed: 'Final document generated and hashed',
};

const millis = (ts: any) => (ts?.toMillis ? ts.toMillis() : 0);

export const formatAuditTime = (ts: any) =>
  ts?.toDate
    ? ts.toDate().toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short',
      })
    : 'Time not recorded';

/** "Chrome 131 on Windows" from a user agent string. */
export const describeUserAgent = (ua?: string | null) => {
  if (!ua || ua === 'unknown') return 'Unknown device';
  const browser =
    ua.match(/Edg\/(\d+)/) ? `Edge ${ua.match(/Edg\/(\d+)/)![1]}`
    : ua.match(/OPR\/(\d+)/) ? `Opera ${ua.match(/OPR\/(\d+)/)![1]}`
    : ua.match(/Firefox\/(\d+)/) ? `Firefox ${ua.match(/Firefox\/(\d+)/)![1]}`
    : ua.match(/Chrome\/(\d+)/) ? `Chrome ${ua.match(/Chrome\/(\d+)/)![1]}`
    : ua.match(/Version\/(\d+).*Safari/) ? `Safari ${ua.match(/Version\/(\d+)/)![1]}`
    : 'Unknown browser';
  const os =
    /Windows/.test(ua) ? 'Windows'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Mac OS X/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : 'unknown OS';
  return `${browser} on ${os}`;
};

/** Live audit events for a document, oldest first. */
export const useAuditEvents = (documentId: string | null) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!documentId) return;
    setLoading(true);
    return onSnapshot(
      query(collection(db, 'documents', documentId, 'audit')),
      (snap) => {
        setEvents(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as AuditEvent)
            .sort((a, b) => millis(a.at) - millis(b.at))
        );
        setLoading(false);
      },
      (err) => {
        console.warn('Could not load the audit trail:', err);
        setLoading(false);
      }
    );
  }, [documentId]);
  return { events, loading };
};

const eventDetails = (e: AuditEvent): [string, string][] => {
  const rows: [string, string][] = [];
  if (e.type === 'sealed' && e.hash) rows.push([`${e.algorithm || 'SHA-256'} hash`, e.hash]);
  if (e.ip) rows.push(['IP address', e.ip]);
  if (e.userAgent) rows.push(['Device', describeUserAgent(e.userAgent)], ['User agent', e.userAgent]);
  if (e.email) rows.push([e.type === 'created' ? 'Creator' : 'Account', e.email]);
  if (e.uid) rows.push([e.type === 'signed' ? 'Signer UID' : 'User ID', e.uid]);
  if (e.note) rows.push(['Note', e.note]);
  return rows;
};

const downloadCertificate = async (record: SignatureRecord, events: AuditEvent[], qr: string) => {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const left = 48;
  const width = 500;
  let y = 64;

  const line = (text: string, size = 9, color: [number, number, number] = [51, 65, 85], bold = false) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    for (const part of pdf.splitTextToSize(text, width) as string[]) {
      if (y > 790) { pdf.addPage(); y = 64; }
      pdf.text(part, left, y);
      y += size + 4;
    }
  };

  line('Audit certificate', 18, [15, 23, 42], true);
  y += 4;
  line(record.name, 11, [15, 23, 42], true);
  line(`Document ID: ${record.id}`);
  line(`Signer: ${displayName(record)} (${contactOf(record)}) by ${isWhatsApp(record) ? 'WhatsApp' : 'email'}`);
  if (record.documentHash) {
    pdf.addImage(qr, 'PNG', 460, 40, 90, 90);
    y += 6;
    line('SHA-256 document hash', 9, [15, 23, 42], true);
    pdf.setFont('courier', 'normal');
    line(record.documentHash, 9);
    line(`Verify at ${VERIFY_BASE_URL}/${record.documentHash}`, 9, [10, 102, 194]);
  }
  y += 10;
  line('History', 12, [15, 23, 42], true);
  for (const e of events) {
    y += 4;
    line(`${EVENT_LABEL[e.type] ?? e.type}  ·  ${formatAuditTime(e.at)}`, 10, [15, 23, 42], true);
    for (const [k, v] of eventDetails(e)) line(`${k}: ${v}`, 8);
  }
  y += 10;
  line('Generated by Endorse. The hash covers the original document, the signature and where it was placed, the signer and the signing time.', 8, [100, 116, 139]);
  pdf.save(`${record.name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'document'}_audit_certificate.pdf`);
};

/** Full audit trail for a sent document, plus its certificate once signed and sealed. */
export const AuditTrail = ({ record }: { record: SignatureRecord }) => {
  const { events, loading } = useAuditEvents(record.id);
  const [qr, setQr] = useState<string | null>(null);
  const [sealing, setSealing] = useState(false);
  const verifyUrl = record.documentHash ? `${VERIFY_BASE_URL}/${record.documentHash}` : null;

  useEffect(() => {
    if (!verifyUrl) return setQr(null);
    QRCode.toDataURL(verifyUrl, { width: 240, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [verifyUrl]);

  const seal = async () => {
    setSealing(true);
    try {
      await httpsCallable(functions, 'sealSignedDocument')({ documentId: record.id });
      toast.success('Certificate issued');
    } catch (err: any) {
      toast.error(err?.message || 'Could not issue the certificate.');
    } finally {
      setSealing(false);
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Audit trail</h4>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : events.length === 0 ? (
          <div className="space-y-3">
            <SigningRecord record={record} />
            <p className="text-xs text-slate-500">
              This document was sent before detailed logging was added, so IP addresses and devices weren't recorded.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {events.map((e) => (
              <li key={e.id} className="border-l-2 border-slate-200 pl-3">
                <p className="text-sm font-medium text-slate-900">{EVENT_LABEL[e.type] ?? e.type}</p>
                <p className="text-xs text-slate-500">{formatAuditTime(e.at)}</p>
                <dl className="mt-1.5 grid grid-cols-[auto,1fr] gap-x-3 gap-y-0.5 text-xs">
                  {eventDetails(e).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className={`min-w-0 break-all text-slate-800 ${k.includes('hash') || k === 'User agent' || k.includes('UID') ? 'font-mono text-[11px]' : ''}`}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
            {!isSigned(record) && (
              <li className="border-l-2 border-dashed border-slate-200 pl-3 text-sm text-slate-500">Waiting for signature</li>
            )}
          </ol>
        )}
      </section>

      <section className="border-t border-slate-200 pt-5">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Audit certificate</h4>
        {record.documentHash && verifyUrl ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {qr && <img src={qr} alt="QR code linking to the verification page" className="h-32 w-32 shrink-0 rounded border border-slate-200" />}
            <div className="min-w-0 space-y-2 text-xs">
              <div>
                <p className="text-slate-500">SHA-256 document hash</p>
                <p className="break-all font-mono text-[11px] text-slate-900">{record.documentHash}</p>
              </div>
              <div>
                <p className="text-slate-500">Verification link</p>
                <a href={verifyUrl} target="_blank" rel="noreferrer" className="break-all text-[#0A66C2] hover:underline">{verifyUrl}</a>
              </div>
              <Button size="sm" variant="outline" className="h-9 text-sm" onClick={() => qr && downloadCertificate(record, events, qr)} disabled={!qr}>
                Download certificate
              </Button>
            </div>
          </div>
        ) : isSigned(record) ? (
          <div className="space-y-2 text-sm text-slate-600">
            <p>This document was signed but hasn't been sealed with a hash yet.</p>
            <Button size="sm" className="h-9 bg-[#0A66C2] text-sm text-white hover:bg-[#08519c]" onClick={seal} disabled={sealing}>
              {sealing ? 'Issuing…' : 'Issue certificate'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">The certificate is issued once the document has been signed.</p>
        )}
      </section>
    </div>
  );
};

export default AuditTrail;
