import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { FREE_LIMIT_ENFORCED, tryClaimDocumentCredit, isOutOfFreeDocuments } from '@/lib/plan';
import type { DocComment } from '@/components/esign/viewerTools';
import { httpsCallable } from '@/lib/callable';
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
import { X } from 'lucide-react';

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
  const [showUpgrade, setShowUpgrade] = useState(false);
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
      const created: { r: Recipient; name: string; contact: string; id: string }[] = [];

      // Each recipient gets their own copy so signatures and status are tracked per person.
      // Copies start uncounted (creditOk: false); nothing is sent until the server has counted them.
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
          // Only marked uncounted once the limit is switched on; see FREE_LIMIT_ENFORCED.
          ...(FREE_LIMIT_ENFORCED ? { creditOk: false } : {}),
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

        created.push({ r, name, contact, id: ref.id });
      }

      // One send counts as one document, however many people sign it.
      if (FREE_LIMIT_ENFORCED) try {
        const credit = await tryClaimDocumentCredit('send', created.map((c) => c.id));
        if (credit && !credit.paid && credit.remaining !== null && credit.remaining <= 1) {
          toast.info(credit.remaining === 0
            ? 'That was your last free document.'
            : 'You have 1 free document left.');
        }
      } catch (err) {
        await Promise.all(created.map((c) => deleteDoc(doc(db, 'documents', c.id)).catch(() => undefined)));
        if (isOutOfFreeDocuments(err)) {
          setShowUpgrade(true);
          return;
        }
        throw err;
      }

      // Audit trail: the server records who created each copy, from which IP address and browser.
      const recordEvent = httpsCallable(functions, 'recordDocumentEvent');
      await Promise.all(
        created.map((c) =>
          recordEvent({ documentId: c.id, type: 'created' }).catch((err) => console.warn('Could not record document creation:', err))
        )
      );

      const results: SentRecipient[] = [];
      for (const { r, name, contact, id } of created) {
        let delivered = true;
        try {
          await (r.channel === 'email' ? sendEmailInvite : sendWhatsAppInvite)({ documentId: id });
        } catch (err) {
          console.warn(`${r.channel} invite failed:`, err);
          delivered = false;
        }
        results.push({ name, channel: r.channel, contact, documentId: id, delivered });
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

  const fieldLabel = 'mb-1.5 block text-sm font-medium text-slate-800';
  const hint = 'mt-1 text-xs text-slate-500';

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-dialog-title"
        className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-5 sm:px-6">
          <h2 id="send-dialog-title" className="text-lg font-semibold text-slate-900">
            {sent ? 'Sent' : locked ? 'Send to others to sign' : 'Send for signature'}
          </h2>
          <button onClick={onClose} className="-mr-2 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {sent ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
              <p className="text-sm text-slate-600">
                <span className="font-medium text-slate-900">{documentName}</span> is on its way. You'll get an email when{' '}
                {sent.length === 1 ? 'it has been signed' : 'everyone has signed'}, and you can follow it from your dashboard.
              </p>
              <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
                {sent.map((r) => (
                  <li key={r.documentId} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{r.name || r.contact}</p>
                      <p className={`truncate text-xs ${r.delivered ? 'text-slate-500' : 'text-amber-700'}`}>
                        {r.delivered
                          ? `${r.channel === 'email' ? 'Emailed' : 'Sent on WhatsApp'} to ${r.contact}`
                          : `Couldn't send automatically. Share the link with ${r.contact} yourself.`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-4 text-sm">
                      <button type="button" className="font-medium text-[#0A66C2] hover:underline" onClick={() => copyLink(r)}>
                        Copy link
                      </button>
                      {r.channel === 'email' ? (
                        <a
                          className="font-medium text-[#0A66C2] hover:underline"
                          href={shareByEmailHref({ to: r.contact, recipientName: r.name, documentName, documentId: r.documentId, senderName })}
                        >
                          Share by email
                        </a>
                      ) : (
                        <a
                          className="font-medium text-[#0A66C2] hover:underline"
                          href={shareByWhatsAppHref({ phone: r.contact, recipientName: r.name, documentName, documentId: r.documentId, senderName })}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Share on WhatsApp
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 justify-end border-t border-slate-200 px-5 py-4 sm:px-6">
              <Button onClick={onClose} className="h-10 bg-[#0A66C2] px-5 text-sm font-medium text-white hover:bg-[#08519c]">
                Done
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSend} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-5 sm:px-6">
              {locked && pdfFile ? (
                <p className="text-sm text-slate-600">
                  Your signed copy of <span className="font-medium text-slate-900">{pdfFile.name}</span> will be sent. Each person gets their own link to sign it.
                </p>
              ) : (
                <div>
                  <span className={fieldLabel}>Document</span>
                  <div className="mb-3 inline-flex rounded-md border border-slate-300 text-sm" role="radiogroup" aria-label="Document source">
                    {([
                      { id: 'upload', label: 'Upload a PDF' },
                      { id: 'template', label: 'Use a template' },
                    ] as const).map((opt, i) => (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={source === opt.id}
                        onClick={() => setSource(opt.id)}
                        className={`px-3 py-1.5 ${i > 0 ? 'border-l border-slate-300' : ''} ${
                          source === opt.id ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {source === 'upload' ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handlePickFile(e.dataTransfer.files?.[0]);
                      }}
                      className="flex items-center justify-between gap-3 rounded-md border border-slate-300 px-3 py-2.5"
                    >
                      <span className={`min-w-0 truncate text-sm ${pdfFile ? 'text-slate-900' : 'text-slate-500'}`}>
                        {pdfFile ? `${pdfFile.name} (${Math.round(pdfFile.size / 1024)} KB)` : 'No file chosen'}
                      </span>
                      <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => fileInputRef.current?.click()}>
                        {pdfFile ? 'Change' : 'Choose PDF'}
                      </Button>
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
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <select
                        aria-label="Template"
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
                      <details className="rounded-md border border-slate-200 text-sm">
                        <summary className="cursor-pointer px-3 py-2 text-slate-700">Preview</summary>
                        <div
                          className="prose prose-sm max-h-48 max-w-none overflow-y-auto border-t border-slate-200 p-3 text-xs text-slate-800"
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
                      </details>
                      {inputTags.map((tag) => (
                        <div key={tag}>
                          <Label htmlFor={`tag-${tag}`} className={fieldLabel}>
                            {tagLabel(tag)}
                            {OPTIONAL_TAGS.includes(tag) && <span className="font-normal text-slate-500"> (optional)</span>}
                          </Label>
                          <Input
                            id={`tag-${tag}`}
                            value={fieldValues[tag] ?? ''}
                            onChange={(e) => setFieldValues((prev) => ({ ...prev, [tag]: e.target.value }))}
                            className="h-10 text-sm"
                          />
                          {tag === 'ORGANIZATION_NAME' && <p className={hint}>If left blank, we'll use {senderName}.</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!locked && (
                <div>
                  <Label htmlFor="send-title" className={fieldLabel}>Title</Label>
                  <Input id="send-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 text-sm" />
                </div>
              )}

              <fieldset className="space-y-4">
                <legend className="mb-1.5 text-sm font-medium text-slate-800">{recipients.length > 1 ? 'Signers' : 'Who needs to sign?'}</legend>
                {recipients.map((r, i) => (
                  <div key={i} className={i > 0 ? 'border-t border-slate-200 pt-4' : ''}>
                    {recipients.length > 1 && (
                      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Signer {i + 1}</span>
                        <button
                          type="button"
                          className="font-medium text-slate-500 hover:text-rose-600"
                          onClick={() => setRecipients((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor={`name-${i}`} className={fieldLabel}>Name</Label>
                        <Input id={`name-${i}`} value={r.name} autoComplete="off" onChange={(e) => updateRecipient(i, { name: e.target.value })} className="h-10 text-sm" />
                      </div>
                      <div>
                        <Label htmlFor={`channel-${i}`} className={fieldLabel}>Send by</Label>
                        <select
                          id={`channel-${i}`}
                          value={r.channel}
                          onChange={(e) => updateRecipient(i, { channel: e.target.value as Channel })}
                          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                        >
                          <option value="email">Email</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        {r.channel === 'email' ? (
                          <>
                            <Label htmlFor={`contact-${i}`} className={fieldLabel}>Email address</Label>
                            <Input
                              id={`contact-${i}`}
                              type="email"
                              autoComplete="off"
                              value={r.email}
                              onChange={(e) => updateRecipient(i, { email: e.target.value })}
                              className="h-10 text-sm"
                            />
                          </>
                        ) : (
                          <>
                            <Label htmlFor={`contact-${i}`} className={fieldLabel}>WhatsApp number</Label>
                            <Input
                              id={`contact-${i}`}
                              type="tel"
                              autoComplete="off"
                              value={r.phone}
                              onChange={(e) => updateRecipient(i, { phone: e.target.value })}
                              className="h-10 text-sm"
                            />
                            <p className={hint}>Include the country code, starting with +. They'll confirm a code sent to this number, so no account is needed.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRecipients((prev) => [...prev, emptyRecipient(prev[prev.length - 1]?.channel)])}
                  className="text-sm font-medium text-[#0A66C2] hover:underline"
                >
                  + Add another signer
                </button>
              </fieldset>

              <div>
                <Label htmlFor="send-message" className={fieldLabel}>
                  Message <span className="font-normal text-slate-500">(optional)</span>
                </Label>
                <textarea
                  id="send-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-4 sm:px-6">
              <Button type="button" variant="ghost" onClick={onClose} className="h-10 text-sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isSending} className="h-10 bg-[#0A66C2] px-5 text-sm font-medium text-white hover:bg-[#08519c]">
                {isSending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </form>
        )}
      </div>
      <UpgradeDialog open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};
