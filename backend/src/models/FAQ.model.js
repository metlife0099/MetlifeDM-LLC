import mongoose from 'mongoose';

const { Schema } = mongoose;

const faqSchema = new Schema(
  {
    question: { type: String, required: true, maxlength: 300 },
    answer: { type: String, required: true, maxlength: 2000 },
    category: {
      type: String,
      enum: ['general', 'pricing', 'services', 'process', 'payment', 'support', 'seo', 'ppc', 'ai'],
      default: 'general',
      index: true,
    },
    tags: [String],
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    helpful: { type: Number, default: 0 },
    notHelpful: { type: Number, default: 0 },
    relatedService: { type: Schema.Types.ObjectId, ref: 'Service' },
  },
  { timestamps: true }
);

faqSchema.index({ category: 1, isPublished: 1, order: 1 });

const FAQ = mongoose.model('FAQ', faqSchema);
export default FAQ;
