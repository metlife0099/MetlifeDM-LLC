import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createIdempotencyKey,
  getManualOrderTransitions,
  getRefundSummary,
} from '../src/utils/commerce.js';

test('manual order transitions never expose provider-owned states', () => {
  assert.deepEqual(getManualOrderTransitions('pending'), ['cancelled']);
  assert.deepEqual(getManualOrderTransitions('paid'), ['in_progress']);
  assert.deepEqual(getManualOrderTransitions('in_progress'), ['completed']);
  assert.deepEqual(getManualOrderTransitions('completed'), []);
  assert.deepEqual(getManualOrderTransitions('refunded'), []);
});

test('refundable balance uses the processor payment and highest recorded refund', () => {
  assert.deepEqual(
    getRefundSummary({
      total: 120,
      refundedAmount: 15,
      payment: { amount: 100, amountRefunded: 25 },
    }),
    { alreadyRefunded: 25, paidAmount: 100, refundableAmount: 75 }
  );
});

test('refund request keys are UUIDs and unique per new intent', () => {
  const first = createIdempotencyKey();
  const second = createIdempotencyKey();
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.notEqual(first, second);
});
