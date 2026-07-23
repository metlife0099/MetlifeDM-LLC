import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';

const { Schema } = mongoose;

const caseStudyCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    color: { type: String, default: '#1547FF' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

caseStudyCategorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) this.slug = toSlug(this.name);
  next();
});

const CaseStudyCategory = mongoose.model('CaseStudyCategory', caseStudyCategorySchema);
export default CaseStudyCategory;
