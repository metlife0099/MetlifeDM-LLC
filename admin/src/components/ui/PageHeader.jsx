import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/utils/format.js';

/* ————— Page header — big editorial title + optional actions ————— */
export function PageHeader({ eyebrow, title, subtitle, actions, tabs, className }) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          {eyebrow && <div className="text-eyebrow mb-3">{eyebrow}</div>}
          <h1 className="text-display-lg">{title}</h1>
          {subtitle && <p className="text-slate text-sm mt-2 max-w-xl leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
      {tabs && <div className="mt-8 border-b border-hairline">{tabs}</div>}
    </div>
  );
}

/* ————— Breadcrumbs ————— */
export function Breadcrumbs({ items = [] }) {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-mono text-xs text-slate mb-6 flex-wrap"
    >
      <Link to="/dashboard" className="hover:text-ink transition-colors">
        <Home size={12} strokeWidth={1.5} />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={12} strokeWidth={1.5} className="opacity-40" />
          {item.href && i < items.length - 1 ? (
            <Link to={item.href} className="hover:text-ink transition-colors uppercase tracking-widest">
              {item.label}
            </Link>
          ) : (
            <span className="uppercase tracking-widest text-ink">{item.label}</span>
          )}
        </span>
      ))}
      {pathname && items.length === 0 && (
        <span className="uppercase tracking-widest text-ink">
          <ChevronRight size={12} strokeWidth={1.5} className="inline opacity-40 mr-1" />
          {pathname.replace(/^\//, '').split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
        </span>
      )}
    </nav>
  );
}

/* ————— Tabs ————— */
export function Tabs({ items = [], active, onChange, className }) {
  return (
    <div className={cn('flex gap-6 -mb-px', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange?.(item.value)}
          className={cn(
            'py-3 text-mono text-xs uppercase tracking-widest border-b-2 transition-colors',
            active === item.value
              ? 'border-ultra text-ink'
              : 'border-transparent text-slate hover:text-ink'
          )}
        >
          {item.label}
          {item.count != null && (
            <span className="ml-2 text-slate">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ————— Filter bar ————— */
export function FilterBar({ children, className }) {
  return (
    <div
      className={cn(
        'bg-surface border border-hairline p-4 mb-4 flex items-center gap-3 flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}
