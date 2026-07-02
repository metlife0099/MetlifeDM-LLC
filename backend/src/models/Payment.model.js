import mongoose from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_METHOD } from '../utils/constants.js';
import { generateInvoiceNumber } from '../utils/helpers.js';

const { Schema } = mongoose;

const refundSchema = new Schema(
  {
    stripeRefundId: String,
    amount: Number,
    reason: String,
    status: String,
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const paymentSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      index: true,
      default: generateInvoiceNumber,
    },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    amount: { type: Number, required: true, min: 0 },     // dollars
    amountRefunded: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },

    method: { type: String, enum: Object.values(PAYMENT_METHOD), default: PAYMENT_METHOD.CARD },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },

    // Stripe
    stripePaymentIntentId: { type: String, index: true },
    stripeChargeId: String,
    stripeCustomerId: String,
    stripeReceiptUrl: String,

    // Card details (last 4 only)
    card: {
      brand: String,
      last4: String,
      expMonth: Number,
      expYear: Number,
      country: String,
    },

    refunds: [refundSchema],

    // Invoice PDF
    invoiceUrl: String,
    invoicePublicId: String,
    invoiceGeneratedAt: Date,

    // Emails sent
    receiptEmailSentAt: Date,

    // Failure details
    failureCode: String,
    failureMessage: String,

    paidAt: Date,

    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

paymentSchema.virtual('netAmount').get(function () {
  return this.amount - this.amountRefunded;
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
