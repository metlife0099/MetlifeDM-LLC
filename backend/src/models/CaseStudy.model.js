import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';

const { Schema } = mongoose;

const caseStudySchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    slug: { type: String, unique: true, index: true },
    portfolio: { type: Schema.Types.ObjectId, ref: 'Portfolio' },
    client: { type: String, required: true },
    industry: String,
    category: { type: Schema.Types.ObjectId, ref: 'CaseStudyCategory', index: true },

    heroImage: { url: String, publicId: String, alt: String },
    tagline: String,

    challenge: { type: String, required: true },
    approach: String,
    solution: { type: String, required: true },
    result: { type: String, required: true },

    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    duration: String,
    year: Number,

    // Results
    kpis: [
      {
        label: String,
        before: String,
        after: String,
        change: String,
        icon: String,
      },
    ],
    charts: [
      {
        title: String,
        type: { type: String, enum: ['line', 'bar', 'pie', 'area'] },
        dataUrl: String,          // JSON URL for chart data
        imageUrl: String,          // pre-rendered PNG fallback
      },
    ],

    testimonial: {
      quote: String,
      author: String,
      role: String,
      avatar: String,
    },

    downloadPdfUrl: String,

    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String,
      schemaJson: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

caseStudySchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) this.slug = toSlug(this.title);
  next();
});

const CaseStudy = mongoose.model('CaseStudy', caseStudySchema);
export default CaseStudy;
