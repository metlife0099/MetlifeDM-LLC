import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';

const { Schema } = mongoose;

const industrySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    shortDescription: { type: String, required: true, maxlength: 400 },
    description: String,

    icon: String,
    heroImage: { url: String, publicId: String },
    illustration: String,

    challenges: [{ title: String, description: String }],
    solutions: [{ title: String, description: String, icon: String }],
    recommendedServices: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    caseStudies: [{ type: Schema.Types.ObjectId, ref: 'CaseStudy' }],

    stats: [{ label: String, value: String }],

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

industrySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) this.slug = toSlug(this.name);
  next();
});

const Industry = mongoose.model('Industry', industrySchema);
export default Industry;
