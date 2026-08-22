import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, XCircle, Receipt, Download, CreditCard, FileText, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { commerceApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { DashHeader, DashEmpty } from '@/components/dashboard/DashHeader.jsx';
import { QueryError, Spinner, Badge, Card } from '@/components/ui/index.jsx';
import ScrollTabs from '@/components/ui/ScrollTabs.jsx';
import { ConfirmDialog } from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney, formatDate, timeAgo, cn, downloadBlob } from '@/utils/format.js';
import { clearCheckoutIdempotencyKey } from '@/utils/idempotency.js';

const STATUSES = ['all', 'pending', 'processing', 'paid', 'in_progress', 'completed', 'failed', 'cancelled', 'refunded'];

export const OrdersListPage = () => {
  const [status, setStatus] = useState('all');
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', 'mine', status],
    queryFn: () => commerceApi.listMyOrders({ status: status === 'all' ? undefined : status, limit: 30 }),
  });
  const orders = data?.data || [];

  return (
    <>
      <Seo title="Orders" noindex />
      <DashHeader
        eyebrow="Orders"
        title={<>Every <span className="text-italic-fraunces text-ultra">receipt.</span></>}
        subtitle="A running log of everything you've ordered."
      />

      {/* Filter */}
      <ScrollTabs className="mb-8" trackClassName="pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              'px-4 py-2 text-mono text-xs uppercase tracking-widest border transition-colors whitespace-nowrap',
              status === s ? 'bg-ink text-ivory border-ink' : 'border-hairline hover:border-ink'
            )}
          >
            {s}
          </button>
        ))}
      </ScrollTabs>

      {isLoading ? (
        <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>
      ) : isError ? (
        <QueryError title="Orders could not be loaded." onRetry={refetch} />
      ) : orders.length === 0 ? (
        <DashEmpty
          title="No orders yet"
          subtitle="When you purchase a service, it'll appear here with real-time status."
          action={<Button to="/services">Browse services <ArrowUpRight size={14} strokeWidth={1.5} /></Button>}
        />
      ) : (
        <div className="divide-editorial border-t border-hairline">
          {orders.map((o) => (
            <Link
              key={o._id}
              to={`/dashboard/orders/${o._id}`}
              className="py-6 grid gap-6 md:grid-cols-[1fr_auto_auto_auto] md:items-center group"
            >
              <div>
                <div className="text-mono text-xs uppercase tracking-widest text-slate">{o.orderNumber}</div>
                <div className="text-sm mt-1 group-hover:text-ultra transition-colors">
                  {o.items?.[0]?.serviceName}
                  {o.items?.length > 1 && (
                    <span className="text-slate"> + {o.items.length - 1} more</span>
                  )}
                </div>
              </div>
              <div className="text-mono text-xs text-slate uppercase tracking-widest">
                {formatDate(o.createdAt, 'short')}
              </div>
              <div className="text-mono text-sm">{formatMoney(o.total)}</div>
              <div className="flex items-center gap-3">
                <Badge tone={['paid', 'in_progress', 'completed'].includes(o.status) ? 'success' : o.status === 'cancelled' ? 'default' : 'ultra'}>
                  {o.status}
                </Badge>
                <ArrowUpRight size={16} strokeWidth={1.25} className="text-slate group-hover:rotate-45 group-hover:text-ink transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export const OrderDetailsPage = () => {
  const { id } = useParams();
  const qc = useQueryClient();
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [subscriptionAction, setSubscriptionAction] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => commerceApi.getOrder(id),
    enabled: !!id,
  });

  const cancel = useMutation({
    mutationFn: () => commerceApi.cancelOrder(id),
    onSuccess: () => {
      clearCheckoutIdempotencyKey(id);
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const manageSubscription = useMutation({
    mutationFn: (action) => (
      action === 'cancel'
        ? commerceApi.cancelSubscription(id)
        : commerceApi.resumeSubscription(id)
    ),
    onSuccess: (_, action) => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success(action === 'cancel'
        ? 'Subscription cancellation scheduled'
        : 'Subscription resumed');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const downloadInvoice = async (payment) => {
    setDownloadingInvoice(true);
    try {
      const res = await commerceApi.downloadInvoice(payment._id);
      downloadBlob(res.data, `invoice-${payment.invoiceNumber}.pdf`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-24"><Spinner size={28} className="text-ultra" /></div>;
  }
  if (isError) {
    return (
      <>
        <DashHeader title="Order unavailable" />
        <QueryError
          title="This order could not be loaded."
          message="Check your connection and try again. If the problem continues, contact support."
          onRetry={refetch}
          compact
        />
      </>
    );
  }
  if (!data?.order) {
    return (
      <>
        <DashHeader title="Order not found" />
        <Link to="/dashboard/orders" className="link-underline text-ink">← Back to orders</Link>
      </>
    );
  }

  const o = data.order;
  const subscription = o.subscription || (o.stripeSubscriptionId ? {
    id: o.stripeSubscriptionId,
    status: o.subscriptionStatus,
    cancelAtPeriodEnd: o.cancelAtPeriodEnd,
    currentPeriodEnd: o.currentPeriodEnd,
  } : null);
  const subscriptionCanBeManaged = subscription
    && !['canceled', 'incomplete_expired'].includes(subscription.status);

  return (
    <>
      <Seo title={`Order ${o.orderNumber}`} noindex />
      <Link to="/dashboard/orders" className="text-mono text-xs uppercase tracking-widest text-slate hover:text-ink link-underline">
        ← All orders
      </Link>
      <DashHeader
        eyebrow={`Order / ${o.orderNumber}`}
        title={<>Placed <span className="text-italic-fraunces text-ultra">{timeAgo(o.createdAt)}</span></>}
        actions={
          ['pending', 'processing', 'failed'].includes(o.status) && !subscription && (
            <Button
              variant="ghost"
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancel.isPending}
            >
              <XCircle size={14} strokeWidth={1.5} />
              Cancel order
            </Button>
          )
        }
        className="mt-4"
      />

      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        {/* Left: items + timeline */}
        <div className="space-y-10">
          {/* Items */}
          <div>
            <h2 className="text-display-sm mb-6">Items</h2>
            <div className="divide-editorial border-t border-hairline">
              {o.items?.map((item, i) => (
                <div key={i} className="py-6 grid grid-cols-[auto_1fr_auto] gap-6 items-start">
                  <div className="text-3xl">{item.icon || '📦'}</div>
                  <div>
                    <div className="text-mono text-xs uppercase tracking-widest text-slate">{item.planName || 'Service'}</div>
                    <div className="text-sm mt-1">{item.serviceName}</div>
                    <div className="text-mono text-xs text-slate mt-1">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-mono text-sm">{formatMoney(item.subtotal || item.unitPrice * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status history */}
          {o.statusHistory?.length > 0 && (
            <div>
              <h2 className="text-display-sm mb-6">Timeline</h2>
              <ol className="border-t border-hairline">
                {o.statusHistory.map((h, i) => (
                  <li key={i} className="py-4 border-b border-hairline flex items-start justify-between gap-4">
                    <div>
                      <Badge tone={['paid', 'in_progress', 'completed'].includes(h.status) ? 'success' : 'default'}>{h.status}</Badge>
                      {h.note && <p className="text-slate text-sm mt-2">{h.note}</p>}
                    </div>
                    <div className="text-mono text-xs text-slate">{formatDate(h.at || h.timestamp, 'datetime')}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right: summary */}
        <div className="space-y-6">
        <Card>
          <div className="text-eyebrow mb-6">Summary</div>
          <dl className="space-y-3">
            <div className="flex justify-between text-mono text-sm">
              <dt className="text-slate">Subtotal</dt>
              <dd>{formatMoney(o.subtotal)}</dd>
            </div>
            {o.discount > 0 && (
              <div className="flex justify-between text-mono text-sm">
                <dt className="text-slate">Discount</dt>
                <dd className="text-ultra">−{formatMoney(o.discount)}</dd>
              </div>
            )}
            {o.tax > 0 && (
              <div className="flex justify-between text-mono text-sm">
                <dt className="text-slate">Tax</dt>
                <dd>{formatMoney(o.tax)}</dd>
              </div>
            )}
            <div className="border-t border-hairline pt-3 flex justify-between text-mono">
              <dt>Total</dt>
              <dd className="num-plate">{formatMoney(o.total)}</dd>
            </div>
          </dl>
          <div className="mt-8 pt-6 border-t border-hairline space-y-3 text-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate">Status</span>
              <Badge tone={['paid', 'in_progress', 'completed'].includes(o.status) ? 'success' : 'default'}>{o.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate">Placed</span>
              <span>{formatDate(o.createdAt, 'short')}</span>
            </div>
          </div>
          {['pending', 'failed'].includes(o.status) && (
            <Button
              to={`/checkout?order=${o._id}`}
              className="w-full mt-8"
            >
              {o.status === 'failed' ? 'Retry payment' : 'Complete payment'} <Receipt size={14} strokeWidth={1.5} />
            </Button>
          )}
        </Card>

        {subscription && (
          <Card>
            <div className="text-eyebrow mb-6">Subscription</div>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate">Status</dt>
                <dd>
                  <Badge tone={['active', 'trialing'].includes(subscription.status) ? 'success' : 'default'}>
                    {subscription.status || 'unknown'}
                  </Badge>
                </dd>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">
                    {subscription.cancelAtPeriodEnd ? 'Access ends' : 'Current period ends'}
                  </dt>
                  <dd className="text-right">{formatDate(subscription.currentPeriodEnd, 'medium')}</dd>
                </div>
              )}
            </dl>
            {subscription.cancelAtPeriodEnd && (
              <p role="status" className="mt-5 border border-warn/30 bg-warn/5 p-3 text-sm text-slate">
                Cancellation is scheduled for the end of the current billing period. You can resume before that date.
              </p>
            )}
            {subscriptionCanBeManaged && (
              <Button
                type="button"
                variant="ghost"
                className="mt-6 w-full"
                onClick={() => setSubscriptionAction(subscription.cancelAtPeriodEnd ? 'resume' : 'cancel')}
                disabled={manageSubscription.isPending}
              >
                {subscription.cancelAtPeriodEnd ? (
                  <><RotateCcw size={14} strokeWidth={1.5} /> Resume subscription</>
                ) : (
                  <><XCircle size={14} strokeWidth={1.5} /> Cancel at period end</>
                )}
              </Button>
            )}
          </Card>
        )}

        {/* Contact & delivery details */}
        <Card>
          <div className="text-eyebrow mb-6">Contact &amp; delivery</div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate">Name</dt>
              <dd className="text-right">{o.customerName || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate">Email</dt>
              <dd className="text-right break-all">{o.customerEmail || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate">Phone</dt>
              <dd className="text-right">{o.customerPhone || '—'}</dd>
            </div>
            {o.customerWebsite && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate">Website</dt>
                <dd className="text-right truncate">{o.customerWebsite}</dd>
              </div>
            )}
            {o.billingAddress?.line1 && (
              <div className="pt-3 border-t border-hairline">
                <dt className="text-slate mb-1">Address</dt>
                <dd>
                  {o.billingAddress.line1}{o.billingAddress.line2 ? `, ${o.billingAddress.line2}` : ''}<br />
                  {[o.billingAddress.city, o.billingAddress.state, o.billingAddress.zip].filter(Boolean).join(', ')}
                  {o.billingAddress.country ? ` · ${o.billingAddress.country}` : ''}
                </dd>
              </div>
            )}
            {o.notes && (
              <div className="pt-3 border-t border-hairline">
                <dt className="text-slate mb-1">Notes</dt>
                <dd className="text-slate">{o.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Stripe payment details */}
        {o.payment && (
          <Card>
            <div className="text-eyebrow mb-6">Payment</div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate">Status</dt>
                <dd><Badge tone={o.payment.status === 'succeeded' ? 'success' : 'default'}>{o.payment.status}</Badge></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate">Amount paid</dt>
                <dd className="text-mono">{formatMoney(o.payment.amount)}</dd>
              </div>
              {o.payment.card?.brand && (
                <div className="flex justify-between">
                  <dt className="text-slate">Card</dt>
                  <dd className="text-mono uppercase">
                    <CreditCard size={12} strokeWidth={1.5} className="inline mr-1.5 -mt-0.5" />
                    {o.payment.card.brand} •••• {o.payment.card.last4}
                  </dd>
                </div>
              )}
              {o.payment.paidAt && (
                <div className="flex justify-between">
                  <dt className="text-slate">Paid</dt>
                  <dd className="text-mono text-xs">{formatDate(o.payment.paidAt, 'short')}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-slate">Invoice #</dt>
                <dd className="text-mono text-xs">{o.payment.invoiceNumber}</dd>
              </div>
              <button
                type="button"
                onClick={() => downloadInvoice(o.payment)}
                disabled={downloadingInvoice}
                className="w-full flex items-center justify-center gap-2 mt-2 pt-3 border-t border-hairline text-mono text-xs uppercase tracking-widest text-ultra hover:text-ink disabled:opacity-50"
              >
                <FileText size={12} strokeWidth={1.5} /> {downloadingInvoice ? 'Preparing…' : 'Download invoice PDF'}
              </button>
              {o.payment.stripeReceiptUrl && (
                <a
                  href={o.payment.stripeReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 pt-2 text-mono text-xs uppercase tracking-widest text-slate hover:text-ink"
                >
                  <Download size={12} strokeWidth={1.5} /> View Stripe receipt
                </a>
              )}
            </dl>
          </Card>
        )}
        </div>
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          cancel.mutate();
          setShowCancelConfirm(false);
        }}
        title="Cancel this order?"
        description="We'll stop processing this order. If you've already been charged, refunds are handled per our refund policy."
        confirmLabel="Cancel order"
        variant="ultra"
      />
      <ConfirmDialog
        open={Boolean(subscriptionAction)}
        onClose={() => setSubscriptionAction(null)}
        onConfirm={() => {
          manageSubscription.mutate(subscriptionAction);
          setSubscriptionAction(null);
        }}
        title={subscriptionAction === 'resume' ? 'Resume this subscription?' : 'Schedule cancellation?'}
        description={subscriptionAction === 'resume'
          ? 'Recurring billing will continue under the existing subscription schedule.'
          : `Your subscription will remain active through ${subscription?.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd, 'medium') : 'the end of the current billing period'} and will not renew after that.`}
        confirmLabel={subscriptionAction === 'resume' ? 'Resume subscription' : 'Cancel at period end'}
        variant="ultra"
      />
    </>
  );
};

export default OrdersListPage;
