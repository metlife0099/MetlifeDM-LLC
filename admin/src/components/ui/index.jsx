import { forwardRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { cn, statusTone, humanize } from '@/utils/format.js';
import { notificationsApi } from '@/api/index.js';

/* ————— Card ————— */
export const Card = forwardRef(({ className, children, padding = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-surface border border-hairline',
      padding && 'p-6',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
Card.displayName = 'Card';

/* ————— Badge ————— */
const BADGE_TONES = {
  default: 'bg-sand text-ink border-hairline-strong',
  success: 'bg-success-soft text-success border-success/25',
  warn: 'bg-warn-soft text-warn border-warn/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  info: 'bg-info-soft text-info border-info/25',
  ultra: 'bg-ultra-tint text-ultra border-ultra/25',
  outline: 'bg-transparent text-ink border-hairline-strong',
  ink: 'bg-ink text-ivory border-ink',
};

export const Badge = ({ tone = 'default', className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 text-mono text-[0.65rem] uppercase tracking-widest border',
      BADGE_TONES[tone] || BADGE_TONES.default,
      className
    )}
    {...props}
  >
    {children}
  </span>
);

/* ————— NewBadge — shows when unread notifications exist for a resourceType —————
 * Shares the ['notifications','byType'] cache with the Sidebar (same queryKey),
 * so this never fires an extra request beyond the sidebar's own poll.
 */
export const NewBadge = ({ resourceType, className }) => {
  const { data } = useQuery({
    queryKey: ['notifications', 'byType'],
    queryFn: () => notificationsApi.unreadCountByType(),
    refetchInterval: 60_000,
  });
  // unwrap() flattens { byType: {...} } down to the inner object directly,
  // so `data` here already *is* the counts map (see Sidebar.jsx for detail).
  const count = data?.[resourceType] || 0;
  if (!count) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-mono text-[0.65rem] uppercase tracking-widest border bg-ultra-tint text-ultra border-ultra/25 animate-pulse',
        className
      )}
    >
      <Sparkles size={11} strokeWidth={1.5} />
      {count} new
    </span>
  );
};

/* Auto-tinted status pill */
export const StatusPill = ({ status, className }) => (
  <Badge tone={statusTone(status)} className={className}>
    {humanize(status || 'unknown')}
  </Badge>
);

/* ————— Spinner ————— */
export const Spinner = ({ size = 16, className }) => (
  <svg
    className={cn('animate-spin', className)}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
    <path
      d="M22 12a10 10 0 0 1-10 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

/* ————— Page loader ————— */
export const PageLoader = ({ label = 'Loading' }) => (
  <div className="grid place-items-center min-h-[50vh]">
    <div className="text-center">
      <Spinner size={28} className="text-ultra mx-auto" />
      <div className="text-eyebrow mt-6">{label}</div>
    </div>
  </div>
);

/* ————— Empty state ————— */
export const EmptyState = ({ icon: Icon, title, subtitle, action, className }) => (
  <div className={cn('border border-dashed border-hairline p-12 text-center', className)}>
    {Icon && (
      <div className="w-12 h-12 grid place-items-center bg-ivory-soft mx-auto mb-6">
        <Icon size={20} strokeWidth={1.25} className="text-slate" />
      </div>
    )}
    <div className="text-display-sm mb-2">{title}</div>
    {subtitle && <p className="text-slate max-w-md mx-auto leading-relaxed text-sm">{subtitle}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/* ————— Skeleton ————— */
export const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse bg-hairline', className)} />
);

/* ————— KPI ————— */
export const Kpi = ({ label, value, delta, deltaLabel, icon: Icon, tone = 'default' }) => {
  const deltaColor =
    delta == null
      ? 'text-slate'
      : delta >= 0
        ? 'text-success'
        : 'text-danger';
  return (
    <div className="bg-surface border border-hairline p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-eyebrow">{label}</div>
        {Icon && <Icon size={14} strokeWidth={1.25} className="text-slate" />}
      </div>
      <div className="text-display-lg num-plate leading-none">{value}</div>
      {delta != null && (
        <div className={cn('text-mono text-xs mt-3 flex items-center gap-1', deltaColor)}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
          {deltaLabel && <span className="text-slate ml-1 uppercase tracking-widest">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
};

/* ————— Divider ————— */
export const Divider = ({ className }) => (
  <div className={cn('border-t border-hairline', className)} />
);

/* ————— Section ————— */
export const Section = ({ title, subtitle, actions, children, className }) => (
  <section className={cn('mb-10', className)}>
    {(title || actions) && (
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          {title && <h2 className="text-display-md">{title}</h2>}
          {subtitle && <p className="text-slate text-sm mt-2 max-w-xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);
