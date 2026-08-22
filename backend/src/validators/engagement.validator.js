import { z } from 'zod';
import { objectId } from './user.validator.js';

export const createReviewSchema = z.object({
  service: objectId,
  order: objectId.optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(200).optional(),
  comment: z.string().trim().min(5).max(2000),
  images: z.array(z.object({
    url: z.string().url(),
    publicId: z.string().max(300).optional(),
  })).max(5).optional(),
});

export const moderateReviewSchema = z.object({
  isApproved: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one moderation field is required');

export const replyReviewSchema = z.object({ content: z.string().trim().min(1).max(2000) });
