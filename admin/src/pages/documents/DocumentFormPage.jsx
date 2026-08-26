import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, Breadcrumbs, Tabs } from '@/components/ui/PageHeader.jsx';
import { Card, PageLoader } from '@/components/ui/index.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Select } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import DocumentFieldsForm from '@/components/documents/DocumentFieldsForm.jsx';
import { documentsApi, settingsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { DOCUMENT_TYPES, documentTypeLabel } from '@/utils/constants.js';

const STEPS = [
  { value: 0, label: '01 · Type' },
  { value: 1, label: '02 · Fields' },
  { value: 2, label: '03 · Preview' },
  { value: 3, label: '04 · Confirm & Issue' },
];

export default function DocumentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [draftId, setDraftId] = useState(id || null);
  const [documentType, setDocumentType] = useState('');
  const [fields, setFields] = useState({});
  const [signatoryId, setSignatoryId] = useState('');
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
    mutationFn: () => documentsApi.issue(draftId, { signatoryId: signatoryId || undefined }),
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
              This is an approximate preview. Final wording is generated from the official template at issuance.
            </p>
            <div className="border-2 p-8" style={{ borderColor: '#D4AF37', backgroundColor: '#FAFAF7' }}>
              <div className="text-mono text-xs uppercase tracking-widest mb-1" style={{ color: '#0A2342' }}>MetlifeDM LLC</div>
              <div className="text-display-sm mb-6" style={{ color: '#0A2342' }}>{documentTypeLabel(documentType)}</div>
              <div className="text-display-md text-center mb-6" style={{ color: '#0A2342' }}>{fields.employeeName || 'Recipient name'}</div>
              <p className="text-slate text-sm leading-relaxed">
                This is to certify that <strong>{fields.employeeName || '—'}</strong>
                {fields.designation ? <> served as <strong>{fields.designation}</strong></> : null}
                {fields.department ? <> in the <strong>{fields.department}</strong> department</> : null}
                {fields.joiningDate ? <> from <strong>{fields.joiningDate}</strong></> : null}
                {fields.isCurrentlyEmployed ? <> to <strong>Present</strong></> : fields.endDate ? <> to <strong>{fields.endDate}</strong></> : null}.
              </p>
              {fields.projectName && (
                <p className="text-slate text-sm leading-relaxed mt-3">
                  Project: <strong>{fields.projectName}</strong> — {fields.projectDescription}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-hairline">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>Back to fields</Button>
              <Button icon={ArrowRight} onClick={() => goTo(3)}>Continue to issue</Button>
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
