import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, ArrowLeft, RefreshCcw, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar, Breadcrumbs, Tabs } from '@/components/ui/PageHeader.jsx';
import DataTable from '@/components/ui/DataTable.jsx';
import { StatusPill, Card, PageLoader, Badge } from '@/components/ui/index.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { Select, SearchInput, Textarea, Input } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { ordersApi } from '@/api/index.js';
import { getErrorMessage } from '@/api/client.js';
import { useDebounce } from '@/hooks/index.js';
import { formatMoney, formatDate, timeAgo } from '@/utils/format.js';
import { ORDER_STATUSES } from '@/utils/constants.js';

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
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by order # or email…" className="w-72" />
        <Select className="w-40" options={[{ value: '', label: 'All statuses' }, ...ORDER_STATUSES]} value={status} onChange={(e) => setStatus(e.target.value)} />
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
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [statusNote, setStatusNote] = useState('');

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
    mutationFn: () => ordersApi.refund(id, { amount: Number(refundAmount) || undefined, reason: refundReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'order', id] });
      toast.success('Refund initiated');
      setRefundOpen(false);
      setRefundAmount('');
      setRefundReason('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <PageLoader label="Loading order" />;
  if (!order) return null;

  const canRefund = ['paid', 'completed'].includes(order.status);

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
              <Button variant="danger_ghost" icon={RefreshCcw} onClick={() => setRefundOpen(true)}>Refund</Button>
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
                    <div className="text-sm">{item.name || item.service?.title || 'Item'}</div>
                    {item.plan && <div className="text-mono text-xs text-slate mt-0.5">{item.plan}</div>}
                  </div>
                  <div className="text-mono text-xs text-slate">
                    Qty {item.quantity || 1}
                  </div>
                  <div className="text-mono text-sm num-plate text-right w-24">
                    {formatMoney(item.total || item.price * (item.quantity || 1))}
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
          {order.timeline?.length > 0 && (
            <Card padding={false} className="p-6">
              <div className="text-eyebrow mb-4">Timeline</div>
              <ul className="divide-editorial">
                {order.timeline.map((t, i) => (
                  <li key={i} className="py-3 flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-ultra mt-2 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm">{t.event || t.status}</div>
                      {t.note && <div className="text-slate text-xs mt-0.5">{t.note}</div>}
                      <div className="text-mono text-xs text-slate uppercase tracking-widest mt-1">
                        {timeAgo(t.at || t.createdAt)}
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
              {order.customer?.firstName ? `${order.customer.firstName} ${order.customer.lastName || ''}` : order.customerEmail || '—'}
            </div>
            <div className="text-mono text-xs text-slate mt-1">{order.customer?.email || order.customerEmail}</div>
            {order.customer?._id && (
              <Link
                to={`/users/${order.customer._id}`}
                className="mt-3 inline-flex items-center gap-1 text-mono text-xs uppercase tracking-widest text-slate hover:text-ink"
              >
                <User size={11} strokeWidth={1.5} /> View profile
              </Link>
            )}
          </Card>

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Payment</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate">Method</span>
                <span>{order.paymentMethod || 'Card'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Payment status</span>
                <StatusPill status={order.paymentStatus || order.status} />
              </div>
              {order.stripePaymentIntentId && (
                <div className="pt-2 border-t border-hairline">
                  <div className="text-mono text-xs text-slate uppercase tracking-widest mb-1">Stripe intent</div>
                  <div className="text-mono text-xs truncate">{order.stripePaymentIntentId}</div>
                </div>
              )}
            </div>
          </Card>

          <Card padding={false} className="p-5">
            <div className="text-eyebrow mb-3">Update status</div>
            <div className="space-y-3">
              <Select
                options={ORDER_STATUSES}
                value={order.status}
                onChange={(e) => updateStatus.mutate({ status: e.target.value })}
              />
              <Textarea
                label="Note (optional)"
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Add a note for the timeline"
              />
            </div>
          </Card>
        </aside>
      </div>

      <Modal
        open={refundOpen}
        onClose={() => setRefundOpen(false)}
        title="Issue a refund"
        description={`Refund a portion or all of ${formatMoney(order.total)}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => refund.mutate()} loading={refund.isPending}>Issue refund</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Amount" prefix="$" type="number" placeholder={`Full: ${formatMoney(order.total)}`} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} hint="Leave blank for full refund" />
          <Textarea label="Reason" rows={2} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}
