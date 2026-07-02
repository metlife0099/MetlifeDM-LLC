import mongoose from 'mongoose';
import { REGEX } from '../utils/constants.js';

const { Schema } = mongoose;

const contactSchema = new Schema(
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
    website: String,
    subject: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 3000 },
    budget: {
      type: String,
      enum: ['<5k', '5k-10k', '10k-25k', '25k-50k', '50k-100k', '100k+', 'undecided'],
    },
    servicesInterested: [String],
    timeline: String,
    howHeardAboutUs: String,

    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'converted', 'archived', 'spam'],
      default: 'new',
      index: true,
    },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    tags: [String],
    internalNotes: String,

    // If converted
    convertedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    convertedAt: Date,

    ipAddress: String,
    userAgent: String,
    referrer: String,
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String,
    },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1, createdAt: -1 });

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
