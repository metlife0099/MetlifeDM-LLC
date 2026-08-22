import { z } from 'zod';

const currencyAmount = z.number().nonnegative().max(999999.99).refine(
  (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
  'Amount must have at most two decimal places'
);

const optionalStripeId = (prefix) => z.preprocess(
  (value) => (value === '' || value === null ? undefined : value),
  z.string().regex(new RegExp(`^${prefix}_[A-Za-z0-9]+$`), `Invalid Stripe ${prefix} ID`).optional()
);

const pricingPlanSchema = z.object({
  name: z.string().trim().min(1).max(100),
  tagline: z.string().max(200).optional(),
  price: currencyAmount,
  compareAtPrice: currencyAmount.optional(),
  currency: z.string().trim().transform((value) => value.toUpperCase())
    .refine((value) => value === 'USD', 'Only USD plans can be published for online checkout')
    .optional(),
  billingCycle: z.enum(['one_time', 'monthly', 'quarterly', 'yearly', 'custom']).optional(),
  stripePriceId: optionalStripeId('price'),
  stripeProductId: optionalStripeId('prod'),
  features: z.array(z.object({ label: z.string(), included: z.boolean().optional() })).optional(),
  isPopular: z.boolean().optional(),
  ctaLabel: z.string().max(80).optional(),
  deliveryTimeDays: z.number().int().nonnegative().optional(),
  revisions: z.number().int().nonnegative().optional(),
});

const serviceFields = z.object({
  title: z.string().min(3).max(140),
  subtitle: z.string().max(200).optional(),
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
  pricingPlans: z.array(pricingPlanSchema).max(20).optional(),
  comparisonTable: z.array(z.object({
    feature: z.string(),
    values: z.array(z.string()).optional(),
    order: z.number().optional(),
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

const requireStripePricesWhenPublished = (data, context) => {
  if (data.isPublished === false || !data.pricingPlans) return;
  data.pricingPlans.forEach((plan, index) => {
    const recurring = !['one_time', 'custom'].includes(plan.billingCycle || 'monthly');
    if (recurring && !plan.stripePriceId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pricingPlans', index, 'stripePriceId'],
        message: 'Published recurring plans require a Stripe price ID',
      });
    }
  });
};

export const serviceCreateSchema = serviceFields.superRefine(requireStripePricesWhenPublished);
export const serviceUpdateSchema = serviceFields.partial().superRefine(requireStripePricesWhenPublished);
