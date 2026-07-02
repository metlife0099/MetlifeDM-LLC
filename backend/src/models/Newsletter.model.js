import mongoose from 'mongoose';
import { REGEX } from '../utils/constants.js';

const { Schema } = mongoose;

const newsletterSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [REGEX.EMAIL, 'Invalid email'],
      index: true,
    },
    name: String,
    tags: [String],
    interests: [String],

    isActive: { type: Boolean, default: true, index: true },
    isVerified: { type: Boolean, default: false },
    verifyToken: { type: String, select: false },

    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: Date,
    unsubscribeReason: String,

    lastEmailSentAt: Date,
    totalEmailsSent: { type: Number, default: 0 },
    totalEmailsOpened: { type: Number, default: 0 },
    totalEmailsClicked: { type: Number, default: 0 },

    // Brevo integration
    brevoContactId: String,
    brevoListIds: [Number],

    source: String, // where they signed up
    ipAddress: String,

    utm: {
      source: String,
      medium: String,
      campaign: String,
    },
  },
  { timestamps: true }
);

const Newsletter = mongoose.model('Newsletter', newsletterSchema);
export default Newsletter;
