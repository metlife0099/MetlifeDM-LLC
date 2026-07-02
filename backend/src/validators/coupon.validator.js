import { z } from 'zod';

export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(30).toUpperCase(),
  description: z.string().optional(),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  minPurchase: z.number().nonnegative().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().nullable().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  applicableServices: z.array(z.string()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  firstOrderOnly: z.boolean().optional(),
  newCustomerOnly: z.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1).toUpperCase(),
  subtotal: z.number().nonnegative(),
});
