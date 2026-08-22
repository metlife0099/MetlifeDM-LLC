import { z } from 'zod';
import { objectId } from './user.validator.js';

const hasAtMostTwoDecimalPlaces = (value) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;

const currencyAmount = z.number().nonnegative().max(999999.99).refine(
  hasAtMostTwoDecimalPlaces,
  'Amount must have at most two decimal places'
);
const positiveCurrencyAmount = z.number().positive().max(999999.99).refine(
  hasAtMostTwoDecimalPlaces,
  'Amount must have at most two decimal places'
);
const nullableAmount = z.preprocess(
  (value) => (value === '' ? null : value),
  positiveCurrencyAmount.nullable().optional()
);
const nullableDate = z.preprocess(
  (value) => (value === '' ? null : value),
  z.coerce.date().nullable().optional()
);
const nullableStripeId = (prefix) => z.preprocess(
  (value) => (value === '' ? null : value),
  z.string().regex(new RegExp(`^${prefix}_[A-Za-z0-9]+$`)).nullable().optional()
);

const couponFields = z.object({
  code: z.string().trim().min(3).max(30).toUpperCase(),
  description: z.string().trim().max(500).optional(),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive().max(999999.99),
  minPurchase: currencyAmount.optional(),
  maxDiscount: nullableAmount,
  usageLimit: z.number().int().positive().nullable().optional(),
  usageLimitPerUser: z.number().int().positive().nullable().optional(),
  applicableServices: z.array(objectId).max(100).optional(),
  applicableCategories: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  firstOrderOnly: z.boolean().optional(),
  newCustomerOnly: z.boolean().optional(),
  startsAt: nullableDate,
  expiresAt: nullableDate,
  isActive: z.boolean().optional(),
  stripeCouponId: nullableStripeId('coupon'),
  stripePromoCodeId: nullableStripeId('promo'),
});

const couponCrossFields = (data, context) => {
  if (data.type === 'percent' && data.value > 100) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'Percent cannot exceed 100' });
  }
  if (data.startsAt && data.expiresAt && data.expiresAt <= data.startsAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['expiresAt'], message: 'Expiry must be after start' });
  }
  if (data.stripeCouponId && data.stripePromoCodeId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stripePromoCodeId'],
      message: 'Configure either a Stripe coupon or promotion code, not both',
    });
  }
};

export const createCouponSchema = couponFields.superRefine(couponCrossFields);
export const updateCouponSchema = couponFields.partial().superRefine(couponCrossFields);

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1).max(30).toUpperCase(),
  items: z.array(z.object({
    service: objectId,
    planId: objectId.optional(),
    quantity: z.number().int().min(1).max(100).default(1),
  })).min(1).max(20),
});
