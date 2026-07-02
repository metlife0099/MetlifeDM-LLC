import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: Schema.Types.ObjectId, ref: 'Service', index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 200 },
    comment: { type: String, required: true, maxlength: 2000 },

    // Verification
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },

    // Interactions
    helpfulCount: { type: Number, default: 0 },
    reportedCount: { type: Number, default: 0 },

    // Admin reply
    adminReply: {
      content: String,
      author: { type: Schema.Types.ObjectId, ref: 'User' },
      at: Date,
    },

    images: [{ url: String, publicId: String }],
  },
  { timestamps: true }
);

reviewSchema.index({ customer: 1, service: 1 }, { unique: true, partialFilterExpression: { service: { $exists: true } } });
reviewSchema.index({ service: 1, isPublished: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
