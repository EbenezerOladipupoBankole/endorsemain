import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/components/client';
import { useAuth } from '@/components/AuthContext';
import { FileText, Save, Tag, Plus, Send, Pencil } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export interface AgreementTemplate {
  id?: string;
  title: string;
  category: string;
  description: string;
  content: string;
  fields: string[];
  createdAt?: any;
  ownerUid?: string;
  /** Set when sending an uploaded PDF instead of an HTML template. */
  file?: File;
}

const STANDARD_FIELDS = ['RECIPIENT_NAME', 'RECIPIENT_EMAIL', 'SENDER_NAME', 'ORGANIZATION_NAME', 'DATE'];

export const DEFAULT_TEMPLATES: AgreementTemplate[] = [
  {
    title: 'Mutual Non-Disclosure Agreement',
    category: 'Legal',
    description: 'Two-way NDA for sharing confidential information with a partner, client or candidate.',
    fields: STANDARD_FIELDS,
    content: `
      <h2 style="text-align: center;">Mutual Non-Disclosure Agreement</h2>
      <p>This Mutual Non-Disclosure Agreement ("Agreement") is entered into on <strong>{{DATE}}</strong> between <strong>{{ORGANIZATION_NAME}}</strong> and <strong>{{RECIPIENT_NAME}}</strong> ({{RECIPIENT_EMAIL}}), each a "Party".</p>
      <h4>1. Confidential Information</h4>
      <p>"Confidential Information" means any non-public business, technical or financial information disclosed by one Party to the other, in any form, that is marked confidential or would reasonably be understood to be confidential.</p>
      <h4>2. Obligations</h4>
      <p>Each Party will use the other's Confidential Information only to evaluate or carry out the business relationship between the Parties, and will not disclose it to any third party without prior written consent.</p>
      <h4>3. Exclusions</h4>
      <p>These obligations do not apply to information that is publicly available, already known to the receiving Party, independently developed, or lawfully received from a third party.</p>
      <h4>4. Term</h4>
      <p>This Agreement remains in effect for two (2) years from the date above.</p>
      <p>By signing below, {{RECIPIENT_NAME}} agrees to the terms of this Agreement.</p>
      <p>Sent by: <strong>{{SENDER_NAME}}</strong></p>
    `,
  },
  {
    title: 'Services Agreement',
    category: 'Sales',
    description: 'Simple agreement covering scope of work, fees and payment terms for a client engagement.',
    fields: [...STANDARD_FIELDS, 'SCOPE_OF_WORK', 'FEE'],
    content: `
      <h2 style="text-align: center;">Services Agreement</h2>
      <p>This Services Agreement is made on <strong>{{DATE}}</strong> between <strong>{{ORGANIZATION_NAME}}</strong> ("Provider") and <strong>{{RECIPIENT_NAME}}</strong> ({{RECIPIENT_EMAIL}}) ("Client").</p>
      <h4>1. Services</h4>
      <p>Provider will perform the following services: {{SCOPE_OF_WORK}}</p>
      <h4>2. Fees &amp; Payment</h4>
      <p>Client agrees to pay {{FEE}}. Invoices are due within thirty (30) days of receipt.</p>
      <h4>3. Term &amp; Termination</h4>
      <p>Either Party may terminate this Agreement with fourteen (14) days' written notice. Fees for services already performed remain payable.</p>
      <p>By signing below, the Client accepts the terms of this Agreement.</p>
      <p>Sent by: <strong>{{SENDER_NAME}}</strong></p>
    `,
  },
  {
    title: 'Offer Letter',
    category: 'HR',
    description: 'Employment offer with role, start date and compensation for the candidate to accept.',
    fields: [...STANDARD_FIELDS, 'JOB_TITLE', 'START_DATE', 'SALARY'],
    content: `
      <h2>Offer of Employment</h2>
      <p>{{DATE}}</p>
      <p>Dear {{RECIPIENT_NAME}},</p>
      <p>We are delighted to offer you the position of <strong>{{JOB_TITLE}}</strong> at <strong>{{ORGANIZATION_NAME}}</strong>, starting on <strong>{{START_DATE}}</strong>.</p>
      <p>Your annual base salary will be <strong>{{SALARY}}</strong>, paid in accordance with the company's standard payroll schedule.</p>
      <p>This offer is contingent on the completion of standard pre-employment checks. Please sign below to accept.</p>
      <p>Kind regards,<br/><strong>{{SENDER_NAME}}</strong></p>
    `,
  },
];

interface TemplateStudioProps {
  onSelectTemplateToDispatch?: (template: AgreementTemplate) => void;
}

export const TemplateStudio: React.FC<TemplateStudioProps> = ({ onSelectTemplateToDispatch }) => {
  const { user } = useAuth();
  const [savedTemplates, setSavedTemplates] = useState<AgreementTemplate[]>([]);
  const [mode, setMode] = useState<'library' | 'editor'>('library');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [fields, setFields] = useState<string[]>(STANDARD_FIELDS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    return onSnapshot(
      query(collection(db, 'templates'), where('ownerUid', '==', user.uid)),
      (snap) => setSavedTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AgreementTemplate)),
      (err) => console.warn('Could not load saved templates:', err)
    );
  }, [user?.uid]);

  const templates = [...savedTemplates, ...DEFAULT_TEMPLATES];

  const openEditor = (tpl?: AgreementTemplate) => {
    setTitle(tpl ? tpl.title : 'New template');
    setCategory(tpl?.category || 'General');
    setDescription(tpl?.description || '');
    setContent(tpl?.content || '<p>Write your agreement here. Use the fields above to personalise it for each recipient.</p>');
    setFields(tpl?.fields?.length ? tpl.fields : STANDARD_FIELDS);
    setMode('editor');
  };

  const insertTag = (tag: string) => {
    setContent((prev) => `${prev} {{${tag}}} `);
  };

  const addCustomTag = () => {
    const clean = customTag.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!clean) return;
    if (!fields.includes(clean)) setFields([...fields, clean]);
    insertTag(clean);
    setCustomTag('');
  };

  const saveTemplate = async () => {
    if (!user?.uid) return;
    if (!title.trim() || !content.trim()) {
      toast.error('Add a title and some content first.');
      return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'templates'), {
        title: title.trim(),
        category,
        description,
        content,
        fields,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success('Template saved');
      setMode('library');
    } catch (err) {
      console.error('Save template error:', err);
      toast.error('Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  if (mode === 'editor') {
    return (
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Edit template</h3>
          <button onClick={() => setMode('library')} className="text-xs font-semibold text-slate-500 hover:text-slate-900">
            Back to templates
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Consulting Agreement" className="text-sm" />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Sales, HR, Legal" className="text-sm" />
          </div>
          <div className="md:col-span-2">
            <Label className="mb-1 block text-xs font-semibold text-slate-700">Short description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this template for?" className="text-sm" />
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#0A66C2]">
            <Tag className="h-3.5 w-3.5" /> Fields
          </p>
          <p className="mb-3 text-[11px] text-slate-600">
            Click to insert. Recipient name, email, sender and date fill in automatically when you send.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {fields.map((field) => (
              <button
                key={field}
                type="button"
                onClick={() => insertTag(field)}
                className="rounded-md border border-blue-200 bg-white px-2 py-1 font-mono text-[11px] text-blue-800 hover:bg-[#0A66C2] hover:text-white"
              >
                {`{{${field}}}`}
              </button>
            ))}
          </div>
          <div className="flex max-w-sm items-center gap-2">
            <Input value={customTag} onChange={(e) => setCustomTag(e.target.value)} placeholder="Custom field, e.g. PROJECT_NAME" className="h-8 bg-white text-xs" />
            <Button onClick={addCustomTag} size="sm" className="h-8 bg-[#0A66C2] text-xs text-white hover:bg-[#08519c]">
              Add
            </Button>
          </div>
        </div>

        <ReactQuill value={content} onChange={setContent} theme="snow" className="min-h-[260px] rounded-lg bg-white" />

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={saveTemplate} disabled={isSaving} className="text-xs">
            <Save className="mr-1.5 h-4 w-4" /> {isSaving ? 'Saving…' : 'Save template'}
          </Button>
          {onSelectTemplateToDispatch && (
            <Button
              onClick={() => onSelectTemplateToDispatch({ title, category, description, content, fields })}
              className="bg-[#0A66C2] text-xs font-bold text-white hover:bg-[#08519c]"
            >
              <Send className="mr-1.5 h-4 w-4" /> Send for signature
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-bold text-slate-900">Templates</h3>
          <p className="text-xs text-slate-500">Reusable agreements that fill in each recipient's details automatically.</p>
        </div>
        <Button onClick={() => openEditor()} className="bg-[#0A66C2] text-xs font-semibold text-white hover:bg-[#08519c]">
          <Plus className="mr-1.5 h-4 w-4" /> New template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => (
          <div key={tpl.id || tpl.title} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#0A66C2]">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0A66C2]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{tpl.category}</span>
                {tpl.id && <span className="rounded-full bg-[#FFF4D6] px-2 py-0.5 text-[10px] font-semibold text-slate-700">Yours</span>}
              </div>
              <h4 className="mt-2 text-sm font-bold text-slate-900">{tpl.title}</h4>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{tpl.description}</p>
            </div>
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
              {onSelectTemplateToDispatch && (
                <Button onClick={() => onSelectTemplateToDispatch(tpl)} size="sm" className="flex-1 bg-[#0A66C2] text-xs font-semibold text-white hover:bg-[#08519c]">
                  Use template
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => openEditor(tpl)} className="text-xs">
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
