import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Breadcrumbs, Tabs } from '@/components/ui/PageHeader.jsx';
import { Card, PageLoader, Spinner } from '@/components/ui/index.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Select, Input } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import DocumentFieldsForm from '@/components/documents/DocumentFieldsForm.jsx';
import { documentsApi, settingsApi, documentTemplatesApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { DOCUMENT_TYPES, documentTypeLabel } from '@/utils/constants.js';

const STEPS = [
  { value: 0, label: '01 · Type' },
  { value: 1, label: '02 · Fields' },
  { value: 2, label: '03 · Preview' },
  { value: 3, label: '04 · Confirm & Issue' },
];

const NAVY = '#0A2342';
const GOLD = '#D4AF37';

const escapeHtml = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Client-side approximation of the backend's buildTokenValues/renderTemplateBody
// (document.controller.js) — for live preview only; the real substitution and
// rendering happens server-side at issue time.
const buildPreviewHtml = (bodyContent, fields) => {
  const responsibilities = fields.responsibilities || [];
  const technologies = fields.technologies || [];
  const tokenValues = {
    employeeName: escapeHtml(fields.employeeName),
    employeeId: escapeHtml(fields.employeeId),
    designation: escapeHtml(fields.designation),
    department: escapeHtml(fields.department),
    joiningDate: escapeHtml(fields.joiningDate),
    endDate: escapeHtml(fields.isCurrentlyEmployed ? 'Present' : fields.endDate),
    projectName: escapeHtml(fields.projectName),
    projectDescription: escapeHtml(fields.projectDescription),
    issueDate: escapeHtml(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })),
    responsibilities: responsibilities.length ? `<ul>${responsibilities.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : '',
    technologies: technologies.length ? escapeHtml(technologies.join(', ')) : '',
  };
  return (bodyContent || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (tokenValues[key] !== undefined ? tokenValues[key] : ''));
};

function ThemedPreview({ theme, documentType, fields, html }) {
  const label = documentTypeLabel(documentType);
  const body = <div className="prose prose-sm max-w-none" style={{ color: '#5B6479' }} dangerouslySetInnerHTML={{ __html: html }} />;

  if (theme === 'modern') {
    return (
      <div className="border-l-8 bg-white p-10" style={{ borderColor: NAVY }}>
        <div className="text-mono text-xs uppercase tracking-widest mb-1" style={{ color: '#8890A3' }}>MetlifeDM LLC</div>
        <div className="text-display-md mb-2" style={{ color: NAVY }}>{label}</div>
        <div className="w-16 h-0.75 mb-6" style={{ backgroundColor: GOLD }} />
        {body}
      </div>
    );
  }
  if (theme === 'elegant') {
    return (
      <div className="bg-white border border-hairline">
        <div className="p-6" style={{ backgroundColor: NAVY }}>
          <div className="text-sm uppercase tracking-widest" style={{ color: '#fff' }}>MetlifeDM LLC</div>
        </div>
        <div className="h-1" style={{ backgroundColor: GOLD }} />
        <div className="p-10">
          <div className="text-mono text-xs uppercase tracking-widest mb-4" style={{ color: '#8890A3' }}>{label}</div>
          {body}
        </div>
      </div>
    );
  }
  return (
    <div className="border-2 p-10 text-center" style={{ borderColor: GOLD, backgroundColor: '#FAFAF7' }}>
      <div className="text-mono text-xs uppercase tracking-widest mb-1" style={{ color: NAVY }}>MetlifeDM LLC</div>
      <div className="text-display-sm mb-4" style={{ color: NAVY }}>{label}</div>
      <div className="text-display-md mb-6" style={{ color: NAVY }}>{fields.employeeName || 'Recipient name'}</div>
      <div className="text-left">{body}</div>
    </div>
  );
}

export default function DocumentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [draftId, setDraftId] = useState(id || null);
  const [documentType, setDocumentType] = useState('');
  const [fields, setFields] = useState({});
  const [signatoryId, setSignatoryId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['admin', 'document', id],
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
  const { data: settings } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => settingsApi.get(),
  });
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['admin', 'document-templates', 'byType', documentType],
    queryFn: () => documentTemplatesApi.list({ documentType, limit: 50 }),
    enabled: step === 2 && !!documentType,
  });
  const activeTemplate = (templates?.data || []).find((t) => t.isActive && t.isDefault) || (templates?.data || []).find((t) => t.isActive);

  useEffect(() => {
    if (existing) {
      setDocumentType(existing.documentType);
      setFields(existing.fields || {});
      setStep(1);
      setMaxStep(1);
    }
  }, [existing]);

  useEffect(() => {
    const signatories = settings?.business?.signatories || [];
    if (!signatoryId && signatories.length) {
      setSignatoryId(String((signatories.find((s) => s.isDefault) || signatories[0])._id));
    }
  }, [settings, signatoryId]);

  const createDraft = useMutation({
    mutationFn: () => documentsApi.create({ documentType, fields }),
    onSuccess: (doc) => { setDraftId(doc._id); toast.success('Draft saved'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const updateDraft = useMutation({
    mutationFn: () => documentsApi.update(draftId, { documentType, fields }),
    onSuccess: () => { toast.success('Draft saved'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const issueDoc = useMutation({
    mutationFn: () => documentsApi.issue(draftId, { signatoryId: signatoryId || undefined, issueDate: issueDate || undefined }),
    onSuccess: () => { toast.success('Document issued'); setConfirmOpen(false); navigate(`/documents/${draftId}`); },
    onError: (e) => { toast.error(getErrorMessage(e)); setConfirmOpen(false); },
  });

  const goTo = (target) => {
    setMaxStep((m) => Math.max(m, target));
    setStep(target);
  };

  const saveDraft = (onDone) => {
    const mutation = draftId ? updateDraft : createDraft;
    mutation.mutate(undefined, { onSuccess: () => onDone?.() });
  };
  const savingDraft = createDraft.isPending || updateDraft.isPending;

  if (id && isLoading) return <PageLoader label="Loading document" />;
  if (id && existing && existing.status !== 'draft') {
    return (
      <>
        <Breadcrumbs items={[{ label: 'Documents', href: '/documents' }, { label: 'Edit' }]} />
        <Card>
          <p className="text-slate text-sm">This document has already been issued and can no longer be edited.</p>
          <Button className="mt-4" to={`/documents/${id}`} icon={ArrowLeft}>Back to document</Button>
        </Card>
      </>
    );
  }

  const fieldsValid = !!fields.employeeName?.trim();
  const signatories = settings?.business?.signatories || [];

  return (
    <>
      <Breadcrumbs items={[{ label: 'Documents', href: '/documents' }, { label: id ? 'Edit draft' : 'New document' }]} />
      <PageHeader
        eyebrow="Documents / New"
        title={<>Create a <span className="text-italic-fraunces text-ultra">document</span></>}
        subtitle="Draft, preview, then approve and issue an official document."
        tabs={<Tabs items={STEPS} active={step} onChange={(v) => v <= maxStep && setStep(v)} />}
      />

      <Card className="max-w-3xl">
        {step === 0 && (
          <div>
            <div className="text-eyebrow mb-4">Select document type</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {DOCUMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { setDocumentType(t.value); goTo(1); }}
                  className={`text-left p-4 border transition-colors ${documentType === t.value ? 'border-ultra bg-ultra-tint' : 'border-hairline-strong hover:border-ink'}`}
                >
                  <div className="text-mono text-[0.65rem] uppercase tracking-widest text-slate mb-1">{t.code}</div>
                  <div className="text-sm">{t.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="text-eyebrow mb-4">{documentTypeLabel(documentType)} — details</div>
            <DocumentFieldsForm documentType={documentType} value={fields} onChange={setFields} />
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-hairline">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(0)}>Back</Button>
              <div className="flex gap-2">
                <Button variant="ghost" icon={Save} loading={savingDraft} onClick={() => saveDraft()}>Save as draft</Button>
                <Button icon={ArrowRight} disabled={!fieldsValid} loading={savingDraft} onClick={() => saveDraft(() => goTo(2))}>Save & preview</Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="text-eyebrow mb-4">Preview</div>
            <p className="text-mono text-xs text-slate mb-4">
              Rendered live from the active template for this document type, in its selected theme. The real PDF is generated at issuance.
            </p>
            {templatesLoading ? (
              <div className="flex justify-center py-16"><Spinner size={24} className="text-ultra" /></div>
            ) : !activeTemplate ? (
              <div className="border border-dashed border-hairline p-8 text-center">
                <p className="text-sm text-slate mb-4">No active template found for {documentTypeLabel(documentType)}.</p>
                <Button to="/documents/templates/new" variant="ghost" size="sm">Create a template</Button>
              </div>
            ) : (
              <ThemedPreview
                theme={activeTemplate.theme}
                documentType={documentType}
                fields={fields}
                html={buildPreviewHtml(activeTemplate.bodyContent, fields)}
              />
            )}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-hairline">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>Back to fields</Button>
              <Button icon={ArrowRight} disabled={!activeTemplate} onClick={() => goTo(3)}>Continue to issue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="text-eyebrow mb-4">Confirm and issue</div>
            <p className="text-slate text-sm mb-6">
              Issuing generates the official document number, a secure verification token, and the final PDF. Once issued, this document&apos;s content can no longer be edited.
            </p>
            <div className="space-y-4 max-w-sm">
              <Select
                label="Authorized signatory"
                value={signatoryId}
                onChange={(e) => setSignatoryId(e.target.value)}
                options={[
                  { value: '', label: signatories.length ? 'Select…' : 'No signatories configured — using default' },
                  ...signatories.map((s) => ({ value: String(s._id), label: `${s.name}${s.title ? ` — ${s.title}` : ''}` })),
                ]}
                hint={!signatories.length ? 'Add signatories under Settings → Documents to appear here' : undefined}
              />
              <Input
                label="Issue date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                hint="Leave blank to use today's date"
              />
            </div>
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-hairline">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(2)}>Back to preview</Button>
              <Button icon={Check} onClick={() => setConfirmOpen(true)}>Approve & issue</Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { if (!issueDoc.isPending) setConfirmOpen(false); }}
        onConfirm={() => issueDoc.mutate()}
        loading={issueDoc.isPending}
        title="Issue this document?"
        description="This generates the official document number, verification token, and PDF. This cannot be undone — the document's content will be locked."
        confirmLabel="Approve & issue"
        variant="primary"
      />
    </>
  );
}
