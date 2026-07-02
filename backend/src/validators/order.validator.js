import { z } from 'zod';
import { objectId } from './user.validator.js';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        service: objectId,
        planId: objectId.optional(),
        quantity: z.number().int().positive().default(1),
      })
    )
    .min(1),
  couponCode: z.string().trim().optional(),
  billingAddress: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string().default('US'),
    })
    .optional(),
  notes: z.string().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'paid', 'in_progress', 'completed', 'cancelled', 'refunded', 'failed']),
  note: z.string().optional(),
});

export const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});
