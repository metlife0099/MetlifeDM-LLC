import { z } from 'zod';

export const serviceCreateSchema = z.object({
  title: z.string().min(3).max(140),
  subtitle: z.string().optional(),
  shortDescription: z.string().min(10).max(320),
  description: z.string().min(20),
  category: z.enum([
    'seo', 'ppc', 'social_media', 'local_seo', 'web_development', 'branding',
    'content_marketing', 'email_marketing', 'video_marketing', 'analytics', 'ai_solutions', 'other',
  ]),
  industries: z.array(z.string()).optional(),
  icon: z.string().optional(),
  heroImage: z.object({ url: z.string(), publicId: z.string().optional(), alt: z.string().optional() }).optional(),
  gallery: z.array(z.object({ url: z.string(), publicId: z.string().optional(), alt: z.string().optional() })).optional(),
  features: z.array(z.object({ title: z.string(), description: z.string(), icon: z.string().optional() })).optional(),
  benefits: z.array(z.object({ title: z.string(), description: z.string(), icon: z.string().optional() })).optional(),
  technologies: z.array(z.object({ name: z.string(), logo: z.string().optional(), url: z.string().optional() })).optional(),
  process: z.array(z.object({ order: z.number(), title: z.string(), description: z.string().optional(), icon: z.string().optional(), duration: z.string().optional() })).optional(),
  deliverables: z.array(z.string()).optional(),
  faqs: z.array(z.object({ question: z.string(), answer: z.string(), order: z.number().optional() })).optional(),
  pricingPlans: z.array(z.object({
    name: z.string(),
    tagline: z.string().optional(),
    price: z.number().nonnegative(),
    compareAtPrice: z.number().optional(),
    currency: z.string().optional(),
    billingCycle: z.enum(['one_time', 'monthly', 'quarterly', 'yearly', 'custom']).optional(),
    features: z.array(z.object({ label: z.string(), included: z.boolean().optional() })).optional(),
    isPopular: z.boolean().optional(),
    ctaLabel: z.string().optional(),
    deliveryTimeDays: z.number().optional(),
    revisions: z.number().optional(),
  })).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  order: z.number().optional(),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
  }).optional(),
});

export const serviceUpdateSchema = serviceCreateSchema.partial();
