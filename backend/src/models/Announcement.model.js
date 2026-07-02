import mongoose from 'mongoose';

const { Schema } = mongoose;

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    ctaLabel: String,
    ctaUrl: String,

    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'promo', 'holiday'],
      default: 'info',
    },
    placement: {
      type: String,
      enum: ['top_bar', 'popup', 'floating', 'inline'],
      default: 'top_bar',
    },

    audience: {
      type: String,
      enum: ['all', 'guests', 'customers', 'admins'],
      default: 'all',
    },
    pages: [String], // route patterns, or ['*'] for all

    startsAt: Date,
    endsAt: Date,
    isActive: { type: Boolean, default: true, index: true },
    isDismissible: { type: Boolean, default: true },

    priority: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    dismissals: { type: Number, default: 0 },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
