import mongoose from 'mongoose';

const { Schema } = mongoose;

const lineItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    quantity: { type: Number, required: true, min: 0.01, max: 100000 },
    unitPrice: { type: Number, required: true, min: 0, max: 999999.99 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const sentHistorySchema = new Schema(
  {
    recipientEmail: { type: String, required: true },
    subject: String,
    messageId: String,
    version: Number,
    sentBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const quotationSchema = new Schema(
  {
    quotationNumber: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'expired', 'cancelled'],
      default: 'draft',
      index: true,
    },
    version: { type: Number, default: 1, min: 1 },
    client: {
      name: { type: String, required: true, trim: true, maxlength: 160 },
      email: { type: String, trim: true, lowercase: true, default: '' },
      company: { type: String, trim: true, maxlength: 200 },
      phone: { type: String, trim: true, maxlength: 50 },
      address: { type: String, trim: true, maxlength: 500 },
    },
    projectTitle: { type: String, required: true, trim: true, maxlength: 200 },
    projectSummary: { type: String, required: true, trim: true, maxlength: 4000 },
    lineItems: { type: [lineItemSchema], validate: [(items) => items.length > 0, 'At least one line item is required'] },
    currency: { type: String, enum: ['USD', 'INR'], default: 'USD' },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    scope: [{ type: String, trim: true, maxlength: 500 }],
    deliverables: [{ type: String, trim: true, maxlength: 500 }],
    timeline: { type: String, trim: true, maxlength: 1000 },
    paymentTerms: { type: String, trim: true, maxlength: 2000 },
    terms: { type: String, trim: true, maxlength: 5000 },
    notes: { type: String, trim: true, maxlength: 2000 },
    validUntil: { type: Date, required: true, index: true },
    signatoryId: Schema.Types.ObjectId,
    branding: { type: Schema.Types.Mixed, required: true },
    sentHistory: { type: [sentHistorySchema], default: [] },
    lastSentAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

quotationSchema.index({ createdAt: -1 });
quotationSchema.index({ 'client.email': 1, createdAt: -1 });

const Quotation = mongoose.model('Quotation', quotationSchema);
export default Quotation;
