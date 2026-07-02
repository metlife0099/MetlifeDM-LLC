import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';

const { Schema } = mongoose;

const portfolioSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, unique: true, index: true },
    client: { type: String, required: true },
    clientLogo: { url: String, publicId: String },
    industry: { type: String, index: true },
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],

    shortDescription: { type: String, required: true, maxlength: 400 },
    description: String,

    // Media
    coverImage: { url: String, publicId: String, alt: String },
    gallery: [{ url: String, publicId: String, alt: String, caption: String }],
    videoUrl: String,
    beforeImage: { url: String, publicId: String },
    afterImage: { url: String, publicId: String },

    // Metrics
    metrics: [
      {
        label: String,
        value: String,
        delta: String,
        icon: String,
      },
    ],

    // Tech
    technologies: [{ name: String, logo: String }],

    // Links
    liveUrl: String,
    caseStudy: { type: Schema.Types.ObjectId, ref: 'CaseStudy' },

    duration: String,     // e.g. "3 months"
    year: Number,

    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },

    tags: [String],

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String,
    },
  },
  { timestamps: true }
);

portfolioSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) this.slug = toSlug(this.title);
  next();
});

portfolioSchema.index({ title: 'text', client: 'text', shortDescription: 'text' });
portfolioSchema.index({ industry: 1, isPublished: 1 });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
export default Portfolio;
