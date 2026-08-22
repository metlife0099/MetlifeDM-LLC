const MANUAL_ORDER_TRANSITIONS = Object.freeze({
  pending: ['cancelled'],
  processing: ['cancelled'],
  failed: ['cancelled'],
  paid: ['in_progress'],
  in_progress: ['completed'],
});

export const getManualOrderTransitions = (status) => [
  ...(MANUAL_ORDER_TRANSITIONS[status] || []),
];

export const getRefundSummary = (order = {}) => {
  const alreadyRefunded = Math.max(
    Number(order.refundedAmount || 0),
    Number(order.payment?.amountRefunded || 0)
  );
  const paidAmount = Number(order.payment?.amount ?? order.total ?? 0);
  return {
    alreadyRefunded,
    paidAmount,
    refundableAmount: Math.max(0, paidAmount - alreadyRefunded),
  };
};

export const createIdempotencyKey = () => {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure UUID generation is unavailable in this browser');
  }
  return globalThis.crypto.randomUUID();
};
