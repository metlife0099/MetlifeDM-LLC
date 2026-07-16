import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { CreditCard, Tag, Plus, Edit3, Trash2, ExternalLink, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Badge } from '@/components/ui/index.jsx';
import { Modal, ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Input, Select, Switch, SearchInput } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { paymentsApi, couponsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatMoney, formatDate, timeAgo, downloadBlob } from '@/utils/format.js';

/* ============================================================
 * PAYMENTS
 * ============================================================ */
export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments', { page, debounced, status }],
    queryFn: () => paymentsApi.list({ page, search: debounced, status, limit: 25 }),
  });

  const downloadInvoice = async (payment) => {
    setDownloadingId(payment._id);
    try {
      const res = await paymentsApi.downloadInvoice(payment._id);
      downloadBlob(res.data, `invoice-${payment.invoiceNumber}.pdf`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloadingId(null);
    }
  };

  const columns = [
    { key: 'reference', label: 'Invoice', render: (r) => <span className="text-mono text-xs">{r.invoiceNumber || r.stripePaymentIntentId?.slice(-12) || r._id?.slice(-8)}</span> },
    {
      key: 'customer', label: 'Customer',
      render: (r) => (
        <div>
          <div className="text-sm">{r.customer?.email || r.customerEmail || '—'}</div>
          {r.order?.orderNumber && <div className="text-mono text-xs text-slate mt-0.5">Order #{r.order.orderNumber}</div>}
        </div>
      ),
    },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => <span className="text-mono text-sm num-plate">{formatMoney(r.amount)}</span> },
    {
      key: 'card', label: 'Card',
      render: (r) => r.card?.brand ? (
        <span className="text-mono text-xs uppercase inline-flex items-center gap-1.5">
          <CreditCard size={12} strokeWidth={1.5} /> {r.card.brand} •••• {r.card.last4}
        </span>
      ) : <Badge tone="default">{r.method || 'card'}</Badge>,
    },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'createdAt', label: 'Date', render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
    {
      key: 'actions', label: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => downloadInvoice(r)}
            disabled={downloadingId === r._id}
            className="p-1.5 text-slate hover:text-ink disabled:opacity-40"
            aria-label="Download invoice PDF"
            title="Download invoice PDF"
          >
            <FileText size={13} />
          </button>
          {r.stripeReceiptUrl && (
            <a href={r.stripeReceiptUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate hover:text-ink" aria-label="Stripe receipt" title="Stripe receipt">
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Commerce / Payments"
        title={<>All <span className="text-italic-fraunces text-ultra">payments</span></>}
        subtitle="Every transaction processed through Stripe."
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search payments…" className="w-64" />
        <Select className="w-40" options={[
          { value: '', label: 'All statuses' },
          { value: 'succeeded', label: 'Succeeded' },
          { value: 'pending', label: 'Pending' },
          { value: 'failed', label: 'Failed' },
          { value: 'refunded', label: 'Refunded' },
        ]} value={status} onChange={(e) => setStatus(e.target.value)} />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        emptyIcon={CreditCard} emptyTitle="No payments yet"
      />
    </>
  );
}

/* ============================================================
 * COUPONS
 * ============================================================ */
export function CouponsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [editOpen, setEditOpen] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const debounced = useDebounce(search, 300);

  const { register, handleSubmit, reset } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'coupons', { page, debounced, active }],
    queryFn: () => couponsApi.list({ page, search: debounced, active: active || undefined, limit: 25 }),
  });

  const save = useMutation({
    mutationFn: (d) => editOpen?._id ? couponsApi.update(editOpen._id, d) : couponsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success('Coupon saved');
      setEditOpen(null);
      reset();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => couponsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success('Coupon deleted');
      setDeleteId(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const openEdit = (c) => {
    setEditOpen(c || {});
    reset(c || { code: '', type: 'percent', value: 10, isActive: true });
  };

  const columns = [
    { key: 'code', label: 'Code', render: (r) => <span className="text-mono text-sm font-medium">{r.code}</span> },
    {
      key: 'value', label: 'Discount',
      render: (r) => (
        <span className="text-mono text-sm num-plate">
          {r.type === 'percent' ? `${r.value}%` : formatMoney(r.value)}
        </span>
      ),
    },
    { key: 'minPurchase', label: 'Min order', render: (r) => <span className="text-mono text-xs">{r.minPurchase ? formatMoney(r.minPurchase) : '—'}</span> },
    { key: 'usageLimit', label: 'Usage', render: (r) => <span className="text-mono text-xs">{r.usedCount || 0} / {r.usageLimit || '∞'}</span> },
    { key: 'expiresAt', label: 'Expires', render: (r) => <span className="text-mono text-xs text-slate">{r.expiresAt ? formatDate(r.expiresAt, 'medium') : 'Never'}</span> },
    { key: 'status', label: '', render: (r) => <StatusPill status={r.isActive ? 'active' : 'expired'} /> },
    {
      key: 'actions', label: '', align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 text-slate hover:text-ink"><Edit3 size={13} /></button>
          <button onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Commerce / Coupons"
        title={<>Discount <span className="text-italic-fraunces text-ultra">coupons</span></>}
        subtitle="Create promo codes redeemable at checkout."
        actions={<Button onClick={() => openEdit(null)} icon={Plus}>New coupon</Button>}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search codes…" className="w-64" />
        <Select
          className="w-36"
          options={[{ value: '', label: 'All' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
          value={active}
          onChange={(e) => setActive(e.target.value)}
        />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        emptyIcon={Tag} emptyTitle="No coupons yet"
        emptyAction={<Button onClick={() => openEdit(null)} icon={Plus}>New coupon</Button>}
      />

      <Modal
        open={editOpen !== null}
        onClose={() => { setEditOpen(null); reset(); }}
        title={editOpen?._id ? 'Edit coupon' : 'New coupon'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setEditOpen(null); reset(); }}>Cancel</Button>
            <Button onClick={handleSubmit((d) => save.mutate({
              ...d,
              value: Number(d.value),
              minPurchase: d.minPurchase ? Number(d.minPurchase) : undefined,
              usageLimit: d.usageLimit ? Number(d.usageLimit) : undefined,
              code: (d.code || '').toUpperCase(),
            }))} loading={save.isPending}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Code" required placeholder="LAUNCH20" {...register('code')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Type" options={[
              { value: 'percent', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed amount' },
            ]} {...register('type')} />
            <Input label="Value" type="number" required {...register('value')} hint="20 = 20% or $20" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Minimum order" prefix="$" type="number" {...register('minPurchase')} />
            <Input label="Usage limit" type="number" placeholder="Unlimited" {...register('usageLimit')} />
          </div>
          <Input label="Expires at" type="datetime-local" {...register('expiresAt')} />
          <Switch label="Active" {...register('isActive')} />
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this coupon?" confirmLabel="Delete" variant="danger" />
    </>
  );
}
