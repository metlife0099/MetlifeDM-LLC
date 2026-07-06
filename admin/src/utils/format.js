import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { clsx } from 'clsx';

/* ————— clsx wrapper (alias for cn) ————— */
export const cn = (...args) => clsx(args);

/* ————— Money ————— */
export const formatMoney = (n, { currency = 'USD', decimals = 0 } = {}) => {
  if (n == null || Number.isNaN(Number(n))) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(n));
};

/* ————— Numbers ————— */
export const formatNumber = (n) =>
  n == null ? '0' : new Intl.NumberFormat('en-US').format(Number(n));

export const formatCompact = (n) => {
  if (n == null) return '0';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(
    Number(n)
  );
};

export const formatPercent = (n, decimals = 0) => {
  if (n == null) return '0%';
  return `${Number(n).toFixed(decimals)}%`;
};

/* ————— Dates ————— */
const asDate = (input) => {
  if (!input) return null;
  const d = typeof input === 'string' ? parseISO(input) : new Date(input);
  return isValid(d) ? d : null;
};

export const formatDate = (input, variant = 'medium') => {
  const d = asDate(input);
  if (!d) return '—';
  const map = {
    short: 'MMM d',
    medium: 'MMM d, yyyy',
    long: 'MMMM d, yyyy',
    datetime: "MMM d, yyyy · h:mm a",
    time: 'h:mm a',
    iso: 'yyyy-MM-dd',
    numeric: 'MM/dd/yy',
  };
  return format(d, map[variant] || map.medium);
};

export const timeAgo = (input) => {
  const d = asDate(input);
  if (!d) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
};

/* ————— Strings ————— */
export const truncate = (s, n = 60) =>
  !s ? '' : s.length > n ? `${s.slice(0, n)}…` : s;

export const slugify = (s = '') =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

export const capitalize = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export const humanize = (s = '') =>
  s
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

/* ————— File size ————— */
export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

/* ————— Status → color tokens ————— */
export const statusTone = (status) => {
  if (!status) return 'default';
  const s = String(status).toLowerCase();
  if (['paid', 'completed', 'approved', 'published', 'resolved', 'active', 'succeeded', 'delivered', 'accepted', 'sent'].includes(s))
    return 'success';
  if (['pending', 'processing', 'in_progress', 'waiting_customer', 'draft', 'reviewing', 'scheduled', 'in_review', 'sending', 'partial'].includes(s))
    return 'warn';
  if (['cancelled', 'refunded', 'rejected', 'failed', 'suspended', 'expired', 'closed', 'archived', 'spam'].includes(s))
    return 'danger';
  if (['new', 'open', 'unread', 'submitted', 'confirmed'].includes(s)) return 'info';
  return 'default';
};

export const noop = () => {};

/**
 * Trigger a browser download for a Blob response (e.g. axios responseType:'blob').
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
