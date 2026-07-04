import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';

const { Schema } = mongoose;

const sectionSchema = new Schema(
  {
    type: {
      type: String,
      enum: [
        'hero',
        'text',
        'image',
        'gallery',
        'video',
        'cta',
        'features',
        'testimonials',
        'faq',
        'stats',
        'contact',
        'html',
      ],
      required: true,
    },
    title: String,
    subtitle: String,
    body: String,
    image: { url: String, publicId: String },
    items: [Schema.Types.Mixed],
    settings: Schema.Types.Mixed,
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { _id: true }
);

const pageSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    slug: { type: String, unique: true, index: true },
    template: {
      type: String,
      enum: ['default', 'landing', 'legal', 'contact', 'sidebar'],
      default: 'default',
    },
    excerpt: { type: String, maxlength: 500 },
    content: String, // HTML from the admin rich-text editor
    sections: [sectionSchema],

    isPublished: { type: Boolean, default: false, index: true },
    isHomepage: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String,
      canonical: String,
      noIndex: { type: Boolean, default: false },
      schemaJson: Schema.Types.Mixed,
    },

    author: { type: Schema.Types.ObjectId, ref: 'User' },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: Date,
  },
  { timestamps: true }
);

pageSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) this.slug = toSlug(this.title);
  if (this.isPublished && !this.publishedAt) this.publishedAt = new Date();
  next();
});

const Page = mongoose.model('Page', pageSchema);
export default Page;
