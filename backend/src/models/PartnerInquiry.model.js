import mongoose from 'mongoose';
import { REGEX } from '../utils/constants.js';

const { Schema } = mongoose;

const partnerInquirySchema = new Schema(
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
    company: { type: String, required: true, trim: true }, // agency / company name
    website: String,

    agencyType: {
      type: String,
      enum: ['marketing_agency', 'web_design_agency', 'seo_agency', 'branding_agency', 'software_company', 'other'],
      required: true,
    },
    monthlyProjectVolume: {
      type: String,
      enum: ['1-2', '3-5', '6-10', '10+'],
    },
    servicesNeeded: [String],
    message: { type: String, maxlength: 3000 },

    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'active_partner', 'not_a_fit'],
      default: 'new',
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    internalNotes: String,

    source: { type: String, default: 'partners_page' },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

partnerInquirySchema.index({ status: 1, createdAt: -1 });
partnerInquirySchema.index({ email: 1, createdAt: -1 });

const PartnerInquiry = mongoose.model('PartnerInquiry', partnerInquirySchema);
export default PartnerInquiry;
