import mongoose from 'mongoose';
import { DOCUMENT_TYPES } from '../utils/constants.js';

const { Schema } = mongoose;

/**
 * Reusable content template per document type. bodyContent is plain text with
 * {{placeholder}} tokens (not HTML) — pdfkit has no HTML renderer, so template
 * bodies are resolved by simple string substitution, mirroring the exact
 * convention already used by EmailTemplate.model.js.
 */
const documentTemplateSchema = new Schema(
  {
    documentType: { type: String, enum: Object.values(DOCUMENT_TYPES), required: true, index: true },
    name: { type: String, required: true },
    description: String,

    bodyContent: { type: String, required: true }, // e.g. "This is to certify that {{employeeName}}..."
    // Documented tokens the body/UI can reference — mirrors EmailTemplate.model.js's `variables`.
    variables: [{ key: String, description: String, example: String }],
    // Optional structured extra sections, e.g. a responsibilities table.
    sections: [{ heading: String, items: [String] }],

    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

documentTemplateSchema.index({ documentType: 1, isActive: 1 });

const DocumentTemplate = mongoose.model('DocumentTemplate', documentTemplateSchema);
export default DocumentTemplate;
