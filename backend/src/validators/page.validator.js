import { z } from 'zod';

const sectionSchema = z.object({
  type: z.enum(['hero', 'text', 'image', 'gallery', 'video', 'cta', 'features', 'testimonials', 'faq', 'stats', 'contact', 'html']),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  body: z.string().optional(),
  image: z.object({ url: z.string().optional(), publicId: z.string().optional() }).optional(),
  items: z.array(z.any()).optional(),
  settings: z.any().optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
});

export const pageCreateSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().optional(),
  template: z.enum(['default', 'landing', 'legal', 'contact', 'sidebar']).optional(),
  sections: z.array(sectionSchema).optional(),
  isPublished: z.boolean().optional(),
  isHomepage: z.boolean().optional(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    noIndex: z.boolean().optional(),
  }).optional(),
});

export const pageUpdateSchema = pageCreateSchema.partial();
