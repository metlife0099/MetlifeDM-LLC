import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';

const { Schema } = mongoose;

const blogCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: String,
    color: { type: String, default: '#0EA5E9' },
    icon: String,
    parent: { type: Schema.Types.ObjectId, ref: 'BlogCategory' },
    order: { type: Number, default: 0 },
    postCount: { type: Number, default: 0 },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
  },
  { timestamps: true }
);

blogCategorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) this.slug = toSlug(this.name);
  next();
});

const BlogCategory = mongoose.model('BlogCategory', blogCategorySchema);
export default BlogCategory;
