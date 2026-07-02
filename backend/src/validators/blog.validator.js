import { z } from 'zod';

export const blogCreateSchema = z.object({
  title: z.string().min(5).max(200),
  excerpt: z.string().min(10).max(500),
  content: z.string().min(50),
  coverImage: z.object({ url: z.string(), publicId: z.string().optional(), alt: z.string().optional() }).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  scheduledFor: z.coerce.date().optional(),
  relatedPosts: z.array(z.string()).optional(),
  commentsEnabled: z.boolean().optional(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    focusKeyword: z.string().optional(),
    ogImage: z.string().optional(),
    noIndex: z.boolean().optional(),
  }).optional(),
});

export const blogUpdateSchema = blogCreateSchema.partial();

export const commentSchema = z.object({
  content: z.string().min(2).max(2000),
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional(),
  parent: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  parent: z.string().optional(),
  order: z.number().optional(),
});
