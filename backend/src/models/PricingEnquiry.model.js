import mongoose from 'mongoose';
import { REGEX } from '../utils/constants.js';

const { Schema } = mongoose;

const pricingEnquirySchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [REGEX.EMAIL, 'Invalid email'],
    },
    phone: String,
    company: String,

    // Who's asking — shapes how sales should approach the reply.
    inquirerType: {
      type: String,
      enum: ['customer', 'agency'],
      required: true,
    },

    // Which pricing page / plan this came from, e.g. "Growth Solutions",
    // "SEO & Search Growth", "Ads Growth" — free text so new pricing pages
    // never need a schema change to be representable here.
    service: { type: String, required: true, trim: true },
    plan: String,
    budget: String,
    message: { type: String, maxlength: 3000 },

    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'converted', 'not_a_fit'],
      default: 'new',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    internalNotes: String,

    source: { type: String, default: 'pricing_page' },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

pricingEnquirySchema.index({ status: 1, createdAt: -1 });
pricingEnquirySchema.index({ email: 1, createdAt: -1 });

const PricingEnquiry = mongoose.model('PricingEnquiry', pricingEnquirySchema);
export default PricingEnquiry;
