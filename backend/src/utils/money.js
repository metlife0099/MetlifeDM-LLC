export const isCurrencyAmount = (value) =>
  Number.isFinite(value) &&
  value >= 0 &&
  Number.isSafeInteger(Math.round(value * 100)) &&
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;

export const toCents = (value, field = 'Amount') => {
  if (!isCurrencyAmount(value)) {
    const error = new TypeError(`${field} must be a non-negative amount with at most two decimal places`);
    error.code = 'INVALID_CURRENCY_AMOUNT';
    throw error;
  }
  return Math.round(value * 100);
};

export const fromCents = (value) => value / 100;
