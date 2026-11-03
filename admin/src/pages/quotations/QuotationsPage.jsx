import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Mail, Plus, ReceiptText, Save, Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import { Card, Badge, PageLoader } from '@/components/ui/index.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { Input, Textarea, Select, SearchInput } from '@/components/form/index.jsx';
import { quotationsApi, settingsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { downloadBlob, formatDate, formatMoney, humanize } from '@/utils/format.js';
import { useDebounce } from '@/hooks/index.js';

const statusTone = (status) => ({ draft: 'default', sent: 'success', expired: 'warn', cancelled: 'danger' }[status] || 'default');
const inThirtyDays = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
};
const emptyServiceSection = () => ({ title: '', scopeText: '', deliverablesText: '' });
const emptyForm = () => ({
  client: { name: '', email: '', company: '', phone: '', address: '' },
  projectTitle: '', projectSummary: '',
  lineItems: [{ title: '', description: '', quantity: 1, unitPrice: 0 }],
  currency: 'USD', discount: 0, taxRate: 0,
  serviceSections: [emptyServiceSection()], timeline: '',
  paymentTerms: '50% upfront to commence work; remaining balance due according to agreed project milestones.',
  terms: 'This quotation is valid until the date shown. Work begins after written approval and receipt of the initial payment. Any work outside the stated scope requires a written change request and may affect pricing and delivery dates.',
  notes: '', validUntil: inThirtyDays(), signatoryId: '',
});
const lines = (text) => String(text || '').split('\n').map((value) => value.trim()).filter(Boolean);

export function QuotationsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const debounced = useDebounce(search, 300);
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'quotations', { page, debounced, status }],
    queryFn: () => quotationsApi.list({ page, limit: 25, search: debounced, status, sortBy: 'createdAt', sortOrder: 'desc' }),
  });
  const columns = [
    { key: 'quotationNumber', label: 'Quotation', render: (row) => <Link className="text-mono text-sm text-ultra" to={`/quotations/${row._id}`}>{row.quotationNumber}</Link> },
    { key: 'client', label: 'Client', render: (row) => <div><div className="text-sm">{row.client?.name}</div><div className="text-xs text-slate">{row.client?.company || row.client?.email}</div></div> },
    { key: 'projectTitle', label: 'Project' },
    { key: 'total', label: 'Total', render: (row) => <span className="text-mono">{formatMoney(row.total, { currency: row.currency, decimals: 2 })}</span> },
    { key: 'validUntil', label: 'Valid until', render: (row) => formatDate(row.validUntil) },
    { key: 'status', label: 'Status', render: (row) => <Badge tone={statusTone(row.status)}>{humanize(row.status)}</Badge> },
  ];
  return <>
    <PageHeader eyebrow="Documents / Quotations" title={<>Client <span className="text-italic-fraunces text-ultra">quotations</span></>} subtitle="Create branded project quotations, download professional PDFs, and deliver them through Brevo." actions={<Button to="/quotations/new" icon={Plus}>New quotation</Button>} />
    <FilterBar>
      <SearchInput className="w-80" value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search client, project, email, or number…" />
      <Select className="w-44" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} options={[{ value: '', label: 'All statuses' }, ...['draft', 'sent', 'expired', 'cancelled'].map((value) => ({ value, label: humanize(value) }))]} />
    </FilterBar>
    <DataTable columns={columns} rows={data?.data || []} loading={isLoading} meta={data?.meta} onPageChange={setPage} onRowClick={(row) => navigate(`/quotations/${row._id}`)} emptyIcon={ReceiptText} emptyTitle="No quotations yet" emptySubtitle="Create your first professional client quotation." />
  </>;
}

export function QuotationEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [sendOpen, setSendOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [email, setEmail] = useState({ recipientEmail: '', cc: '', subject: '', message: '' });

  const { data: quotation, isLoading } = useQuery({
    queryKey: ['admin', 'quotation', id],
    queryFn: () => quotationsApi.get(id), enabled: !isNew,
  });
  const { data: settings } = useQuery({ queryKey: ['admin', 'settings'], queryFn: () => settingsApi.get() });
  const signatories = useMemo(() => settings?.business?.signatories || [], [settings]);

  useEffect(() => {
    if (!quotation) return;
    const serviceSections = quotation.serviceSections?.length
      ? quotation.serviceSections.map((section) => ({
        title: section.title || '',
        scopeText: (section.scope || []).join('\n'),
        deliverablesText: (section.deliverables || []).join('\n'),
      }))
      : (quotation.scope?.length || quotation.deliverables?.length)
        ? [{
          title: quotation.projectTitle || 'Project services',
          scopeText: (quotation.scope || []).join('\n'),
          deliverablesText: (quotation.deliverables || []).join('\n'),
        }]
        : [emptyServiceSection()];
    setForm({
      client: quotation.client || emptyForm().client,
      projectTitle: quotation.projectTitle || '', projectSummary: quotation.projectSummary || '',
      lineItems: quotation.lineItems?.length ? quotation.lineItems.map(({ title, description, quantity, unitPrice }) => ({ title, description: description || '', quantity, unitPrice })) : emptyForm().lineItems,
      currency: quotation.currency || 'USD', discount: quotation.discount || 0, taxRate: quotation.taxRate || 0,
      serviceSections,
      timeline: quotation.timeline || '', paymentTerms: quotation.paymentTerms || '', terms: quotation.terms || '', notes: quotation.notes || '',
      validUntil: quotation.validUntil?.slice(0, 10) || inThirtyDays(), signatoryId: quotation.signatoryId || '',
    });
  }, [quotation]);

  useEffect(() => {
    if (form.signatoryId || !signatories.length) return;
    const selected = signatories.find((item) => item.isDefault) || signatories[0];
    if (selected?._id) setForm((current) => ({ ...current, signatoryId: selected._id }));
  }, [form.signatoryId, signatories]);

  const totals = useMemo(() => {
    const subtotal = form.lineItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    const discount = Math.min(Number(form.discount) || 0, subtotal);
    const tax = (subtotal - discount) * (Number(form.taxRate) || 0) / 100;
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  }, [form.lineItems, form.discount, form.taxRate]);

  const payload = () => ({
    client: form.client, projectTitle: form.projectTitle, projectSummary: form.projectSummary,
    lineItems: form.lineItems, currency: form.currency, discount: Number(form.discount) || 0, taxRate: Number(form.taxRate) || 0,
    scope: [], deliverables: [],
    serviceSections: form.serviceSections
      .filter((section) => section.title.trim() || lines(section.scopeText).length || lines(section.deliverablesText).length)
      .map((section) => ({
        title: section.title,
        scope: lines(section.scopeText),
        deliverables: lines(section.deliverablesText),
      })),
    timeline: form.timeline,
    paymentTerms: form.paymentTerms, terms: form.terms, notes: form.notes,
    validUntil: form.validUntil, signatoryId: form.signatoryId || undefined,
  });

  const save = useMutation({
    mutationFn: () => isNew ? quotationsApi.create(payload()) : quotationsApi.update(id, payload()),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotations'] });
      queryClient.setQueryData(['admin', 'quotation', result._id], result);
      toast.success(isNew ? 'Quotation created' : 'Quotation updated');
      if (isNew) navigate(`/quotations/${result._id}`, { replace: true });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const sendQuotation = useMutation({
    mutationFn: () => quotationsApi.send(id, email),
    onSuccess: (result) => {
      queryClient.setQueryData(['admin', 'quotation', id], result.quotation || result);
      queryClient.invalidateQueries({ queryKey: ['admin', 'quotations'] });
      setSendOpen(false); toast.success('Quotation sent with PDF attached');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const setClient = (key, value) => setForm((current) => ({ ...current, client: { ...current.client, [key]: value } }));
  const setItem = (index, key, value) => setForm((current) => ({ ...current, lineItems: current.lineItems.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) }));
  const addItem = () => setForm((current) => ({ ...current, lineItems: [...current.lineItems, { title: '', description: '', quantity: 1, unitPrice: 0 }] }));
  const removeItem = (index) => setForm((current) => ({ ...current, lineItems: current.lineItems.filter((_, itemIndex) => itemIndex !== index) }));
  const setServiceSection = (index, key, value) => setForm((current) => ({
    ...current,
    serviceSections: current.serviceSections.map((section, sectionIndex) => sectionIndex === index ? { ...section, [key]: value } : section),
  }));
  const addServiceSection = () => setForm((current) => ({ ...current, serviceSections: [...current.serviceSections, emptyServiceSection()] }));
  const removeServiceSection = (index) => setForm((current) => ({
    ...current,
    serviceSections: current.serviceSections.length === 1
      ? [emptyServiceSection()]
      : current.serviceSections.filter((_, sectionIndex) => sectionIndex !== index),
  }));
  const openSend = () => {
    setEmail({
      recipientEmail: quotation?.client?.email || form.client.email,
      cc: '', subject: `Quotation ${quotation?.quotationNumber} — ${quotation?.projectTitle || form.projectTitle}`,
      message: `Dear ${quotation?.client?.name || form.client.name},\n\nThank you for the opportunity to work with you. Please find attached our detailed quotation for ${quotation?.projectTitle || form.projectTitle}.\n\nWe would be happy to discuss any questions or adjustments.\n\nSincerely,\nMetlifeDM LLC`,
    });
    setSendOpen(true);
  };
  const download = async () => {
    setDownloading(true);
    try {
      const response = await quotationsApi.downloadPdf(id);
      downloadBlob(response.data, `${quotation.quotationNumber.replaceAll('/', '-')}.pdf`);
    } catch (error) { toast.error(getErrorMessage(error)); } finally { setDownloading(false); }
  };

  if (!isNew && isLoading) return <PageLoader label="Loading quotation" />;
  return <>
    <Breadcrumbs items={[{ label: 'Quotations', href: '/quotations' }, { label: quotation?.quotationNumber || 'New quotation' }]} />
    <PageHeader eyebrow="Documents / Client quotation" title={isNew ? <>Create a <span className="text-italic-fraunces text-ultra">quotation</span></> : <>{quotation?.quotationNumber} <span className="text-italic-fraunces text-ultra">v{quotation?.version}</span></>} subtitle="Server-calculated pricing on MetlifeDM letterhead with CEO, Co-Founder, and company seal approval blocks." actions={<><Button variant="ghost" to="/quotations">Back</Button>{!isNew && <Button variant="ghost" icon={Download} loading={downloading} onClick={download}>Download PDF</Button>}{!isNew && <Button variant="ultra" icon={Send} onClick={openSend}>Send to client</Button>}<Button icon={Save} loading={save.isPending} onClick={() => save.mutate()}>Save quotation</Button></>} />

    <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
      <div className="space-y-6">
        <Card><div className="text-eyebrow mb-5">01 / Client</div><div className="grid gap-4 md:grid-cols-2"><Input label="Client name" required value={form.client.name} onChange={(e) => setClient('name', e.target.value)} /><Input label="Client email (optional)" type="email" hint="Required only when sending the quotation by email" value={form.client.email} onChange={(e) => setClient('email', e.target.value)} /><Input label="Company" value={form.client.company} onChange={(e) => setClient('company', e.target.value)} /><Input label="Phone" value={form.client.phone} onChange={(e) => setClient('phone', e.target.value)} /><Textarea className="md:col-span-2" label="Billing address" rows={2} value={form.client.address} onChange={(e) => setClient('address', e.target.value)} /></div></Card>
        <Card><div className="text-eyebrow mb-5">02 / Project</div><div className="space-y-4"><Input label="Project title" required value={form.projectTitle} onChange={(e) => setForm({ ...form, projectTitle: e.target.value })} /><Textarea label="Project overview" required rows={5} value={form.projectSummary} onChange={(e) => setForm({ ...form, projectSummary: e.target.value })} /></div></Card>
        <Card><div className="flex items-center justify-between mb-5"><div className="text-eyebrow">03 / Pricing</div><Button size="sm" variant="ghost" icon={Plus} onClick={addItem}>Add item</Button></div><div className="mb-5 max-w-xs"><Select label="Quotation currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} options={[{ value: 'USD', label: 'USD — US Dollar ($)' }, { value: 'INR', label: 'INR — Indian Rupee (₹)' }]} hint="All line items and totals use this currency" /></div><div className="space-y-4">{form.lineItems.map((item, index) => <div key={index} className="border border-hairline bg-ivory-soft p-4"><div className="grid gap-3 md:grid-cols-[1fr_90px_140px_44px]"><Input label="Service / deliverable" required value={item.title} onChange={(e) => setItem(index, 'title', e.target.value)} /><Input label="Qty" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => setItem(index, 'quantity', e.target.value)} /><Input label="Unit price" type="number" min="0" step="0.01" prefix={form.currency === 'INR' ? '₹' : '$'} value={item.unitPrice} onChange={(e) => setItem(index, 'unitPrice', e.target.value)} /><button type="button" aria-label="Remove item" className="mt-7 h-10 border border-hairline text-slate hover:text-danger hover:border-danger" disabled={form.lineItems.length === 1} onClick={() => removeItem(index)}><Trash2 size={15} className="mx-auto" /></button></div><Textarea className="mt-3" label="Description" rows={2} value={item.description} onChange={(e) => setItem(index, 'description', e.target.value)} /></div>)}</div><div className="grid gap-4 md:grid-cols-2 mt-5"><Input label="Discount" type="number" min="0" step="0.01" prefix={form.currency === 'INR' ? '₹' : '$'} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /><Input label="Tax rate" type="number" min="0" max="100" step="0.01" suffix="%" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} /></div></Card>
        <Card><div className="flex items-center justify-between mb-5"><div><div className="text-eyebrow">04 / Service scope & terms</div><p className="text-xs text-slate mt-2">Create a separate titled section for every service included in this quotation.</p></div><Button size="sm" variant="ghost" icon={Plus} onClick={addServiceSection}>Add service</Button></div><div className="space-y-5">{form.serviceSections.map((section, index) => <div key={index} className="border border-hairline bg-ivory-soft p-4"><div className="flex items-end gap-3"><Input className="flex-1" label={`Service ${index + 1} title`} placeholder="e.g. Web Development, SEO, or Social Media Marketing" value={section.title} onChange={(e) => setServiceSection(index, 'title', e.target.value)} /><button type="button" aria-label={`Remove service ${index + 1}`} className="h-10 w-11 border border-hairline text-slate hover:text-danger hover:border-danger" onClick={() => removeServiceSection(index)}><Trash2 size={15} className="mx-auto" /></button></div><div className="grid gap-4 mt-4 lg:grid-cols-2"><Textarea label="Scope of work" hint="Enter one point per line" rows={6} value={section.scopeText} onChange={(e) => setServiceSection(index, 'scopeText', e.target.value)} /><Textarea label="Deliverables" hint="Enter one point per line" rows={6} value={section.deliverablesText} onChange={(e) => setServiceSection(index, 'deliverablesText', e.target.value)} /></div></div>)}<div className="pt-2 border-t border-hairline space-y-4"><Textarea label="Timeline" rows={3} value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} /><Textarea label="Payment terms" rows={4} value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} /><Textarea label="Terms & conditions" rows={5} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /><Textarea label="Additional notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div></div></Card>
      </div>
      <aside className="space-y-6"><Card><div className="text-eyebrow mb-4">Quotation settings</div><div className="space-y-4"><Input label="Valid until" type="date" required value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /><Select label="Authorized signatory" value={form.signatoryId} onChange={(e) => setForm({ ...form, signatoryId: e.target.value })} options={[{ value: '', label: 'Default signatory' }, ...signatories.map((item) => ({ value: item._id, label: `${item.name}${item.title ? ` — ${item.title}` : ''}` }))]} hint="CEO signature is taken from Settings → Documents" />{quotation && <div className="pt-3 border-t border-hairline"><Badge tone={statusTone(quotation.status)}>{humanize(quotation.status)}</Badge>{quotation.lastSentAt && <p className="text-xs text-slate mt-2">Last sent {formatDate(quotation.lastSentAt, 'datetime')}</p>}</div>}</div></Card><Card><div className="text-eyebrow mb-4">Investment summary · {form.currency}</div><div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate">Subtotal</span><span>{formatMoney(totals.subtotal, { currency: form.currency, decimals: 2 })}</span></div>{totals.discount > 0 && <div className="flex justify-between"><span className="text-slate">Discount</span><span>−{formatMoney(totals.discount, { currency: form.currency, decimals: 2 })}</span></div>}{totals.tax > 0 && <div className="flex justify-between"><span className="text-slate">Tax</span><span>{formatMoney(totals.tax, { currency: form.currency, decimals: 2 })}</span></div>}<div className="flex justify-between border-t border-hairline pt-3 mt-3 text-base font-medium"><span>Total</span><span>{formatMoney(totals.total, { currency: form.currency, decimals: 2 })}</span></div></div><p className="text-xs text-slate mt-4">Final amounts are recalculated by the server before saving and emailing.</p></Card></aside>
    </div>

    <Modal open={sendOpen} onClose={() => { if (!sendQuotation.isPending) setSendOpen(false); }} title="Send quotation" description="Brevo will send the message from the configured company sender with the latest quotation PDF attached automatically." footer={<><Button variant="ghost" onClick={() => setSendOpen(false)} disabled={sendQuotation.isPending}>Cancel</Button><Button icon={Mail} loading={sendQuotation.isPending} onClick={() => sendQuotation.mutate()}>Send email</Button></>}><div className="space-y-4"><Input label="Recipient email" type="email" required value={email.recipientEmail} onChange={(e) => setEmail({ ...email, recipientEmail: e.target.value })} /><Input label="CC (optional)" type="email" value={email.cc} onChange={(e) => setEmail({ ...email, cc: e.target.value })} /><Input label="Subject" required value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} /><Textarea label="Message" required rows={9} value={email.message} onChange={(e) => setEmail({ ...email, message: e.target.value })} /></div></Modal>
  </>;
}

export default QuotationEditorPage;
