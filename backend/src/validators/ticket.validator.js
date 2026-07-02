import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(['general', 'billing', 'technical', 'account', 'refund', 'complaint', 'feature_request', 'other']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  order: z.string().optional(),
  service: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const replyTicketSchema = z.object({
  content: z.string().min(1),
  isInternal: z.boolean().optional(),
});

export const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
