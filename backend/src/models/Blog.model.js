import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';
import { BLOG_STATUS } from '../utils/constants.js';

const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    guestName: String,
    guestEmail: String,
    content: { type: String, required: true, maxlength: 2000 },
    isApproved: { type: Boolean, default: false },
    isSpam: { type: Boolean, default: false },
    parent: { type: Schema.Types.ObjectId },
    likes: { type: Number, default: 0 },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, index: true },
    excerpt: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true },       // HTML from rich editor
    contentPlain: String,                             // stripped for search

    coverImage: { url: String, publicId: String, alt: String },

    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coAuthors: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    category: { type: Schema.Types.ObjectId, ref: 'BlogCategory', index: true },
    tags: [{ type: String, lowercase: true, trim: true, index: true }],

    status: {
      type: String,
      enum: Object.values(BLOG_STATUS),
      default: BLOG_STATUS.DRAFT,
      index: true,
    },

    isFeatured: { type: Boolean, default: false, index: true },
    isPinned: { type: Boolean, default: false },

    publishedAt: { type: Date, index: true },
    scheduledFor: Date,

    readingTime: { type: Number, default: 1 }, // minutes

    // Engagement
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    commentsEnabled: { type: Boolean, default: true },
    comments: [commentSchema],

    relatedPosts: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],

    // SEO
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      focusKeyword: String,
      ogImage: String,
      ogTitle: String,
      ogDescription: String,
      twitterCard: { type: String, default: 'summary_large_image' },
      canonical: String,
      noIndex: { type: Boolean, default: false },
      schemaJson: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

blogSchema.index({ title: 'text', excerpt: 'text', contentPlain: 'text', tags: 'text' });
blogSchema.index({ status: 1, publishedAt: -1 });

blogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) this.slug = toSlug(this.title);
  if (this.isModified('content')) {
    this.contentPlain = String(this.content).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const words = this.contentPlain.split(' ').length;
    this.readingTime = Math.max(1, Math.round(words / 220));
  }
  if (this.status === BLOG_STATUS.PUBLISHED && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
