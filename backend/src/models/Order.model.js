import mongoose from 'mongoose';
import { ORDER_STATUS, BILLING_CYCLE } from '../utils/constants.js';
import { generateOrderNumber } from '../utils/helpers.js';

const { Schema } = mongoose;

const lineItemSchema = new Schema(
  {
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: String,
    planId: Schema.Types.ObjectId,
    planName: String,
    billingCycle: { type: String, enum: Object.values(BILLING_CYCLE) },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS) },
    note: String,
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
      default: generateOrderNumber,
    },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerEmail: String,
    customerName: String,

    items: { type: [lineItemSchema], required: true, validate: (v) => v.length > 0 },

    // Money (all in USD cents at API level, dollars here)
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },

    coupon: {
      code: String,
      type: { type: String, enum: ['percent', 'fixed'] },
      value: Number,
      appliedDiscount: Number,
    },

    billingAddress: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: 'US' },
    },

    // Payment linkage
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
    stripePaymentIntentId: { type: String, index: true },
    stripeCustomerId: String,
    stripeSubscriptionId: String,

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    statusHistory: [statusHistorySchema],

    notes: String,
    adminNotes: String,

    // Assigned team
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    kickoffDate: Date,
    expectedDeliveryDate: Date,
    completedAt: Date,

    // Attached deliverables (uploaded by admin)
    deliverables: [
      {
        title: String,
        description: String,
        fileUrl: String,
        publicId: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Reporting
    ipAddress: String,
    userAgent: String,
    source: String, // web, admin, api
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.methods.pushStatus = function (status, note, changedBy) {
  this.status = status;
  this.statusHistory.push({ status, note, changedBy });
};

const Order = mongoose.model('Order', orderSchema);
export default Order;
