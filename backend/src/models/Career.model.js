import mongoose from 'mongoose';
import { toSlug } from '../utils/helpers.js';
import { CAREER_STATUS } from '../utils/constants.js';

const { Schema } = mongoose;

const careerSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 160 },
    slug: { type: String, unique: true, index: true },
    department: {
      type: String,
      enum: ['engineering', 'marketing', 'design', 'sales', 'operations', 'content', 'seo', 'ppc', 'social', 'leadership', 'other'],
    },

    location: { type: String, required: true },      // e.g. "New York, NY / Remote"
    workMode: { type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'hybrid' },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship', 'temporary'],
      default: 'full_time',
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'],
    },

    shortDescription: { type: String, required: true, maxlength: 400 },
    description: { type: String, required: true },   // rich HTML
    responsibilities: [String],
    requirements: [String],
    niceToHave: [String],
    benefits: [String],
    skills: [String],

    salary: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' },
      period: { type: String, enum: ['hourly', 'monthly', 'yearly'], default: 'yearly' },
      visible: { type: Boolean, default: true },
    },

    status: {
      type: String,
      enum: Object.values(CAREER_STATUS),
      default: CAREER_STATUS.OPEN,
      index: true,
    },

    openings: { type: Number, default: 1 },
    applicationsCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },

    postedAt: { type: Date, default: Date.now },
    closesAt: Date,

    hiringManager: { type: Schema.Types.ObjectId, ref: 'User' },

    isFeatured: { type: Boolean, default: false },
    tags: [String],

    seo: {
      metaTitle: String,
      metaDescription: String,
      ogImage: String,
      schemaJson: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

careerSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) this.slug = toSlug(this.title);
  next();
});

careerSchema.index({ status: 1, department: 1, postedAt: -1 });

const Career = mongoose.model('Career', careerSchema);
export default Career;
