import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, ArrowLeft, RefreshCcw, User, Download, CreditCard, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader, NewBadge } from '@/components/ui/index.jsx';
import { ConfirmDialog, Modal } from '@/components/ui/Modal.jsx';
import { Select, SearchInput, Textarea, Input } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { ordersApi, paymentsApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatMoney, formatDate, timeAgo, downloadBlob } from '@/utils/format.js';
import { ORDER_STATUSES } from '@/utils/constants.js';
import {
  createIdempotencyKey,
  getManualOrderTransitions,
  getRefundSummary,
} from '@/utils/commerce.js';

/* ============================================================
 * ORDERS LIST
 * ============================================================ */
export function OrdersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState({ key: 'createdAt', direction: 'desc' });
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', { page, debounced, status, sort }],
    queryFn: () => ordersApi.list({ page, search: debounced, status, limit: 25, sortBy: sort.key, sortOrder: sort.direction }),
  });

  const columns = [
    {
      key: 'orderNumber', label: 'Order', sortable: true,
      render: (r) => (
        <Link to={`/commerce/orders/${r._id}`} className="text-mono text-sm num-plate text-ink hover:text-ultra">
          #{r.orderNumber || r._id?.slice(-8).toUpperCase()}
        </Link>
      ),
    },
    {
      key: 'customer', label: 'Customer',
      render: (r) => (
        <div>
          <div className="text-sm">{r.customer?.firstName ? `${r.customer.firstName} ${r.customer.lastName || ''}` : r.customerEmail || '—'}</div>
          <div className="text-mono text-xs text-slate mt-0.5">{r.customer?.email || r.customerEmail}</div>
        </div>
      ),
    },
    { key: 'items', label: 'Items', align: 'right', render: (r) => <span className="text-mono text-xs">{r.items?.length || 0}</span> },
    { key: 'total', label: 'Total', sortable: true, align: 'right', render: (r) => <span className="text-mono text-sm num-plate">{formatMoney(r.total)}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
    { key: 'createdAt', label: 'Placed', sortable: true, render: (r) => <span className="text-mono text-xs text-slate">{timeAgo(r.createdAt)}</span> },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Commerce / Orders"
        title={<>All <span className="text-italic-fraunces text-ultra">orders</span></>}
        subtitle="Everything that came through checkout."
        actions={<NewBadge resourceType="order" />}
      />
      <FilterBar>
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search by order number…" className="w-72" />
        <Select className="w-40" options={[{ value: '', label: 'All statuses' }, ...ORDER_STATUSES]} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
      </FilterBar>
      <DataTable
        columns={columns} rows={data?.data || []} loading={isLoading}
        meta={data?.meta} onPageChange={setPage}
        sort={sort} onSortChange={setSort}
        onRowClick={(row) => { window.location.assign(`/commerce/orders/${row._id}`); }}
        emptyIcon={ShoppingBag} emptyTitle="No orders yet"
      />
    </>
  );
}

/* ============================================================
 * ORDER DETAILS
 * ============================================================ */
export function OrderDetailsPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundIdempotencyKey, setRefundIdempotencyKey] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [subscriptionAction, setSubscriptionAction] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => ordersApi.get(id),
  });

  const updateStatus = useMutation({
    mutationFn: ({ status }) => ordersApi.updateStatus(id, status, statusNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'order', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      toast.success('Order updated');
      setStatusNote('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const refund = useMutation({
    mutationFn: (payload) => ordersApi.refund(id, payload),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['admin', 'order', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      qc.invalidateQueries({ queryKey: ['admin', 'payments'] });
      const processorReference =
        result?.refund?.id ||
        result?.refund?.stripeRefundId ||
        result?.stripeRefundId ||
        result?.payment?.stripeRefundId;
      if (processorReference) {
        toast.success(`Refund confirmed · ${processorReference}`);
      } else {
        toast('Refund request accepted, but no processor reference was returned. Verify it before notifying the customer.', { icon: '⚠️' });
      }
      setRefundOpen(false);
      setRefundIdempotencyKey('');
      setRefundAmount('');
      setRefundReason('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const manageSubscription = useMutation({
    mutationFn: (action) => ordersApi.manageSubscription(
      id,
      action === 'resume'
        ? { action: 'resume' }
        : { action: 'cancel', atPeriodEnd: action === 'period_end' }
    ),
    onSuccess: (_, action) => {
      qc.invalidateQueries({ queryKey: ['admin', 'order', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] });
      if (action === 'resume') toast.success('Stripe subscription resumed');
      else if (action === 'period_end') toast.success('Stripe cancellation scheduled for period end');
      else toast.success('Stripe subscription cancelled immediately');
      setSubscriptionAction(null);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const downloadInvoice = async () => {
    if (!order.payment?._id) return;
    setDownloadingInvoice(true);
    try {
      const res = await paymentsApi.downloadInvoice(order.payment._id);
      downloadBlob(res.data, `invoice-${order.payment.invoiceNumber}.pdf`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (isLoading) return <PageLoader label="Loading order" />;
  if (!order) return null;

  const { refundableAmount } = getRefundSummary(order);
  const requestedRefundAmount = refundAmount === '' ? refundableAmount : Number(refundAmount);
  const refundAmountValid = Number.isFinite(requestedRefundAmount)
    && requestedRefundAmount > 0
    && requestedRefundAmount <= refundableAmount;
  const refundReasonValid = refundReason.trim().length >= 3;
  const canRefund = ['succeeded', 'partially_refunded'].includes(order.payment?.status)
    && !['cancelled', 'refunded'].includes(order.status)
    && refundableAmount > 0;
  const allowedStatusValues = getManualOrderTransitions(order.status);
  const statusOptions = [
    {
      value: order.status,
      label: `${ORDER_STATUSES.find(({ value }) => value === order.status)?.label || order.status} (current)`,
      disabled: true,
    },
    ...ORDER_STATUSES.filter(({ value }) => allowedStatusValues.includes(value)),
  ];
  const subscription = order.subscription || (order.stripeSubscriptionId
    ? {
        id: order.stripeSubscriptionId,
        status: order.subscriptionStatus,
        cancelAtPeriodEnd: order.cancelAtPeriodEnd,
        currentPeriodEnd: order.currentPeriodEnd,
      }
    : null);
  const subscriptionManageable = ['active', 'trialing', 'past_due'].includes(subscription?.status);

  const openRefundDialog = () => {
    setRefundAmount('');
    setRefundReason('');
    setRefundIdempotencyKey('');
    setRefundOpen(true);
  };

  const closeRefundDialog = () => {
    if (refund.isPending) return;
    setRefundOpen(false);
    setRefundIdempotencyKey('');
  };

  const submitRefund = () => {
    const idempotencyKey = refundIdempotencyKey || createIdempotencyKey();
    if (!refundIdempotencyKey) setRefundIdempotencyKey(idempotencyKey);
    refund.mutate({
      amount: refundAmount === '' ? undefined : Number(refundAmount),
      reason: refundReason.trim(),
      idempotencyKey,
    });
  };

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Commerce', href: '/commerce/orders' },
        { label: 'Orders', href: '/commerce/orders' },
        { label: `#${order.orderNumber || order._id?.slice(-8).toUpperCase()}` },
      ]} />
      <PageHeader
        eyebrow={`Placed ${formatDate(order.createdAt, 'datetime')}`}
        title={<>Order <span className="text-italic-fraunces text-ultra">#{order.orderNumber || order._id?.slice(-8).toUpperCase()}</span></>}
        subtitle={<>Total <span className="num-plate text-ink">{formatMoney(order.total)}</span> · <StatusPill status={order.status} /></>}
        actions={
          <>
            <Button variant="ghost" to="/commerce/orders" icon={ArrowLeft}>Back</Button>
            {canRefund && (
              <Button variant="danger_ghost" icon={RefreshCcw} onClick={openRefundDialog}>Refund</Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Items */}
          <Card padding={false} className="p-6">
            <div className="text-eyebrow mb-4">Items ({order.items?.length || 0})</div>
            <ul className="divide-editorial">
              {(order.items || []).map((item, i) => (
                <li key={i} className="py-4 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <div className="text-sm">{item.serviceName || item.service?.title || 'Item'}</div>
                    {item.planName && <div className="text-mono text-xs text-slate mt-0.5">{item.planName}</div>}
                  </div>
                  <div className="text-mono text-xs text-slate">
                    Qty {item.quantity || 1}
                  </div>
                  <div className="text-mono text-sm num-plate text-right w-24">
                    {formatMoney(item.subtotal ?? item.unitPrice * (item.quantity || 1))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-hairline mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate">Subtotal</span><span className="num-plate">{formatMoney(order.subtotal)}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-slate">Discount</span><span className="num-plate text-success">−{formatMoney(order.discount)}</span></div>}
              {order.tax > 0 && <div className="flex justify-between"><span className="text-slate">Tax</span><span className="num-plate">{formatMoney(order.tax)}</span></div>}
              <div className="flex justify-between pt-2 border-t border-hairline text-display-sm">
                <span>Total</span><span className="num-plate">{formatMoney(order.total)}</span>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          {order.statusHistory?.length > 0 && (
            <Card padding={false} className="p-6">
              <div className="text-eyebrow mb-4">Timeline</div>
              <ul className="divide-editorial">
                {order.statusHistory.map((t, i) => (
                  <li key={i} className="py-3 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-ultra mt-2 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm capitalize">{t.status}</div>
                      {t.note && <div className="text-slate text-xs mt-0.5">{t.note}</div>}
                      <div className="text-mono text-xs text-slate uppercase tracking-widest mt-1">
                        {timeAgo(t.at)}
                      </div>
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
            <div className="text-eyebrow mb-3">Customer</div>
            <div className="text-sm">
              {order.customerName || (order.customer?.firstName ? `${order.customer.firstName} ${order.customer.lastName || ''}` : order.customerEmail || '—')}
            </div>
            <div className="text-mono text-xs text-slate mt-1">{order.customerEmail || order.customer?.email}</div>
            {order.customerPhone && <div className="text-mono text-xs text-slate mt-1">{order.customerPhone}</div>}
            {order.customerWebsite && (
              <a href={order.customerWebsite} target="_blank" rel="noopener noreferrer" className="text-mono text-xs text-slate hover:text-ultra mt-1 block truncate">
                {order.customerWebsite}
              </a>
            )}
            {order.customer?._id && (
              <Link
                to={`/users/${order.customer._id}`}
                className="mt-3 inline-flex items-center gap-1 text-mono text-xs uppercase tracking-widest text-slate hover:text-ink"
              >
                <User size={11} strokeWidth={1.5} /> View profile
              </Link>
            )}
          </Card>

          {order.billingAddress?.line1 && (
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Billing address</div>
              <div className="text-sm">
                {order.billingAddress.line1}{order.billingAddress.line2 ? `, ${order.billingAddress.line2}` : ''}<br />
                {[order.billingAddress.city, order.billingAddress.state, order.billingAddress.zip].filter(Boolean).join(', ')}
                {order.billingAddress.country ? ` · ${order.billingAddress.country}` : ''}
              </div>
            </Card>
          )}

          {order.notes && (
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Customer notes</div>
              <div className="text-sm text-slate">{order.notes}</div>
            </Card>
          )}

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Payment</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate">Method</span>
                <span className="capitalize">{order.payment?.method || 'Card'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Payment status</span>
                <StatusPill status={order.payment?.status || order.status} />
              </div>
              {order.payment?.amount != null && (
                <div className="flex justify-between">
                  <span className="text-slate">Amount</span>
                  <span className="num-plate">{formatMoney(order.payment.amount)}</span>
                </div>
              )}
              {order.payment?.card?.brand && (
                <div className="flex justify-between">
                  <span className="text-slate">Card</span>
                  <span className="uppercase inline-flex items-center gap-1.5">
                    <CreditCard size={12} strokeWidth={1.5} />
                    {order.payment.card.brand} •••• {order.payment.card.last4}
                  </span>
                </div>
              )}
              {order.payment?.paidAt && (
                <div className="flex justify-between">
                  <span className="text-slate">Paid</span>
                  <span className="text-mono text-xs">{formatDate(order.payment.paidAt, 'short')}</span>
                </div>
              )}
              {order.payment?.invoiceNumber && (
                <div className="flex justify-between">
                  <span className="text-slate">Invoice #</span>
                  <span className="text-mono text-xs">{order.payment.invoiceNumber}</span>
                </div>
              )}
              {order.stripePaymentIntentId && (
                <div className="pt-2 border-t border-hairline">
                  <div className="text-mono text-xs text-slate uppercase tracking-widest mb-1">Stripe intent</div>
                  <div className="text-mono text-xs truncate">{order.stripePaymentIntentId}</div>
                </div>
              )}
              {order.payment?._id && (
                <button
                  type="button"
                  onClick={downloadInvoice}
                  disabled={downloadingInvoice}
                  className="w-full flex items-center justify-center gap-2 mt-2 pt-2 border-t border-hairline text-mono text-xs uppercase tracking-widest text-ultra hover:text-ink disabled:opacity-50"
                >
                  <FileText size={12} strokeWidth={1.5} /> {downloadingInvoice ? 'Preparing…' : 'Download invoice PDF'}
                </button>
              )}
              {order.payment?.stripeReceiptUrl && (
                <a
                  href={order.payment.stripeReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 pt-2 text-mono text-xs uppercase tracking-widest text-slate hover:text-ink"
                >
                  <Download size={12} strokeWidth={1.5} /> View Stripe receipt
                </a>
              )}
            </div>
          </Card>

          {subscription && (
            <Card padding={false} className="p-5">
              <div className="text-eyebrow mb-3">Stripe subscription</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate">Status</span>
                  <StatusPill status={subscription.status || 'unknown'} />
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate">Cancellation</span>
                  <span>{subscription.cancelAtPeriodEnd ? 'Scheduled for period end' : 'Not scheduled'}</span>
                </div>
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate">Current period ends</span>
                    <span className="text-mono text-xs">{formatDate(subscription.currentPeriodEnd, 'medium')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-hairline">
                  <div className="text-mono text-xs text-slate uppercase tracking-widest mb-1">Stripe subscription ID</div>
                  <div className="text-mono text-xs break-all">{subscription.id}</div>
                </div>
              </div>
              {subscriptionManageable && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {subscription.cancelAtPeriodEnd ? (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setSubscriptionAction('resume')}>
                      Resume renewal
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setSubscriptionAction('period_end')}>
                      Cancel at period end
                    </Button>
                  )}
                  <Button type="button" size="sm" variant="danger_ghost" onClick={() => setSubscriptionAction('immediate')}>
                    Cancel immediately
                  </Button>
                </div>
              )}
            </Card>
          )}

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Update status</div>
            {allowedStatusValues.length > 0 ? (
              <div className="space-y-3">
                <Select
                  options={statusOptions}
                  value={order.status}
                  onChange={(e) => {
                    if (e.target.value !== order.status) {
                      updateStatus.mutate({ status: e.target.value });
                    }
                  }}
                  disabled={updateStatus.isPending}
                />
                <Textarea
                  label="Note (optional)"
                  rows={2}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add a note for the timeline"
                />
                <p className="text-mono text-xs text-slate">
                  Payment and refund states are changed only by their provider-backed workflows.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate">
                No manual transition is available from this state.
              </p>
            )}
          </Card>
        </aside>
      </div>

      <Modal
        open={refundOpen}
        onClose={closeRefundDialog}
        title="Issue a refund"
        description={`Request a processor refund up to ${formatMoney(refundableAmount)}. Confirmation must include a processor reference.`}
        footer={
          <>
            <Button variant="ghost" onClick={closeRefundDialog} disabled={refund.isPending}>Cancel</Button>
            <Button variant="danger" onClick={submitRefund} loading={refund.isPending} disabled={!refundAmountValid || !refundReasonValid}>Request refund</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Amount"
            prefix="$"
            type="number"
            min="0.01"
            max={refundableAmount}
            step="0.01"
            placeholder={`Full: ${formatMoney(refundableAmount)}`}
            value={refundAmount}
            disabled={!!refundIdempotencyKey}
            onChange={(e) => setRefundAmount(e.target.value)}
            error={refundAmount !== '' && !refundAmountValid ? `Enter an amount up to ${formatMoney(refundableAmount)}` : undefined}
            hint="Leave blank to request the full refundable amount"
          />
          <Textarea
            label="Reason"
            required
            rows={2}
            value={refundReason}
            disabled={!!refundIdempotencyKey}
            onChange={(e) => setRefundReason(e.target.value)}
            error={refundReason !== '' && !refundReasonValid ? 'Enter at least three characters' : undefined}
            hint="Required for the order audit trail and processor record"
          />
          {refundIdempotencyKey && !refund.isPending && (
            <p className="text-mono text-xs text-slate">
              Retry uses the same request key. Cancel and reopen to change the refund details.
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!subscriptionAction}
        onClose={() => {
          if (!manageSubscription.isPending) setSubscriptionAction(null);
        }}
        onConfirm={() => manageSubscription.mutate(subscriptionAction)}
        loading={manageSubscription.isPending}
        title={
          subscriptionAction === 'immediate'
            ? 'Cancel Stripe subscription immediately?'
            : subscriptionAction === 'resume'
              ? 'Resume Stripe subscription renewal?'
              : 'Schedule Stripe cancellation?'
        }
        description={
          subscriptionAction === 'immediate'
            ? 'This terminates recurring billing in Stripe immediately and does not issue a refund. This cannot be undone.'
            : subscriptionAction === 'resume'
              ? 'This removes the period-end cancellation in Stripe so the subscription can renew.'
              : 'Stripe will keep the subscription active through its current billing period, then cancel it.'
        }
        confirmLabel={
          subscriptionAction === 'immediate'
            ? 'Cancel immediately'
            : subscriptionAction === 'resume'
              ? 'Resume renewal'
              : 'Cancel at period end'
        }
        variant={subscriptionAction === 'immediate' ? 'danger' : 'primary'}
      />
    </>
  );
}
