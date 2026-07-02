import mongoose from 'mongoose';
import { CHAT_STATUS } from '../utils/constants.js';

const { Schema } = mongoose;

const chatSchema = new Schema(
  {
    // Optional user if authenticated, else guest
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    guestSessionId: { type: String, index: true },
    guestName: String,
    guestEmail: String,

    // Which agent is handling (if any)
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    status: {
      type: String,
      enum: Object.values(CHAT_STATUS),
      default: CHAT_STATUS.BOT,
      index: true,
    },

    // Categorization from bot
    category: {
      type: String,
      enum: ['general', 'sales', 'support', 'billing', 'technical', 'partnership', 'other'],
      default: 'general',
    },
    tags: [String],

    // Handoff → ticket link
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    handoffAt: Date,
    handoffReason: String,

    // Summary for admin scanning
    subject: String,
    summary: String,

    // Sentiment
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
    rating: { type: Number, min: 1, max: 5 },
    feedback: String,

    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessagePreview: String,
    unreadForUser: { type: Number, default: 0 },
    unreadForAgent: { type: Number, default: 0 },

    resolvedAt: Date,
    archivedAt: Date,

    ipAddress: String,
    userAgent: String,
    referrer: String,
  },
  { timestamps: true }
);

chatSchema.index({ status: 1, lastMessageAt: -1 });
chatSchema.index({ user: 1, lastMessageAt: -1 });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
