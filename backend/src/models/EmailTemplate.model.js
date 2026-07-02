import mongoose from 'mongoose';

const { Schema } = mongoose;

const emailTemplateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true, index: true },
    // e.g. WELCOME_EMAIL, EMAIL_VERIFICATION, PASSWORD_RESET, ORDER_CONFIRMATION,
    //      PAYMENT_RECEIPT, CONSULTATION_CONFIRMED, TICKET_CREATED, NEWSLETTER_WELCOME
    name: { type: String, required: true },
    description: String,
    subject: { type: String, required: true },
    html: { type: String, required: true },  // full HTML with {{variable}} placeholders
    plainText: String,

    // Documented variables the template supports (for admin UI)
    variables: [{ key: String, description: String, example: String }],

    category: {
      type: String,
      enum: ['auth', 'order', 'payment', 'chat', 'ticket', 'consultation', 'marketing', 'system'],
      default: 'system',
    },

    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false }, // cannot be deleted if true

    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);
export default EmailTemplate;
