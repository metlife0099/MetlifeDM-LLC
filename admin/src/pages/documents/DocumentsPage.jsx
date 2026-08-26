import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Plus,
  Download,
  Copy,
  QrCode,
  Ban,
  ShieldAlert,
  RefreshCw,
  ArrowLeft,
  Check,
  Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { Card, Badge, PageLoader, Kpi, Spinner } from '@/components/ui/index.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { Select, SearchInput, Textarea } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import DocumentFieldsForm from '@/components/documents/DocumentFieldsForm.jsx';
import { documentsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatDate, timeAgo, downloadBlob, humanize } from '@/utils/format.js';
import { DOCUMENT_TYPES, DOCUMENT_STATUSES, documentTypeLabel, documentStatusTone, SITE } from '@/utils/constants.js';

/* ============================================================
 * DOCUMENTS LIST + DASHBOARD
 * ============================================================ */
export function DocumentsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'createdAt', direction: 'desc' });
  const debounced = useDebounce(search, 300);

  const { data: stats } = useQuery({
    queryKey: ['admin', 'documents', 'stats'],
    queryFn: () => documentsApi.stats(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'documents', { page, debounced, documentType, status, sort }],
    queryFn: () => documentsApi.list({ page, search: debounced, documentType, status, limit: 25, sortBy: sort.key, sortOrder: sort.direction }),
  });

  const columns = [
    {
      key: 'documentNumber', label: 'Document', sortable: true,
      render: (r) => (
        <Link to={`/documents/${r._id}`} className="text-mono text-sm num-plate text-ink hover:text-ultra">
          {r.documentNumber || <span className="text-slate">Draft</span>}
        </Link>
      ),
    },
    { key: 'documentType', label: 'Type', render: (r) => documentTypeLabel(r.documentType) },
    {
      key: 'recipient', label: 'Recipient',
      render: (r) => <span className="text-sm">{r.snapshot?.recipientName || r.fields?.employeeName || '—'}</span>,
    },
    { key: 'status', label: 'Status', render: (r) => <Badge tone={documentStatusTone(r.status)}>{humanize(r.status)}</Badge> },
    { key: 'createdAt', label: 'Created', sortable: true, render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Documents / Certificates"
        title={<>Documents & <span className="text-italic-fraunces text-ultra">certificates</span></>}
        subtitle="Issue, verify, and manage official company documents."
        actions={<Button to="/documents/new" icon={Plus}>New document</Button>}
      />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-6">
          <Kpi label="Total" value={stats.total} icon={Award} />
          <Kpi label="Drafts" value={stats.draft} />
          <Kpi label="Issued" value={stats.issued} />
          <Kpi label="Valid" value={stats.valid} />
          <Kpi label="Revoked" value={stats.revoked} />
          <Kpi label="Cancelled" value={stats.cancelled} />
        </div>
      )}

      <FilterBar>
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search by number or recipient…" className="w-72" />
        <Select className="w-56" options={[{ value: '', label: 'All document types' }, ...DOCUMENT_TYPES]} value={documentType} onChange={(e) => { setDocumentType(e.target.value); setPage(1); }} />
        <Select className="w-40" options={[{ value: '', label: 'All statuses' }, ...DOCUMENT_STATUSES]} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
      </FilterBar>

      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        sort={sort} onSortChange={setSort}
        onRowClick={(row) => { window.location.assign(`/documents/${row._id}`); }}
        emptyIcon={Award} emptyTitle="No documents yet"
        emptySubtitle="Issue your first official document to see it here."
      />
    </>
  );
}

/* ============================================================
 * DOCUMENT DETAIL
 * ============================================================ */
export function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reasonModal, setReasonModal] = useState(null); // 'revoke' | 'cancel' | null
  const [reason, setReason] = useState('');
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceReason, setReplaceReason] = useState('');
  const [replaceFields, setReplaceFields] = useState({});
  const [qrOpen, setQrOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: document, isLoading } = useQuery({
    queryKey: ['admin', 'document', id],
    queryFn: () => documentsApi.get(id),
  });
  const { data: audit } = useQuery({
    queryKey: ['admin', 'document', id, 'audit'],
    queryFn: () => documentsApi.auditHistory(id),
    enabled: !!document,
  });
  const { data: qr } = useQuery({
    queryKey: ['admin', 'document', id, 'qr'],
    queryFn: () => documentsApi.qrPreview(id),
    enabled: qrOpen && document?.status === 'issued',
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin', 'document', id] });
    qc.invalidateQueries({ queryKey: ['admin', 'documents'] });
  };

  const revoke = useMutation({
    mutationFn: () => documentsApi.revoke(id, reason),
    onSuccess: () => { invalidate(); toast.success('Document revoked'); setReasonModal(null); setReason(''); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const cancel = useMutation({
    mutationFn: () => documentsApi.cancel(id, reason),
    onSuccess: () => { invalidate(); toast.success('Document cancelled'); setReasonModal(null); setReason(''); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const replace = useMutation({
    mutationFn: () => documentsApi.replace(id, { reason: replaceReason, fields: replaceFields }),
    onSuccess: (result) => {
      invalidate();
      toast.success('Document replaced');
      setReplaceOpen(false);
      navigate(`/documents/${result.newDocument._id}`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await documentsApi.downloadPdf(id);
      downloadBlob(res.data, `${document.documentNumber}.pdf`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  };

  const copyVerifyLink = async () => {
    const url = `${SITE.publicUrl}/verify/${document.verificationToken}`;
    await navigator.clipboard.writeText(url);
    toast.success('Verification link copied');
  };

  if (isLoading) return <PageLoader label="Loading document" />;
  if (!document) return null;

  const isDraft = document.status === 'draft';
  const isIssued = document.status === 'issued';
  const snapshot = document.snapshot || {};
  const reasonValid = reason.trim().length >= 10;
  const replaceReasonValid = replaceReason.trim().length >= 10;

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Documents', href: '/documents' },
        { label: document.documentNumber || 'Draft' },
      ]} />
      <PageHeader
        eyebrow={`Created ${formatDate(document.createdAt, 'datetime')}`}
        title={<>{documentTypeLabel(document.documentType)}<span className="text-italic-fraunces text-ultra"> {document.documentNumber ? `#${document.documentNumber.split('/').pop()}` : '(draft)'}</span></>}
        subtitle={<Badge tone={documentStatusTone(document.status)}>{humanize(document.status)}</Badge>}
        actions={
          <>
            <Button variant="ghost" to="/documents" icon={ArrowLeft}>Back</Button>
            {isDraft && <Button icon={Pencil} to={`/documents/${id}/edit`}>Continue / Issue</Button>}
            {isIssued && (
              <>
                <Button variant="ghost" icon={QrCode} onClick={() => setQrOpen(true)}>QR</Button>
                <Button variant="ghost" icon={Copy} onClick={copyVerifyLink}>Copy link</Button>
                <Button variant="ghost" icon={Download} onClick={downloadPdf} loading={downloading}>PDF</Button>
                <Button variant="danger_ghost" icon={ShieldAlert} onClick={() => setReasonModal('revoke')}>Revoke</Button>
                <Button variant="danger_ghost" icon={Ban} onClick={() => setReasonModal('cancel')}>Cancel</Button>
                <Button variant="ghost" icon={RefreshCw} onClick={() => { setReplaceFields(document.fields || {}); setReplaceOpen(true); }}>Replace</Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Certificate preview */}
          <div className="border-2 p-8" style={{ borderColor: '#D4AF37', backgroundColor: '#FAFAF7' }}>
            <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: '#D4AF37' }}>
              <div>
                <div className="text-mono text-xs uppercase tracking-widest" style={{ color: '#0A2342' }}>
                  {snapshot.company?.name || 'MetlifeDM LLC'}
                </div>
                <div className="text-display-sm mt-1" style={{ color: '#0A2342' }}>{documentTypeLabel(document.documentType)}</div>
              </div>
              {document.documentNumber && (
                <div className="text-right">
                  <div className="text-mono text-xs num-plate" style={{ color: '#0A2342' }}>{document.documentNumber}</div>
                  <div className="text-mono text-[0.65rem] text-slate mt-1">Issued {formatDate(document.issuedAt, 'long')}</div>
                </div>
              )}
            </div>
            {isDraft ? (
              <p className="text-slate text-sm italic">This document is still a draft — the full certificate preview and PDF are generated when it&apos;s approved and issued.</p>
            ) : (
              <>
                <div className="text-display-md text-center mb-6" style={{ color: '#0A2342' }}>{snapshot.recipientName}</div>
                <p className="text-slate text-sm leading-relaxed whitespace-pre-line">{snapshot.renderedBody}</p>
                {snapshot.responsibilities?.length > 0 && (
                  <div className="mt-6">
                    <div className="text-eyebrow mb-2">Responsibilities</div>
                    <ul className="text-sm text-slate space-y-1 list-disc list-inside">
                      {snapshot.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Status history */}
          {document.statusHistory?.length > 0 && (
            <Card padding={false} className="p-6">
              <div className="text-eyebrow mb-4">Timeline</div>
              <ul className="divide-editorial">
                {document.statusHistory.map((t, i) => (
                  <li key={i} className="py-3 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-ultra mt-2 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm capitalize">{t.status}</div>
                      {t.note && <div className="text-slate text-xs mt-0.5">{t.note}</div>}
                      <div className="text-mono text-xs text-slate uppercase tracking-widest mt-1">{timeAgo(t.at)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Details</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate">Type</span><span>{documentTypeLabel(document.documentType)}</span></div>
              <div className="flex justify-between"><span className="text-slate">Designation</span><span>{document.fields?.designation || snapshot.designation || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate">Department</span><span>{document.fields?.department || snapshot.department || '—'}</span></div>
              {document.replaces && (
                <div className="pt-2 border-t border-hairline">
                  <Link to={`/documents/${document.replaces}`} className="text-mono text-xs text-ultra hover:text-ink">Replaces a previous document →</Link>
                </div>
              )}
              {document.replacedBy && (
                <div className="pt-2 border-t border-hairline">
                  <Link to={`/documents/${document.replacedBy}`} className="text-mono text-xs text-ultra hover:text-ink">Replaced by a newer document →</Link>
                </div>
              )}
            </div>
          </Card>

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Audit history</div>
            {!audit ? (
              <div className="flex justify-center py-4"><Spinner size={18} className="text-ultra" /></div>
            ) : audit.history?.length ? (
              <ul className="space-y-3 text-sm">
                {audit.history.map((h) => (
                  <li key={h._id}>
                    <div className="text-mono text-xs uppercase tracking-widest text-ink">{h.action}</div>
                    <div className="text-slate text-xs mt-0.5">{h.actorEmail} · {timeAgo(h.createdAt)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate text-sm">No audit entries yet.</p>
            )}
          </Card>
        </aside>
      </div>

      <Modal
        open={!!reasonModal}
        onClose={() => { if (!revoke.isPending && !cancel.isPending) { setReasonModal(null); setReason(''); } }}
        title={reasonModal === 'revoke' ? 'Revoke this document' : 'Cancel this document'}
        description="This is a permanent status change and will be recorded in the audit trail. A reason is required."
        footer={
          <>
            <Button variant="ghost" onClick={() => setReasonModal(null)} disabled={revoke.isPending || cancel.isPending}>Cancel</Button>
            <Button
              variant="danger"
              disabled={!reasonValid}
              loading={revoke.isPending || cancel.isPending}
              onClick={() => (reasonModal === 'revoke' ? revoke.mutate() : cancel.mutate())}
            >
              {reasonModal === 'revoke' ? 'Revoke document' : 'Cancel document'}
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={reason !== '' && !reasonValid ? 'Enter at least 10 characters' : undefined}
          hint="Recorded in the document's permanent audit trail"
        />
      </Modal>

      <Modal
        open={replaceOpen}
        onClose={() => { if (!replace.isPending) setReplaceOpen(false); }}
        title="Replace this document"
        description="Issues a brand-new document with a new number and verification token. The original is marked replaced and its verify page will point to the new one."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReplaceOpen(false)} disabled={replace.isPending}>Cancel</Button>
            <Button variant="primary" disabled={!replaceReasonValid} loading={replace.isPending} onClick={() => replace.mutate()}>
              <Check size={14} strokeWidth={1.5} /> Issue replacement
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Textarea
            label="Reason for replacement"
            required
            rows={2}
            value={replaceReason}
            onChange={(e) => setReplaceReason(e.target.value)}
            error={replaceReason !== '' && !replaceReasonValid ? 'Enter at least 10 characters' : undefined}
          />
          <DocumentFieldsForm documentType={document.documentType} value={replaceFields} onChange={setReplaceFields} />
        </div>
      </Modal>

      <Modal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Verification QR code"
        description={qr ? qr.verifyUrl : 'Loading…'}
        size="sm"
        footer={<Button variant="ghost" onClick={() => setQrOpen(false)}>Close</Button>}
      >
        {qr?.qrCode ? (
          <div className="flex justify-center py-2">
            <img src={qr.qrCode} alt="Verification QR code" className="w-48 h-48 border border-hairline" />
          </div>
        ) : (
          <div className="flex justify-center py-8"><Spinner size={20} className="text-ultra" /></div>
        )}
      </Modal>
    </>
  );
}
