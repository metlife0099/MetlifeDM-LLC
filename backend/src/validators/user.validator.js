import { z } from 'zod';
import { USER_ROLES, USER_STATUS } from '../utils/constants.js';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(60).optional(),
  lastName: z.string().trim().min(2).max(60).optional(),
  phone: z.string().trim().optional(),
  company: z
    .object({
      name: z.string().optional(),
      website: z.string().optional(),
      size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
      industry: z.string().optional(),
    })
    .optional(),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  preferences: z
    .object({
      language: z.string().optional(),
      timezone: z.string().optional(),
      notifications: z
        .object({
          email: z.boolean().optional(),
          sms: z.boolean().optional(),
          push: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  newsletterSubscribed: z.boolean().optional(),
});

export const wishlistSchema = z.object({ serviceId: objectId });

export const adminUpdateUserSchema = z.object({
  role: z.enum(Object.values(USER_ROLES)).optional(),
  status: z.enum(Object.values(USER_STATUS)).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
});
