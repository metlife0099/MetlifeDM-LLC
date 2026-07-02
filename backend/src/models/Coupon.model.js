import mongoose from 'mongoose';

const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: String,
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },

    // Restrictions
    minPurchase: { type: Number, default: 0 },
    maxDiscount: Number, // cap for percent coupons

    // Usage
    usageLimit: { type: Number, default: null },     // null = unlimited
    usageLimitPerUser: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        order: { type: Schema.Types.ObjectId, ref: 'Order' },
        at: { type: Date, default: Date.now },
      },
    ],

    // Applicability
    applicableServices: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    applicableCategories: [String],
    firstOrderOnly: { type: Boolean, default: false },
    newCustomerOnly: { type: Boolean, default: false },

    // Time window
    startsAt: Date,
    expiresAt: { type: Date, index: true },
    isActive: { type: Boolean, default: true, index: true },

    // Stripe (optional — Stripe coupons for subscriptions)
    stripeCouponId: String,
    stripePromoCodeId: String,

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

couponSchema.methods.isValid = function () {
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  const now = Date.now();
  if (this.startsAt && this.startsAt.getTime() > now) return { valid: false, reason: 'Coupon not yet active' };
  if (this.expiresAt && this.expiresAt.getTime() < now) return { valid: false, reason: 'Coupon expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, reason: 'Coupon usage limit reached' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (subtotal) {
  let discount = this.type === 'percent' ? (subtotal * this.value) / 100 : this.value;
  if (this.maxDiscount && discount > this.maxDiscount) discount = this.maxDiscount;
  return Math.min(discount, subtotal);
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
