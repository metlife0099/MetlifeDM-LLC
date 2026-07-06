import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A marketing/newsletter email blast the admin composes and sends to
 * newsletter subscribers — either everyone, the "featured" segment, or a
 * hand-picked list. Sending happens out-of-request (see campaign.controller.js)
 * so `stats` is updated progressively while status stays 'sending'.
 */
const campaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // internal label
    subject: { type: String, required: true, trim: true },
    preheader: { type: String, trim: true },
    htmlContent: { type: String, required: true },

    targetType: { type: String, enum: ['all', 'featured', 'selected'], default: 'all' },
    recipients: [{ type: Schema.Types.ObjectId, ref: 'Newsletter' }], // only used when targetType === 'selected'

    status: {
      type: String,
      enum: ['draft', 'sending', 'sent', 'partial', 'failed'],
      default: 'draft',
      index: true,
    },

    stats: {
      totalRecipients: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },
    failedRecipients: [{ email: String, reason: String }],

    startedAt: Date,
    completedAt: Date,
    errorMessage: String,

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
