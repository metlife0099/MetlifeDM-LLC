import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { CreditCard, Tag, Plus, Edit3, Trash2, ExternalLink, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Badge } from '@/components/ui/index.jsx';
import { Modal, ConfirmDialog } from '@/components/ui/Modal.jsx';
import { Input, MultiSelect, Select, Switch, SearchInput, Textarea } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { paymentsApi, couponsApi, servicesApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatMoney, formatDate, timeAgo, downloadBlob } from '@/utils/format.js';
import { SERVICE_CATEGORIES } from '@/utils/constants.js';

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localTime.toISOString().slice(0, 16);
};

const toIsoDate = (value) => (value ? new Date(value).toISOString() : null);

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
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search invoice numbers…" className="w-64" />
        <Select className="w-40" options={[
          { value: '', label: 'All statuses' },
          { value: 'succeeded', label: 'Succeeded' },
          { value: 'pending', label: 'Pending' },
          { value: 'failed', label: 'Failed' },
          { value: 'refunded', label: 'Refunded' },
          { value: 'partially_refunded', label: 'Partially refunded' },
        ]} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
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

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm();
  const couponType = watch('type');

  const { data: serviceOptions = [] } = useQuery({
    queryKey: ['admin', 'services', 'coupon-options'],
    queryFn: () => servicesApi.list({ limit: 200, sortBy: 'title', sortOrder: 'asc' }),
    select: (result) => (result.data || []).map((service) => ({
      value: service._id,
      label: service.title,
    })),
    enabled: editOpen !== null,
  });

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

  const openEdit = (coupon) => {
    const initial = coupon
      ? {
          ...coupon,
          maxDiscount: coupon.maxDiscount ?? '',
          usageLimit: coupon.usageLimit ?? '',
          usageLimitPerUser: coupon.usageLimitPerUser ?? 1,
          startsAt: toDateTimeLocal(coupon.startsAt),
          expiresAt: toDateTimeLocal(coupon.expiresAt),
          applicableServices: (coupon.applicableServices || []).map((service) => service?._id || service),
          applicableCategories: coupon.applicableCategories || [],
        }
      : {
          code: '',
          description: '',
          type: 'percent',
          value: 10,
          minPurchase: 0,
          maxDiscount: '',
          usageLimit: '',
          usageLimitPerUser: 1,
          startsAt: '',
          expiresAt: '',
          applicableServices: [],
          applicableCategories: [],
          firstOrderOnly: false,
          newCustomerOnly: false,
          isActive: true,
        };
    setEditOpen(coupon || {});
    reset(initial);
  };

  const submitCoupon = (values) => {
    const optionalNumber = (value) => value === '' || value == null ? null : Number(value);
    save.mutate({
      ...values,
      code: (values.code || '').trim().toUpperCase(),
      value: Number(values.value),
      minPurchase: Number(values.minPurchase || 0),
      maxDiscount: couponType === 'percent' ? optionalNumber(values.maxDiscount) : null,
      usageLimit: optionalNumber(values.usageLimit),
      usageLimitPerUser: Number(values.usageLimitPerUser || 1),
      startsAt: toIsoDate(values.startsAt),
      expiresAt: toIsoDate(values.expiresAt),
      applicableServices: values.applicableServices || [],
      applicableCategories: values.applicableCategories || [],
    });
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
          <button type="button" onClick={() => openEdit(row)} className="p-1.5 text-slate hover:text-ink" aria-label={`Edit coupon ${row.code}`}><Edit3 size={13} /></button>
          <button type="button" onClick={() => setDeleteId(row._id)} className="p-1.5 text-slate hover:text-danger" aria-label={`Delete coupon ${row.code}`}><Trash2 size={13} /></button>
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
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search codes…" className="w-64" />
        <Select
          className="w-36"
          options={[{ value: '', label: 'All' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
          value={active}
          onChange={(e) => { setActive(e.target.value); setPage(1); }}
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
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setEditOpen(null); reset(); }}>Cancel</Button>
            <Button onClick={handleSubmit(submitCoupon)} loading={save.isPending}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Code"
            required
            placeholder="LAUNCH20"
            {...register('code', { required: 'Enter a coupon code' })}
            error={errors.code?.message}
          />
          <Textarea label="Description" rows={2} {...register('description')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Type" options={[
              { value: 'percent', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed amount' },
            ]} {...register('type')} />
            <Input
              label="Value"
              type="number"
              min="0"
              step="0.01"
              required
              {...register('value', {
                required: 'Enter the discount value',
                min: { value: 0, message: 'Must be zero or greater' },
                validate: (value) => couponType !== 'percent' || Number(value) <= 100 || 'Percentage cannot exceed 100',
              })}
              error={errors.value?.message}
              hint="20 = 20% or $20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Minimum order"
              prefix="$"
              type="number"
              min="0"
              step="0.01"
              {...register('minPurchase', { min: { value: 0, message: 'Must be zero or greater' } })}
              error={errors.minPurchase?.message}
            />
            {couponType === 'percent' && (
              <Input
                label="Maximum discount"
                prefix="$"
                type="number"
                min="0"
                step="0.01"
                placeholder="No cap"
                {...register('maxDiscount', { min: { value: 0, message: 'Must be zero or greater' } })}
                error={errors.maxDiscount?.message}
              />
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Total usage limit"
              type="number"
              min="1"
              step="1"
              placeholder="Unlimited"
              {...register('usageLimit', {
                validate: (value) => value === '' || (Number.isInteger(Number(value)) && Number(value) >= 1) || 'Enter a whole number of at least 1',
              })}
              error={errors.usageLimit?.message}
            />
            <Input
              label="Limit per user"
              type="number"
              min="1"
              step="1"
              required
              {...register('usageLimitPerUser', {
                required: 'Enter a per-user limit',
                validate: (value) => (Number.isInteger(Number(value)) && Number(value) >= 1) || 'Enter a whole number of at least 1',
              })}
              error={errors.usageLimitPerUser?.message}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Starts at" type="datetime-local" {...register('startsAt')} />
            <Input
              label="Expires at"
              type="datetime-local"
              {...register('expiresAt', {
                validate: (value) => !value || !watch('startsAt') || new Date(value) > new Date(watch('startsAt')) || 'Expiry must be after the start time',
              })}
              error={errors.expiresAt?.message}
            />
          </div>
          <Controller
            name="applicableServices"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Applicable services"
                hint="Leave empty to allow every service"
                options={serviceOptions}
                value={field.value || []}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="applicableCategories"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label="Applicable categories"
                hint="Leave empty to allow every category"
                options={SERVICE_CATEGORIES.map(({ value, label }) => ({ value, label }))}
                value={field.value || []}
                onChange={field.onChange}
              />
            )}
          />
          <div className="space-y-3 border-t border-hairline pt-4">
            <Switch label="First order only" description="Reject customers with a prior paid order" {...register('firstOrderOnly')} />
            <Switch label="New customers only" description="Restrict the coupon to new customer accounts" {...register('newCustomerOnly')} />
            <Switch label="Active" {...register('isActive')} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => remove.mutate(deleteId)} loading={remove.isPending} title="Delete this coupon?" confirmLabel="Delete" variant="danger" />
    </>
  );
}
