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
    currency: { type: String, default: 'USD', uppercase: true },
    billingCycle: { type: String, enum: Object.values(BILLING_CYCLE) },
    serviceCategory: String,
    stripePriceId: String,
    stripeProductId: String,
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
    checkoutIdempotencyKey: { type: String, unique: true, sparse: true, index: true, select: false },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerEmail: String,
    customerName: String,
    customerPhone: String,
    customerWebsite: String,

    items: { type: [lineItemSchema], required: true, validate: (v) => v.length > 0 },

    // Money (all in USD cents at API level, dollars here)
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },

    coupon: {
      couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
      code: String,
      type: { type: String, enum: ['percent', 'fixed'] },
      value: Number,
      appliedDiscount: Number,
      reservedAt: Date,
      finalizedAt: Date,
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
    paymentMode: { type: String, enum: ['one_time', 'subscription'], default: 'one_time' },
    stripePaymentIntentId: { type: String, unique: true, sparse: true, index: true },
    stripeCustomerId: String,
    stripeSubscriptionId: { type: String, unique: true, sparse: true, index: true },
    subscriptionStatus: String,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    currentPeriodEnd: Date,
    // Stable provider-object generation. It is advanced only after the prior
    // object is confirmed terminal, never merely because a request retried.
    paymentAttempt: { type: Number, default: 1, min: 1, select: false },
    paymentExpiresAt: { type: Date, index: true },
    paymentSetupLock: {
      type: {
        token: String,
        expiresAt: Date,
      },
      select: false,
      _id: false,
    },
    // Set only when Stripe created an object but the local link/cancellation
    // outcome is uncertain. The public provider id remains the reconciliation
    // handle; these coordination details are intentionally not serialized.
    paymentRecovery: {
      type: {
        required: { type: Boolean, default: true },
        providerType: { type: String, enum: ['payment_intent', 'subscription'] },
        providerId: String,
        providerStatus: String,
        recordedAt: Date,
        lastError: String,
      },
      select: false,
      _id: false,
    },
    paidAt: Date,
    latestPaymentPaidAt: { type: Date, select: false },
    commerceFinalizedAt: Date,
    acquisitionSideEffectsAppliedAt: Date,
    acquisitionSideEffectsLeaseUntil: { type: Date, select: false },
    orderConfirmationEmailSentAt: Date,
    orderConfirmationEmailLeaseUntil: { type: Date, select: false },

    // Refund state is mirrored from Stripe so order views remain truthful.
    refundedAmount: { type: Number, default: 0, min: 0 },
    refundedAt: Date,
    refundReason: String,

    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    statusHistory: [statusHistorySchema],

    notes: String,
    adminNotes: String,
    agreement: {
      acceptedAt: Date,
      termsVersion: String,
      privacyVersion: String,
    },

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

orderSchema.virtual('subscription').get(function () {
  if (!this.stripeSubscriptionId) return null;
  return {
    id: this.stripeSubscriptionId,
    status: this.subscriptionStatus,
    cancelAtPeriodEnd: this.cancelAtPeriodEnd,
    currentPeriodEnd: this.currentPeriodEnd,
  };
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

orderSchema.methods.pushStatus = function (status, note, changedBy) {
  this.status = status;
  this.statusHistory.push({ status, note, changedBy });
};

const Order = mongoose.model('Order', orderSchema);
export default Order;
