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
  customerName: z.string().trim().min(2, 'Full name is required'),
  customerEmail: z.string().trim().email('A valid email is required'),
  customerPhone: z.string().trim().min(7, 'Phone number is required'),
  customerWebsite: z.string().trim().optional(),
  billingAddress: z.object({
    line1: z.string().trim().min(1, 'Address is required'),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    zip: z.string().trim().min(1, 'ZIP/postal code is required'),
    country: z.string().trim().default('US'),
  }),
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
