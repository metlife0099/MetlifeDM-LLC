import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingBag, Receipt, MessageSquare, Bell, ArrowUpRight } from 'lucide-react';
import { commerceApi, ticketApi, notificationApi } from '@/api/index.js';
import { DashHeader } from '@/components/dashboard/DashHeader.jsx';
import { Card, Badge } from '@/components/ui/index.jsx';
import Button from '@/components/ui/Button.jsx';
import Seo from '@/components/seo/Seo.jsx';
import { formatMoney, formatDate, timeAgo } from '@/utils/format.js';

export default function DashboardOverviewPage() {
  const user = useSelector((s) => s.auth.user);

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'mine', 'recent'],
    queryFn: () => commerceApi.listMyOrders({ limit: 5 }),
  });
  const { data: ticketsData } = useQuery({
    queryKey: ['tickets', 'mine', 'recent'],
    queryFn: () => ticketApi.listMine(),
  });
  const { data: notifs } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationApi.list({ limit: 5 }),
  });

  const orders = ordersData?.data || [];
  const tickets = ticketsData?.data || [];
  const notifications = notifs?.data || [];

  const totalSpent = orders
    .filter((o) => ['paid', 'completed'].includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const openTickets = tickets.filter((t) => ['open', 'in_progress', 'waiting_customer'].includes(t.status)).length;

  return (
    <>
      <Seo title="Dashboard" noindex />
      <DashHeader
        eyebrow={`Welcome back / ${formatDate(new Date(), 'medium')}`}
        title={
          <>
            Hi, <span className="text-italic-fraunces text-ultra">{user?.firstName || 'there'}</span>.
          </>
        }
        subtitle="Here's what's happening across your account."
      />

      {/* Stats */}
      <div className="grid gap-px bg-hairline border border-hairline md:grid-cols-4 mb-14">
        {[
          { label: 'Total spend', value: formatMoney(totalSpent), icon: Receipt },
          { label: 'Active orders', value: orders.filter((o) => o.status === 'processing').length, icon: ShoppingBag },
          { label: 'Open tickets', value: openTickets, icon: MessageSquare },
          { label: 'Unread alerts', value: notifications.filter((n) => !n.isRead).length, icon: Bell },
        ].map((s) => (
          <div key={s.label} className="bg-ivory p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-eyebrow">{s.label}</div>
              <s.icon size={14} strokeWidth={1.25} className="text-slate" />
            </div>
            <div className="text-display-md num-plate">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Recent orders */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-display-sm">Recent orders</h2>
            <Link to="/dashboard/orders" className="text-mono text-xs uppercase tracking-widest link-underline text-ink">
              All orders →
            </Link>
          </div>
          {orders.length === 0 ? (
            <Card className="text-center">
              <div className="text-slate text-sm">No orders yet.</div>
              <Button to="/services" size="sm" variant="ghost" className="mt-4">Browse services</Button>
            </Card>
          ) : (
            <div className="divide-editorial border-t border-hairline">
              {orders.slice(0, 5).map((o) => (
                <Link
                  key={o._id}
                  to={`/dashboard/orders/${o._id}`}
                  className="py-4 flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-mono text-xs uppercase tracking-widest text-slate">
                      {o.orderNumber}
                    </div>
                    <div className="text-sm mt-1 truncate group-hover:text-ultra transition-colors">
                      {o.items?.[0]?.serviceName || 'Order'}
                      {o.items?.length > 1 && (
                        <span className="text-slate"> + {o.items.length - 1} more</span>
                      )}
                    </div>
                    <div className="text-mono text-xs text-slate mt-1">{timeAgo(o.createdAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-mono text-sm">{formatMoney(o.total)}</div>
                    <Badge className="mt-2" tone={o.status === 'paid' ? 'success' : 'default'}>
                      {o.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent tickets */}
        <div>
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-display-sm">Recent tickets</h2>
            <Link to="/dashboard/tickets" className="text-mono text-xs uppercase tracking-widest link-underline text-ink">
              All tickets →
            </Link>
          </div>
          {tickets.length === 0 ? (
            <Card className="text-center">
              <div className="text-slate text-sm">No tickets yet.</div>
              <Button to="/dashboard/tickets/new" size="sm" variant="ghost" className="mt-4">Open a ticket</Button>
            </Card>
          ) : (
            <div className="divide-editorial border-t border-hairline">
              {tickets.slice(0, 5).map((t) => (
                <Link
                  key={t._id}
                  to={`/dashboard/tickets/${t._id}`}
                  className="py-4 flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-mono text-xs uppercase tracking-widest text-slate">
                      {t.ticketNumber}
                    </div>
                    <div className="text-sm mt-1 truncate group-hover:text-ultra transition-colors">
                      {t.subject}
                    </div>
                    <div className="text-mono text-xs text-slate mt-1">{timeAgo(t.lastActivityAt || t.createdAt)}</div>
                  </div>
                  <Badge tone={t.status === 'resolved' ? 'success' : t.priority === 'high' ? 'ultra' : 'default'}>
                    {t.status?.replace('_', ' ')}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-14 border border-ink p-10 md:p-14">
        <div className="text-eyebrow mb-6">Quick actions</div>
        <div className="grid gap-4 md:grid-cols-3">
          <Button to="/consultation" size="lg" className="w-full justify-between">
            Book a call <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
          <Button to="/services" variant="ghost" size="lg" className="w-full justify-between">
            Browse services <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
          <Button to="/dashboard/tickets/new" variant="ghost" size="lg" className="w-full justify-between">
            Get support <ArrowUpRight size={16} strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </>
  );
}
