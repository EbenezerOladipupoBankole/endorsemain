import DOMPurify from 'dompurify';

export const signingLink = (documentId: string, channel?: string) =>
  `${window.location.origin}/sign/${documentId}${channel === 'whatsapp' ? '/verify' : ''}`;

export const phoneDigits = (phone: string) => phone.replace(/\D/g, '');

// Opens WhatsApp (app or web) with a ready-to-send message to the signer.
export const shareByWhatsAppHref = (opts: {
  phone: string;
  recipientName?: string;
  documentName: string;
  documentId: string;
  senderName?: string;
}) => {
  const text = [
    opts.recipientName ? `Hi ${opts.recipientName},` : 'Hi,',
    '',
    `${opts.senderName || 'I'} sent you "${opts.documentName}" to sign on Endorse. Open the link, confirm the code sent to this WhatsApp number, and sign:`,
    signingLink(opts.documentId, 'whatsapp'),
  ].join('\n');
  return `https://wa.me/${phoneDigits(opts.phone)}?text=${encodeURIComponent(text)}`;
};

// Opens the sender's own mail client with a ready-to-send message containing the signing link.
export const shareByEmailHref = (opts: {
  to: string;
  recipientName?: string;
  documentName: string;
  documentId: string;
  senderName?: string;
}) => {
  const greeting = opts.recipientName ? `Hi ${opts.recipientName},` : 'Hi,';
  const body = [
    greeting,
    '',
    `Please review and sign "${opts.documentName}" on Endorse:`,
    signingLink(opts.documentId),
    '',
    'Sign in or create a free Endorse account with this email address to open it.',
    '',
    opts.senderName ? `Thanks,\n${opts.senderName}` : 'Thanks',
  ].join('\n');

  return `mailto:${encodeURIComponent(opts.to)}?subject=${encodeURIComponent(
    `Please sign: ${opts.documentName}`
  )}&body=${encodeURIComponent(body)}`;
};

// Tags filled automatically from the recipient, sender and today's date.
const AUTO_FILLED_TAGS = ['RECIPIENT_NAME', 'STUDENT_NAME', 'RECIPIENT_EMAIL', 'STUDENT_EMAIL', 'SENDER_NAME', 'ADMIN_NAME', 'DATE', 'ISSUANCE_DATE'];

// Tags in a template that the sender has to type in (e.g. JOB_TITLE, SALARY), in order of appearance.
export const templateInputTags = (html: string) => {
  const tags = Array.from(html.matchAll(/\{\{([A-Z0-9_]+)\}\}/g), (m) => m[1]);
  return Array.from(new Set(tags)).filter((tag) => !AUTO_FILLED_TAGS.includes(tag));
};

export const tagLabel = (tag: string) => {
  const words = tag.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

// Fills {{PLACEHOLDER}} tags in template HTML. Legacy student-agreement tags are still supported.
export const fillTemplate = (
  html: string,
  values: { recipientName: string; recipientEmail: string; senderName: string; organization?: string; extra?: Record<string, string> }
) => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const map: Record<string, string> = {
    RECIPIENT_NAME: values.recipientName,
    STUDENT_NAME: values.recipientName,
    RECIPIENT_EMAIL: values.recipientEmail,
    STUDENT_EMAIL: values.recipientEmail,
    SENDER_NAME: values.senderName,
    ADMIN_NAME: values.senderName,
    ORGANIZATION_NAME: values.organization || values.senderName,
    DATE: today,
    ISSUANCE_DATE: today,
  };

  return html.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, tag: string) => {
    const value = values.extra?.[tag]?.trim() || map[tag];
    if (value) return escapeHtml(value);
    const label = tag.toLowerCase().replace(/_/g, ' ');
    return `[${label}]`;
  });
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html);

export const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// Firestore documents are capped at 1MB and base64 adds ~33%, so PDFs are stored inline only up to this size.
export const MAX_PDF_BYTES = 600 * 1024;

/**
 * The document ID from a signing link's URL. Messaging apps like WhatsApp sometimes attach
 * punctuation or invisible characters to a link; IDs are letters and numbers only, so keep that part.
 */
export const signingDocumentId = (raw?: string) => {
  let decoded = raw ?? '';
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* keep it as it is */
  }
  return decoded.match(/[A-Za-z0-9]+/)?.[0] ?? '';
};
