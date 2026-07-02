import mongoose from 'mongoose';

const { Schema } = mongoose;

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: String,
    company: String,
    companyLogo: { url: String, publicId: String },
    location: String,
    avatar: { url: String, publicId: String },

    quote: { type: String, required: true, maxlength: 1200 },
    rating: { type: Number, min: 1, max: 5, default: 5 },

    videoUrl: String,
    linkedinUrl: String,

    service: { type: Schema.Types.ObjectId, ref: 'Service' },
    industry: String,

    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },

    source: {
      type: String,
      enum: ['website', 'google', 'clutch', 'trustpilot', 'linkedin', 'email', 'other'],
      default: 'website',
    },

    // If linked to actual customer
    customer: { type: Schema.Types.ObjectId, ref: 'User' },
    order_: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

testimonialSchema.index({ isPublished: 1, isFeatured: -1, order: 1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);
export default Testimonial;
