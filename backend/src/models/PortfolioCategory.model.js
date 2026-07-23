import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';

const { Schema } = mongoose;

const portfolioCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    color: { type: String, default: '#1547FF' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

portfolioCategorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) this.slug = toSlug(this.name);
  next();
});

const PortfolioCategory = mongoose.model('PortfolioCategory', portfolioCategorySchema);
export default PortfolioCategory;
