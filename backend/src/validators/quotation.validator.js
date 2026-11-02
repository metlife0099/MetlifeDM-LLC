import { z } from 'zod';
import { objectId } from './user.validator.js';

const money = z.coerce.number().nonnegative().max(999999.99).refine(
  (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
  'Use no more than two decimal places'
);
const optionalText = (max) => z.string().trim().max(max).optional().default('');
const list = z.array(z.string().trim().min(1).max(500)).max(50).optional().default([]);

const quotationFields = z.object({
  client: z.object({
    name: z.string().trim().min(1).max(160),
    email: z.string().trim().toLowerCase().email().optional().or(z.literal('')).default(''),
    company: optionalText(200),
    phone: optionalText(50),
    address: optionalText(500),
  }),
  projectTitle: z.string().trim().min(1).max(200),
  projectSummary: z.string().trim().min(10).max(4000),
  lineItems: z.array(z.object({
    title: z.string().trim().min(1).max(200),
    description: optionalText(1000),
    quantity: z.coerce.number().positive().max(100000),
    unitPrice: money,
  })).min(1).max(50),
  currency: z.enum(['USD', 'INR']).optional().default('USD'),
  discount: money.optional().default(0),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
  scope: list,
  deliverables: list,
  timeline: optionalText(1000),
  paymentTerms: optionalText(2000),
  terms: optionalText(5000),
  notes: optionalText(2000),
  validUntil: z.coerce.date().refine(
    (value) => value.getTime() >= new Date().setHours(0, 0, 0, 0),
    'Valid-until date cannot be in the past'
  ),
  signatoryId: objectId.optional().or(z.literal('')),
});

export const createQuotationSchema = quotationFields;
export const updateQuotationSchema = quotationFields;

export const sendQuotationSchema = z.object({
  recipientEmail: z.string().trim().toLowerCase().email(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  cc: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
});
