import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely.
 */
export const cn = (...args) => twMerge(clsx(args));

/**
 * Format USD amounts.
 */
export const formatMoney = (amount, currency = 'USD', opts = {}) => {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: opts.decimals ?? (amount % 1 === 0 ? 0 : 2),
    maximumFractionDigits: opts.decimals ?? 2,
  }).format(amount);
};

export const formatNumber = (n) => new Intl.NumberFormat('en-US').format(n);
export const formatCompact = (n) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/**
 * Format dates.
 */
export const formatDate = (date, style = 'medium') => {
  if (!date) return '';
  const d = new Date(date);
  const styles = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    medium: { month: 'long', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    time: { hour: 'numeric', minute: '2-digit' },
    datetime: { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  };
  return new Intl.DateTimeFormat('en-US', styles[style]).format(d);
};

/**
 * Relative time (e.g., "2 hours ago").
 */
export const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
};

/**
 * Truncate text.
 */
export const truncate = (str, n = 100) => {
  if (!str) return '';
  return str.length > n ? `${str.slice(0, n).trim()}…` : str;
};

/**
 * URL slugify.
 */
export const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

/**
 * Get initials from a name.
 */
export const initials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
};

/**
 * Simple noop for optional callbacks.
 */
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
