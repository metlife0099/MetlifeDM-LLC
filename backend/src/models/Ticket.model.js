import mongoose from 'mongoose';
import { TICKET_STATUS, TICKET_PRIORITY } from '../utils/constants.js';
import { generateTicketNumber } from '../utils/helpers.js';

const { Schema } = mongoose;

const ticketReplySchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    authorType: { type: String, enum: ['customer', 'agent', 'system'] },
    content: { type: String, required: true },
    attachments: [{ url: String, publicId: String, name: String }],
    isInternal: { type: Boolean, default: false },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ticketSchema = new Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
      default: generateTicketNumber,
    },
    subject: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true },

    customer: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    customerEmail: String,
    customerName: String,

    // Optional links
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },

    category: {
      type: String,
      enum: ['general', 'billing', 'technical', 'sales', 'refund', 'complaint', 'other'],
      default: 'general',
    },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITY),
      default: TICKET_PRIORITY.NORMAL,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
      index: true,
    },

    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    tags: [String],

    replies: [ticketReplySchema],

    firstResponseAt: Date,
    resolvedAt: Date,
    closedAt: Date,

    // SLA
    dueBy: Date,
    slaBreached: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1, priority: -1, createdAt: -1 });
ticketSchema.index({ customer: 1, createdAt: -1 });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
