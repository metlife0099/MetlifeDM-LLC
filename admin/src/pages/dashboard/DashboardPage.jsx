import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Mail,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { PageHeader, Tabs } from '@/components/ui/PageHeader.jsx';
import { Card, Kpi, Badge, StatusPill, Spinner, EmptyState } from '@/components/ui/index.jsx';
import { Select } from '@/components/form/index.jsx';
import Button from '@/components/ui/Button.jsx';
import { dashboardApi } from '@/api/index.js';
import {
  formatMoney,
  formatCompact,
  formatDate,
  timeAgo,
  humanize,
} from '@/utils/format.js';
import { DATE_RANGES } from '@/utils/constants.js';
import { useAuth } from '@/hooks/useAuth.js';

/* Colors matching design tokens */
const CHART_COLORS = ['#1547FF', '#128260', '#C87A1F', '#7D3AC1', '#0A1730', '#B4351B'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [range, setRange] = useState('30d');

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['dashboard', 'overview', range],
    queryFn: () => dashboardApi.overview({ range }),
  });

  const { data: revenue } = useQuery({
    queryKey: ['dashboard', 'revenue', range],
    queryFn: () => dashboardApi.revenue({ range }),
  });

  const { data: orderStatuses } = useQuery({
    queryKey: ['dashboard', 'orders-by-status'],
    queryFn: () => dashboardApi.ordersByStatus(),
  });

  const { data: topServices } = useQuery({
    queryKey: ['dashboard', 'top-services', range],
    queryFn: () => dashboardApi.topServices({ range }),
  });

  const { data: activity } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => dashboardApi.recentActivity({ limit: 10 }),
  });

  const kpis = overview?.kpis || {};
  const revenueSeries = revenue?.series || [];
  const statuses = orderStatuses?.series || [];
  const services = topServices?.data || [];
  const activityFeed = activity?.data || [];

  return (
    <>
      <PageHeader
        eyebrow={`Signed in as ${user?.role || 'admin'} · ${formatDate(new Date(), 'medium')}`}
        title={
          <>
            Hi, <span className="text-italic-fraunces text-ultra">{user?.firstName || 'operator'}</span>.
          </>
        }
        subtitle="Everything running across the business, at a glance."
        actions={
          <Select
            options={DATE_RANGES}
            value={range}
            onChange={(e) => setRange(e.target.value)}
          />
        }
      />

      {/* KPI band */}
      <div className="grid gap-px bg-hairline border border-hairline md:grid-cols-4 mb-8">
        <Kpi
          label="Revenue"
          value={loadingOverview ? '—' : formatMoney(kpis.revenue?.value)}
          delta={kpis.revenue?.delta}
          deltaLabel="vs prev"
          icon={DollarSign}
        />
        <Kpi
          label="Orders"
          value={loadingOverview ? '—' : formatCompact(kpis.orders?.value || 0)}
          delta={kpis.orders?.delta}
          deltaLabel="vs prev"
          icon={ShoppingBag}
        />
        <Kpi
          label="New users"
          value={loadingOverview ? '—' : formatCompact(kpis.newUsers?.value || 0)}
          delta={kpis.newUsers?.delta}
          deltaLabel="vs prev"
          icon={Users}
        />
        <Kpi
          label="Leads"
          value={loadingOverview ? '—' : formatCompact(kpis.leads?.value || 0)}
          delta={kpis.leads?.delta}
          deltaLabel="vs prev"
          icon={Mail}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] mb-8">
        {/* Revenue trend */}
        <Card padding={false} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-eyebrow">Revenue</div>
              <div className="text-display-md num-plate mt-1">
                {formatMoney(revenue?.total || 0)}
              </div>
            </div>
            <Badge tone="ultra">{DATE_RANGES.find((r) => r.value === range)?.label}</Badge>
          </div>
          {revenueSeries.length === 0 ? (
            <div className="h-48 grid place-items-center text-slate text-sm">
              <div className="text-center">
                <TrendingUp size={24} strokeWidth={1.25} className="mx-auto mb-2 opacity-30" />
                No revenue data yet
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E8E3D2" strokeDasharray="1 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#727D96"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatDate(v, 'short')}
                />
                <YAxis
                  stroke="#727D96"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCompact(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0A1730',
                    border: 'none',
                    borderRadius: 0,
                    color: '#F5F1E8',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => formatDate(v, 'medium')}
                  formatter={(v) => [formatMoney(v), 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#1547FF"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#1547FF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Orders by status */}
        <Card padding={false} className="p-6">
          <div className="text-eyebrow mb-4">Orders by status</div>
          {statuses.length === 0 ? (
            <div className="h-48 grid place-items-center text-slate text-sm">
              <div className="text-center">
                <ShoppingBag size={24} strokeWidth={1.25} className="mx-auto mb-2 opacity-30" />
                No orders yet
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={statuses} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    stroke="#727D96"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0A1730',
                      border: 'none',
                      color: '#F5F1E8',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#1547FF">
                    {statuses.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between text-mono text-xs">
                <span className="text-slate uppercase tracking-widest">Total</span>
                <span>{statuses.reduce((a, s) => a + (s.count || 0), 0)}</span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Top services + recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding={false} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-eyebrow">Top services</div>
            <Link
              to="/content/services"
              className="text-mono text-xs uppercase tracking-widest link-underline"
            >
              Manage
            </Link>
          </div>
          {services.length === 0 ? (
            <div className="py-8 text-center text-slate text-sm">
              No service data yet.
            </div>
          ) : (
            <ul className="divide-editorial">
              {services.slice(0, 5).map((s, i) => (
                <li key={s._id || i} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="num-plate text-slate text-xs">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm truncate">{s.title || s.name}</span>
                  </div>
                  <div className="text-mono text-xs text-slate uppercase tracking-widest">
                    {s.orders || 0} orders
                  </div>
                  <div className="text-mono text-sm w-20 text-right">
                    {formatMoney(s.revenue)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding={false} className="p-6">
          <div className="text-eyebrow mb-4">Recent activity</div>
          {activityFeed.length === 0 ? (
            <div className="py-8 text-center text-slate text-sm">
              No recent activity.
            </div>
          ) : (
            <ul className="divide-editorial">
              {activityFeed.slice(0, 6).map((a) => (
                <li key={a._id} className="py-3 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-ultra mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm">{a.title || humanize(a.type || '')}</div>
                    {a.description && (
                      <div className="text-slate text-xs mt-0.5 leading-relaxed">{a.description}</div>
                    )}
                    <div className="text-mono text-xs text-slate uppercase tracking-widest mt-1.5">
                      {timeAgo(a.createdAt)}
                    </div>
                  </div>
                  {a.status && <StatusPill status={a.status} />}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-8 bg-ink text-ivory p-8 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="text-eyebrow text-ivory/50 mb-2">Quick actions</div>
          <div className="text-display-md text-ivory">
            Ship <span className="text-italic-fraunces text-ultra-soft">something</span> today.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ultra" to="/content/blog/new" iconRight={ArrowUpRight}>
            New post
          </Button>
          <Button variant="ghost" to="/content/services/new" className="text-ivory border-ivory/30 hover:bg-ivory/5" iconRight={ArrowUpRight}>
            New service
          </Button>
          <Button variant="ghost" to="/careers/jobs/new" className="text-ivory border-ivory/30 hover:bg-ivory/5" iconRight={ArrowUpRight}>
            Post a job
          </Button>
        </div>
      </div>
    </>
  );
}
