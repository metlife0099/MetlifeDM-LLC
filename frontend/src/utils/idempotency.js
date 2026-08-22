import { getBrowserStorage } from './storage.js';

const CHECKOUT_KEY = 'mdm_checkout_idempotency';
const CHECKOUT_ORDER_KEY = 'mdm_checkout_order';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let inMemoryKey = null;

const createUuid = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Secure checkout is unavailable in this browser context. Please use a current browser over HTTPS.');
  }
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const getOrCreateCheckoutIdempotencyKey = () => {
  const storage = getBrowserStorage('session');
  const existing = storage?.getItem(CHECKOUT_KEY);
  if (existing && UUID_PATTERN.test(existing)) {
    inMemoryKey = existing;
    return existing;
  }
  if (inMemoryKey) return inMemoryKey;
  const key = createUuid();
  inMemoryKey = key;
  storage?.setItem(CHECKOUT_KEY, key);
  return key;
};

export const rememberCheckoutOrder = (orderId) => {
  if (!orderId) return;
  getBrowserStorage('session')?.setItem(CHECKOUT_ORDER_KEY, String(orderId));
};

export const getCheckoutAttempt = () => {
  const storage = getBrowserStorage('session');
  const idempotencyKey = storage?.getItem(CHECKOUT_KEY) || inMemoryKey;
  const orderId = storage?.getItem(CHECKOUT_ORDER_KEY) || null;
  return {
    idempotencyKey: idempotencyKey && UUID_PATTERN.test(idempotencyKey) ? idempotencyKey : null,
    orderId,
  };
};

export const clearCheckoutIdempotencyKey = (orderId) => {
  const storage = getBrowserStorage('session');
  const storedOrderId = storage?.getItem(CHECKOUT_ORDER_KEY);
  if (orderId && storedOrderId !== String(orderId)) return;
  inMemoryKey = null;
  storage?.removeItem(CHECKOUT_KEY);
  storage?.removeItem(CHECKOUT_ORDER_KEY);
};
