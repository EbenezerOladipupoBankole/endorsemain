import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { httpsCallable } from '@/lib/callable';
import { functions } from '@/components/client';

interface VerifyResult {
  found: boolean;
  intact?: boolean;
  documentId?: string;
  name?: string;
  senderName?: string | null;
  signerName?: string | null;
  signerContact?: string;
  channel?: 'email' | 'whatsapp';
  sentAt?: string | null;
  signedAt?: string | null;
  sealedAt?: string | null;
}

const HASH = /^[a-f0-9]{64}$/;

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }) : '—';

const VerifyDocument = () => {
  const { hash: rawHash } = useParams();
  const navigate = useNavigate();
  const hash = (rawHash || '').toLowerCase().trim();
  const [input, setInput] = useState(hash);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput(hash);
    setResult(null);
    setError(null);
    if (!hash) return;
    if (!HASH.test(hash)) {
      setError("That isn't a valid document hash. It should be 64 letters and numbers.");
      return;
    }
    setLoading(true);
    httpsCallable<{ hash: string }, VerifyResult>(functions, 'verifyDocument')({ hash })
      .then((res) => setResult(res.data))
      .catch(() => setError("We couldn't check this document right now. Please try again in a moment."))
      .finally(() => setLoading(false));
  }, [hash]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <SiteHeader />
      <main className="container mx-auto w-full max-w-2xl flex-1 px-4 py-10 md:py-16">
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">Verify a signed document</h1>
        <p className="mt-2 text-sm text-slate-600">
          Every document signed on Endorse gets a SHA-256 hash on its audit certificate. Scan the QR code on the certificate or enter the hash below.
        </p>

        <form
          className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const next = input.toLowerCase().trim();
            if (next) navigate(`/verify/${next}`);
          }}
        >
          <div className="flex-1">
            <Label htmlFor="verify-hash" className="mb-1.5 block text-sm font-medium text-slate-800">Document hash</Label>
            <Input id="verify-hash" value={input} onChange={(e) => setInput(e.target.value)} className="h-10 font-mono text-xs" spellCheck={false} autoComplete="off" />
          </div>
          <Button type="submit" className="h-10 bg-[#0A66C2] px-5 text-sm text-white hover:bg-[#08519c]">Verify</Button>
        </form>

        <div className="mt-8">
          {loading && <p className="text-sm text-slate-500">Checking…</p>}
          {error && <p className="text-sm text-rose-700">{error}</p>}

          {result && !result.found && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
              <p className="font-semibold text-rose-800">No matching document</p>
              <p className="mt-1 text-sm text-rose-700">
                No document signed on Endorse has this hash. Check that it was copied exactly, or ask the sender for the audit certificate.
              </p>
            </div>
          )}

          {result?.found && (
            <div className={`rounded-lg border p-5 ${result.intact ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className={`font-semibold ${result.intact ? 'text-emerald-800' : 'text-amber-800'}`}>
                {result.intact ? 'Valid. This document is genuine and unchanged.' : 'Warning: this document has changed since it was signed.'}
              </p>
              <p className={`mt-1 text-sm ${result.intact ? 'text-emerald-700' : 'text-amber-700'}`}>
                {result.intact
                  ? 'The hash matches the signed record held by Endorse.'
                  : "The record held by Endorse no longer matches the hash issued when it was signed. Don't rely on it without checking with the sender."}
              </p>
              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[
                  ['Document', result.name],
                  ['Document ID', result.documentId],
                  ['Sent by', result.senderName || '—'],
                  ['Signed by', `${result.signerName ? `${result.signerName} · ` : ''}${result.signerContact || ''}`],
                  ['Sent', when(result.sentAt)],
                  ['Signed', when(result.signedAt)],
                  ['Sealed', when(result.sealedAt)],
                  ['Signed via', result.channel === 'whatsapp' ? 'WhatsApp' : 'Email'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-500">{k}</dt>
                    <dd className="break-all text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 break-all font-mono text-[11px] text-slate-500">SHA-256 {hash}</p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default VerifyDocument;
