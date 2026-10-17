import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import type { DocComment } from '@/components/esign/viewerTools';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/components/client';
import { useAuth } from '@/components/AuthContext';
import { AgreementTemplate, DEFAULT_TEMPLATES } from './TemplateStudio';
import {
  fillTemplate,
  fileToDataUrl,
  MAX_PDF_BYTES,
  phoneDigits,
  sanitizeHtml,
  shareByEmailHref,
  shareByWhatsAppHref,
  signingLink,
  tagLabel,
  templateInputTags,
} from './signingUtils';
import { Send, X, Mail, FileText, Upload, Plus, Trash2, Copy, CheckCircle2, LayoutTemplate, MessageCircle, AlertCircle } from 'lucide-react';

interface SendAgreementModalProps {
  template?: AgreementTemplate | null;
  /** When true (with template.file), the document can't be swapped — used after signing in the editor. */
  lockDocument?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Comments made while preparing the document; copied onto each recipient's copy. */
  comments?: DocComment[];
}

type Channel = 'email' | 'whatsapp';

interface Recipient {
  name: string;
  channel: Channel;
  email: string;
  phone: string;
}

interface SentRecipient {
  name: string;
  channel: Channel;
  contact: string;
  documentId: string;
  delivered: boolean;
}

type Source = 'upload' | 'template';

const emptyRecipient = (channel: Channel = 'email'): Recipient => ({ name: '', channel, email: '', phone: '' });

// Optional tags: left blank, they fall back to a sensible default.
const OPTIONAL_TAGS = ['ORGANIZATION_NAME'];

const TAG_PLACEHOLDERS: Record<string, string> = {
  ORGANIZATION_NAME: 'e.g. Northwind Ltd',
  JOB_TITLE: 'e.g. Product Designer',
  START_DATE: 'e.g. Monday 3 November 2026',
  SALARY: 'e.g. ₦6,000,000 per year',
  SCOPE_OF_WORK: 'e.g. Website redesign and three months of support',
  FEE: 'e.g. $4,500, paid in two instalments',
};

export const SendAgreementModal: React.FC<SendAgreementModalProps> = ({ template, lockDocument, onClose, onSuccess, comments = [] }) => {
  const { user, userProfile } = useAuth();
  const senderName = userProfile?.displayName || userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Endorse user';
  const locked = !!(lockDocument && template?.file);

  const [source, setSource] = useState<Source>(template?.file || !template ? 'upload' : 'template');
  const [pdfFile, setPdfFile] = useState<File | null>(template?.file ?? null);
  const [selectedTemplate, setSelectedTemplate] = useState<AgreementTemplate>(
    template && !template.file ? template : DEFAULT_TEMPLATES[0]
  );
  const [title, setTitle] = useState(
    template?.file ? template.title || template.file.name.replace(/\.pdf$/i, '') : template?.title ?? ''
  );
  const [recipients, setRecipients] = useState<Recipient[]>([emptyRecipient()]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState<SentRecipient[] | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputTags = source === 'template' ? templateInputTags(selectedTemplate.content) : [];

  const documentName = title.trim() || (source === 'upload' ? pdfFile?.name.replace(/\.pdf$/i, '') : selectedTemplate.title) || 'Untitled document';

  const handlePickFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please choose a PDF file.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error('That PDF is over 600KB. Please compress it and try again.');
      return;
    }
    setPdfFile(file);
    if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, ''));
  };

  const updateRecipient = (index: number, patch: Partial<Recipient>) =>
    setRecipients((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    const filled = recipients.filter((r) => (r.channel === 'email' ? r.email.trim() : r.phone.trim()));
    if (filled.length === 0) {
      toast.error('Add at least one person to sign.');
      return;
    }
    for (const r of filled) {
      if (r.channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim())) {
        toast.error(`"${r.email}" doesn't look like a valid email address.`);
        return;
      }
      if (r.channel === 'whatsapp') {
        const raw = r.phone.replace(/[\s\-().]/g, '');
        if (!/^\+\d{8,15}$/.test(raw)) {
          toast.error(`Add a country code to ${r.name.trim() ? `${r.name.trim()}'s` : 'the'} WhatsApp number, e.g. +2348012345678.`);
          return;
        }
      }
    }
    const missingTag = inputTags.find((tag) => !OPTIONAL_TAGS.includes(tag) && !fieldValues[tag]?.trim());
    if (missingTag) {
      toast.error(`Fill in "${tagLabel(missingTag)}" before sending.`);
      return;
    }
    if (source === 'upload' && !pdfFile) {
      toast.error('Choose a PDF to send.');
      return;
    }
    if (pdfFile && pdfFile.size > MAX_PDF_BYTES) {
      toast.error('This PDF is over 600KB, too large to send. Please use a smaller file.');
      return;
    }

    setIsSending(true);
    try {
      const pdfBase64 = source === 'upload' && pdfFile ? await fileToDataUrl(pdfFile) : null;
      const sendEmailInvite = httpsCallable(functions, 'sendAgreementInvite');
      const sendWhatsAppInvite = httpsCallable(functions, 'sendWhatsAppInvite');
      const results: SentRecipient[] = [];

      // Each recipient gets their own copy so signatures and status are tracked per person.
      for (const r of filled) {
        const name = r.name.trim();
        const email = r.email.trim().toLowerCase();
        const phone = `+${phoneDigits(r.phone)}`;
        const contact = r.channel === 'email' ? email : phone;

        const content = pdfBase64
          ? { pdfBase64 }
          : {
              renderedHtml: sanitizeHtml(
                fillTemplate(selectedTemplate.content, {
                  recipientName: name || contact,
                  recipientEmail: contact,
                  senderName,
                  extra: fieldValues,
                })
              ),
            };

        const ref = await addDoc(collection(db, 'documents'), {
          name: documentName,
          category: 'signature_request',
          ...(r.channel === 'email'
            ? { recipientEmail: email }
            : { channel: 'whatsapp', recipientPhone: phone, deliveryStatus: 'pending' }),
          recipientName: name,
          message: message.trim(),
          ...content,
          status: 'pending',
          ownerEmail: user.email,
          ownerUid: user.uid,
          senderName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (comments.length && pdfBase64) {
          try {
            const batch = writeBatch(db);
            for (const c of comments) {
              batch.set(doc(collection(db, 'documents', ref.id, 'comments')), {
                text: c.text,
                page: c.page,
                x: c.x,
                y: c.y,
                authorUid: user.uid,
                authorName: c.authorName,
                createdAt: serverTimestamp(),
              });
            }
            await batch.commit();
          } catch (err) {
            console.warn('Could not save comments with the document:', err);
          }
        }

        let delivered = true;
        try {
          await (r.channel === 'email' ? sendEmailInvite : sendWhatsAppInvite)({ documentId: ref.id });
        } catch (err) {
          console.warn(`${r.channel} invite failed:`, err);
          delivered = false;
        }
        results.push({ name, channel: r.channel, contact, documentId: ref.id, delivered });
      }

      const failed = results.filter((r) => !r.delivered).length;
      if (failed === 0) {
        toast.success(results.length === 1 ? `Sent to ${results[0].name || results[0].contact}` : `Sent to ${results.length} people`);
      } else {
        toast.warning(`Saved, but ${failed} invite(s) didn't go out automatically. Use the share buttons below.`);
      }
      setSent(results);
      onSuccess?.();
    } catch (err: any) {
      console.error('Error sending document:', err);
      toast.error(err?.message || 'Failed to send document.');
    } finally {
      setIsSending(false);
    }
  };

  const copyLink = (r: SentRecipient) => {
    navigator.clipboard.writeText(signingLink(r.documentId, r.channel));
    toast.success('Signing link copied');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{sent ? 'Sent for signature' : locked ? 'Invite others to sign' : 'Send a document for signature'}</h3>
            <p className="text-xs text-slate-500">
              {sent
                ? 'Each person has their own link to sign on Endorse.'
                : 'Invite people by email or WhatsApp. They sign on Endorse and you get notified.'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{documentName}</span> is waiting for{' '}
              {sent.length === 1 ? 'one signature' : `${sent.length} signatures`}. You can also share the link yourself:
            </p>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {sent.map((r) => (
                <li key={r.documentId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{r.name || r.contact}</p>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      {r.delivered ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                      )}
                      <span className="truncate">
                        {r.delivered
                          ? `Invite sent by ${r.channel === 'email' ? 'email' : 'WhatsApp'} to ${r.contact}`
                          : `Not sent automatically — share it with ${r.contact}`}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => copyLink(r)}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy link
                    </Button>
                    {r.channel === 'email' ? (
                      <Button asChild size="sm" className="bg-[#0A66C2] text-xs text-white hover:bg-[#08519c]">
                        <a href={shareByEmailHref({ to: r.contact, recipientName: r.name, documentName, documentId: r.documentId, senderName })}>
                          <Mail className="mr-1.5 h-3.5 w-3.5" /> Share via email
                        </a>
                      </Button>
                    ) : (
                      <Button asChild size="sm" className="bg-[#0A66C2] text-xs text-white hover:bg-[#08519c]">
                        <a
                          href={shareByWhatsAppHref({ phone: r.contact, recipientName: r.name, documentName, documentId: r.documentId, senderName })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Share on WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end pt-2">
              <Button onClick={onClose} className="bg-[#FFC83D] font-semibold text-slate-900 hover:bg-[#e6b435]">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* 1. Document */}
            <section className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Document</h4>

              {locked && pdfFile ? (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <FileText className="h-6 w-6 shrink-0 text-[#0A66C2]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{pdfFile.name}</p>
                    <p className="text-xs text-slate-500">Includes your signature · {Math.round(pdfFile.size / 1024)} KB</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                    {([
                      { id: 'upload', label: 'Upload a PDF', icon: Upload },
                      { id: 'template', label: 'Use a template', icon: LayoutTemplate },
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSource(opt.id)}
                        className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors ${
                          source === opt.id ? 'bg-white text-[#0A66C2] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                      </button>
                    ))}
                  </div>

                  {source === 'upload' ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handlePickFile(e.dataTransfer.files?.[0]);
                      }}
                      className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 px-4 py-7 text-center transition-colors hover:border-[#0A66C2] hover:bg-blue-50/40"
                    >
                      {pdfFile ? (
                        <>
                          <FileText className="h-6 w-6 text-[#0A66C2]" />
                          <span className="text-sm font-semibold text-slate-900">{pdfFile.name}</span>
                          <span className="text-xs text-slate-500">{Math.round(pdfFile.size / 1024)} KB · click to replace</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-slate-400" />
                          <span className="text-sm font-semibold text-slate-700">Drop a PDF here or click to browse</span>
                          <span className="text-xs text-slate-500">Up to 600 KB</span>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          handlePickFile(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedTemplate.title}
                        onChange={(e) => {
                          const tpl = [template, ...DEFAULT_TEMPLATES].find((t) => t && !t.file && t.title === e.target.value);
                          if (tpl) setSelectedTemplate(tpl);
                        }}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                      >
                        {template && !template.file && !DEFAULT_TEMPLATES.some((t) => t.title === template.title) && (
                          <option value={template.title}>{template.title}</option>
                        )}
                        {DEFAULT_TEMPLATES.map((t) => (
                          <option key={t.title} value={t.title}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <div
                        className="prose prose-sm max-h-40 max-w-none overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(
                            fillTemplate(selectedTemplate.content, {
                              recipientName: recipients[0]?.name || 'Recipient name',
                              recipientEmail: recipients[0]?.email || recipients[0]?.phone || 'recipient@email.com',
                              senderName,
                              extra: fieldValues,
                            })
                          ),
                        }}
                      />
                      {inputTags.length > 0 && (
                        <div className="grid gap-3 pt-1 sm:grid-cols-2">
                          {inputTags.map((tag) => (
                            <div key={tag}>
                              <Label className="mb-1 block text-xs font-semibold text-slate-700">
                                {tagLabel(tag)}
                                {OPTIONAL_TAGS.includes(tag) && <span className="font-normal text-slate-400"> (optional)</span>}
                              </Label>
                              <Input
                                value={fieldValues[tag] ?? ''}
                                onChange={(e) => setFieldValues((prev) => ({ ...prev, [tag]: e.target.value }))}
                                placeholder={tag === 'ORGANIZATION_NAME' ? senderName : TAG_PLACEHOLDERS[tag] ?? tagLabel(tag)}
                                className="text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div>
                <Label className="mb-1 block text-xs font-semibold text-slate-700">Document title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={source === 'upload' ? pdfFile?.name.replace(/\.pdf$/i, '') || 'e.g. Services Agreement' : selectedTemplate.title}
                  className="text-sm"
                />
              </div>
            </section>

            {/* 2. Recipients */}
            <section className="space-y-3 border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">2. Who needs to sign?</h4>
              {recipients.map((r, i) => (
                <div key={i} className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
                      {([
                        { id: 'email', label: 'Email', icon: Mail },
                        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                      ] as const).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => updateRecipient(i, { channel: c.id })}
                          className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            r.channel === c.id ? 'bg-white text-[#0A66C2] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <c.icon className="h-3 w-3" /> {c.label}
                        </button>
                      ))}
                    </div>
                    {recipients.length > 1 && (
                      <button
                        type="button"
                        className="rounded p-1 text-slate-400 hover:text-rose-600"
                        onClick={() => setRecipients((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Remove recipient"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input value={r.name} onChange={(e) => updateRecipient(i, { name: e.target.value })} placeholder="Full name" className="text-sm" />
                    {r.channel === 'email' ? (
                      <Input
                        type="email"
                        value={r.email}
                        onChange={(e) => updateRecipient(i, { email: e.target.value })}
                        placeholder="email@example.com"
                        className="text-sm"
                      />
                    ) : (
                      <Input
                        type="tel"
                        value={r.phone}
                        onChange={(e) => updateRecipient(i, { phone: e.target.value })}
                        placeholder="+2348012345678"
                        className="text-sm"
                      />
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setRecipients((prev) => [...prev, emptyRecipient(prev[prev.length - 1]?.channel)])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add another person
              </button>
              <p className="text-[11px] text-slate-500">
                Email signers sign in with that address. WhatsApp signers confirm a code sent to their number — no account needed.
              </p>
            </section>

            {/* 3. Message */}
            <section className="space-y-2 border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Message (optional)</h4>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Add a note for the people signing"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
              />
            </section>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSending} className="bg-[#0A66C2] px-6 text-xs font-bold text-white hover:bg-[#08519c]">
                <Send className="mr-1.5 h-4 w-4" />
                {isSending ? 'Sending…' : 'Send for signature'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
