export const PAID_LIKE_ORDER_STATUSES = new Set(['paid', 'in_progress', 'completed']);
export const RETRYABLE_PAYMENT_STATUSES = new Set(['pending', 'failed']);
export const TERMINAL_ORDER_STATUSES = new Set([
  ...PAID_LIKE_ORDER_STATUSES,
  'cancelled',
  'failed',
  'refunded',
]);

export const isPaidLikeOrderStatus = (status) => PAID_LIKE_ORDER_STATUSES.has(status);

export const isRetryablePaymentStatus = (status) => RETRYABLE_PAYMENT_STATUSES.has(status);

export const shouldPollOrderStatus = (status, elapsedMs, timeoutMs = 90_000) => (
  !TERMINAL_ORDER_STATUSES.has(status) && elapsedMs <= timeoutMs
);
