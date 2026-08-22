import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';
import { BILLING_CYCLE } from '../utils/constants.js';
import { isCurrencyAmount } from '../utils/money.js';

const { Schema } = mongoose;

const pricingPlanSchema = new Schema(
  {
    name: { type: String, required: true },       // Starter, Growth, Enterprise
    tagline: String,
    price: { type: Number, required: true, min: 0, validate: isCurrencyAmount },
    compareAtPrice: { type: Number, min: 0, validate: isCurrencyAmount },
    currency: { type: String, default: 'USD', uppercase: true },
    billingCycle: {
      type: String,
      enum: Object.values(BILLING_CYCLE),
      default: BILLING_CYCLE.MONTHLY,
    },
    stripePriceId: { type: String, match: /^price_[A-Za-z0-9]+$/ },
    stripeProductId: { type: String, match: /^prod_[A-Za-z0-9]+$/ },
    features: [{ label: String, included: { type: Boolean, default: true } }],
    isPopular: { type: Boolean, default: false },
    ctaLabel: { type: String, default: 'Add to cart' },
    deliveryTimeDays: Number,
    revisions: { type: Number, default: 0 },
  },
  { _id: true, timestamps: true }
);

// One row of a plan-comparison table (e.g. "SEO" -> ["Basic", "Advanced", "Enterprise"]).
// `values` is aligned by index to this service's `pricingPlans` order, so the
// admin UI renders one input per current plan rather than keying by plan id —
// simpler to edit, and correct as long as plans aren't silently reordered.
const comparisonRowSchema = new Schema(
  {
    feature: { type: String, required: true },
    values: [{ type: String, default: '' }],
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const processStepSchema = new Schema(
  {
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: String,
    icon: String,
    duration: String,
  },
  { _id: false }
);

const faqSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const serviceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, unique: true, index: true },
    subtitle: String,
    shortDescription: { type: String, required: true, maxlength: 320 },
    description: { type: String, required: true },   // rich text / markdown

    // Categorization
    category: {
      type: String,
      required: true,
      enum: [
        'seo',
        'ppc',
        'social_media',
        'local_seo',
        'web_development',
        'branding',
        'content_marketing',
        'email_marketing',
        'video_marketing',
        'analytics',
        'ai_solutions',
        'other',
      ],
      index: true,
    },
    industries: [{ type: String }],

    // Visuals
    icon: String,
    heroImage: { url: String, publicId: String, alt: String },
    gallery: [{ url: String, publicId: String, alt: String }],

    // Content blocks
    features: [{ title: String, description: String, icon: String }],
    benefits: [{ title: String, description: String, icon: String }],
    technologies: [{ name: String, logo: String, url: String }],
    process: [processStepSchema],
    deliverables: [String],
    faqs: [faqSchema],

    // Pricing
    pricingPlans: [pricingPlanSchema],
    startingPrice: { type: Number, min: 0, validate: isCurrencyAmount },
    comparisonTable: [comparisonRowSchema],

    // Relations
    relatedServices: [{ type: Schema.Types.ObjectId, ref: 'Service' }],

    // Meta
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    stats: {
      views: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      purchases: { type: Number, default: 0 },
    },

    // SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String,
      canonical: String,
      schemaJson: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ title: 'text', shortDescription: 'text', description: 'text' });
serviceSchema.index({ category: 1, isPublished: 1, order: 1 });

serviceSchema.pre('validate', function (next) {
  if (this.isPublished) {
    const nonUsdPlan = this.pricingPlans?.find(
      (plan) => plan.billingCycle !== BILLING_CYCLE.CUSTOM && plan.currency !== 'USD'
    );
    if (nonUsdPlan) {
      this.invalidate('pricingPlans', `Published plan "${nonUsdPlan.name}" must use USD`);
    }
    const missingPrice = this.pricingPlans?.find(
      (plan) => ![BILLING_CYCLE.ONE_TIME, BILLING_CYCLE.CUSTOM].includes(plan.billingCycle) &&
        !plan.stripePriceId
    );
    if (missingPrice) {
      this.invalidate(
        'pricingPlans',
        `Published recurring plan "${missingPrice.name}" requires a Stripe price ID`
      );
    }
  }
  next();
});

serviceSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) this.slug = toSlug(this.title);
  if (this.pricingPlans?.length) {
    this.startingPrice = Math.min(...this.pricingPlans.map((p) => p.price));
  }
  next();
});

const Service = mongoose.model('Service', serviceSchema);
export default Service;
