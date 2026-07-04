import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, Area, AreaChart,
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Users, MousePointerClick } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader.jsx';
import { Card, Kpi } from '@/components/ui/index.jsx';
import { Select } from '@/components/form/index.jsx';
import { analyticsApi } from '@/api/index.js';
import { formatMoney, formatCompact, formatDate, formatPercent } from '@/utils/format.js';
import { DATE_RANGES } from '@/utils/constants.js';

const CHART_COLORS = ['#1547FF', '#128260', '#C87A1F', '#7D3AC1', '#0A1730', '#B4351B'];

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d');

  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview', range],
    queryFn: () => analyticsApi.overview({ range }),
  });

  const { data: revenue } = useQuery({
    queryKey: ['analytics', 'revenue', range],
    queryFn: () => analyticsApi.revenue({ range }),
  });

  const { data: traffic } = useQuery({
    queryKey: ['analytics', 'traffic', range],
    queryFn: () => analyticsApi.traffic({ range }),
  });

  const { data: conversions } = useQuery({
    queryKey: ['analytics', 'conversions', range],
    queryFn: () => analyticsApi.conversions({ range }),
  });

  const { data: services } = useQuery({
    queryKey: ['analytics', 'services', range],
    queryFn: () => analyticsApi.services({ range }),
  });

  const kpis = overview?.kpis || {};
  const revSeries = revenue?.series || [];
  const trafficSources = traffic?.sources || [];
  const funnel = conversions?.funnel || [];
  const topServices = services?.data || [];

  const tooltipStyle = {
    background: '#0A1730',
    border: 'none',
    borderRadius: 0,
    color: '#F5F1E8',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 12,
  };

  return (
    <>
      <PageHeader
        eyebrow="Insights / Analytics"
        title={<>Business <span className="text-italic-fraunces text-ultra">analytics</span></>}
        subtitle="Revenue, orders, traffic, and conversion — deeper than the dashboard."
        actions={
          <Select options={DATE_RANGES} value={range} onChange={(e) => setRange(e.target.value)} />
        }
      />

      {/* KPI band */}
      <div className="grid gap-px bg-hairline border border-hairline md:grid-cols-4 mb-8">
        <Kpi label="Revenue" value={formatMoney(kpis.revenue?.value)} delta={kpis.revenue?.delta} deltaLabel="vs prev" icon={DollarSign} />
        <Kpi label="Orders" value={formatCompact(kpis.orders?.value || 0)} delta={kpis.orders?.delta} deltaLabel="vs prev" icon={ShoppingBag} />
        <Kpi label="Conversion" value={formatPercent(kpis.conversionRate?.value || 0, 1)} delta={kpis.conversionRate?.delta} deltaLabel="vs prev" icon={MousePointerClick} />
        <Kpi label="Sessions" value={formatCompact(kpis.sessions?.value || 0)} delta={kpis.sessions?.delta} deltaLabel="vs prev" icon={Users} />
      </div>

      {/* Revenue over time */}
      <Card padding={false} className="p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-eyebrow">Revenue over time</div>
            <div className="text-display-md num-plate mt-1">{formatMoney(revenue?.total || 0)}</div>
          </div>
          <div className="text-mono text-xs text-slate uppercase tracking-widest">
            AOV: {formatMoney(revenue?.averageOrderValue || 0)}
          </div>
        </div>
        {revSeries.length === 0 ? (
          <div className="h-64 grid place-items-center text-slate text-sm">
            <div className="text-center">
              <TrendingUp size={24} strokeWidth={1.25} className="mx-auto mb-2 opacity-30" />
              No revenue data for this range
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revSeries} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1547FF" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#1547FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E8E3D2" strokeDasharray="1 3" vertical={false} />
              <XAxis dataKey="date" stroke="#727D96" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatDate(v, 'short')} />
              <YAxis stroke="#727D96" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(v) => formatDate(v, 'medium')}
                formatter={(v) => [formatMoney(v), 'Revenue']}
              />
              <Area type="monotone" dataKey="value" stroke="#1547FF" strokeWidth={2} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        {/* Traffic sources */}
        <Card padding={false} className="p-6">
          <div className="text-eyebrow mb-4">Traffic sources</div>
          {trafficSources.length === 0 ? (
            <div className="py-12 text-center text-slate text-sm">No traffic data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={trafficSources}
                    dataKey="value"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="#F5F1E8"
                  >
                    {trafficSources.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-4 space-y-2">
                {trafficSources.slice(0, 5).map((s, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span>{s.source}</span>
                    </div>
                    <span className="text-mono num-plate">{formatCompact(s.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* Conversion funnel */}
        <Card padding={false} className="p-6">
          <div className="text-eyebrow mb-4">Conversion funnel</div>
          {funnel.length === 0 ? (
            <div className="py-12 text-center text-slate text-sm">No funnel data yet</div>
          ) : (
            <ul className="space-y-3">
              {funnel.map((step, i) => {
                const pct = i === 0 ? 100 : (step.count / funnel[0].count) * 100;
                return (
                  <li key={step.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2">
                        <span className="num-plate text-slate text-xs">{String(i + 1).padStart(2, '0')}</span>
                        {step.name}
                      </span>
                      <span className="text-mono num-plate">{formatCompact(step.count)} · {formatPercent(pct, 1)}</span>
                    </div>
                    <div className="h-2 bg-ivory-soft border border-hairline">
                      <div className="h-full bg-ultra transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Top services */}
      <Card padding={false} className="p-6">
        <div className="text-eyebrow mb-4">Top-performing services</div>
        {topServices.length === 0 ? (
          <div className="py-12 text-center text-slate text-sm">No service data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topServices.slice(0, 10)}>
              <CartesianGrid stroke="#E8E3D2" strokeDasharray="1 3" vertical={false} />
              <XAxis dataKey="title" stroke="#727D96" fontSize={11} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={70} />
              <YAxis stroke="#727D96" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatCompact} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatMoney(v), 'Revenue']} />
              <Bar dataKey="revenue" fill="#1547FF" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </>
  );
}
