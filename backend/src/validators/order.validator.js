import { z } from 'zod';
import { objectId } from './user.validator.js';

export const createOrderSchema = z.object({
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to place an order' }),
  }),
  items: z
    .array(
      z.object({
        service: objectId,
        planId: objectId.optional(),
        quantity: z.number().int().min(1).max(100).default(1),
      })
    )
    .min(1)
    .max(20, 'A checkout can contain at most 20 items'),
  couponCode: z.string().trim().min(1).max(50).transform((value) => value.toUpperCase()).optional(),
  customerName: z.string().trim().min(2, 'Full name is required').max(120),
  customerEmail: z.string().trim().email('A valid email is required').max(254).transform((value) => value.toLowerCase()),
  customerPhone: z.string().trim().min(7, 'Phone number is required').max(30)
    .regex(/^\+?[0-9 ()-]+$/, 'Invalid phone number'),
  customerWebsite: z.union([z.literal(''), z.string().trim().url().max(2048)])
    .transform((value) => value || undefined)
    .optional(),
  billingAddress: z.object({
    line1: z.string().trim().min(1, 'Address is required').max(200),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().min(1, 'City is required').max(100),
    state: z.string().trim().min(1, 'State is required').max(100),
    zip: z.string().trim().min(1, 'ZIP/postal code is required').max(20),
    country: z.string().trim().length(2).transform((value) => value.toUpperCase()).default('US'),
  }),
  notes: z.string().trim().max(1000).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'paid', 'in_progress', 'completed', 'cancelled', 'refunded', 'failed']),
  note: z.string().optional(),
});

export const refundSchema = z.object({
  idempotencyKey: z.string().uuid(),
  amount: z.number().positive().max(999999.99).refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    'Refund amount must have at most two decimal places'
  ).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const manageSubscriptionSchema = z.object({
  action: z.enum(['cancel', 'resume']),
  atPeriodEnd: z.boolean().default(true),
});
