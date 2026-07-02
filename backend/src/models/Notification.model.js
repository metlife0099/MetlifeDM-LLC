import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../utils/constants.js';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    icon: String,
    color: String,

    // Linked resource
    resourceType: String,
    resourceId: Schema.Types.ObjectId,
    actionUrl: String,

    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,

    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },

    // Channels sent
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },

    // Metadata
    data: Schema.Types.Mixed,

    // Expiry
    expiresAt: { type: Date, index: { expires: 0 } },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
