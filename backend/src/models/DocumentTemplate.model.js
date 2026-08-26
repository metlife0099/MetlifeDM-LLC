import mongoose from 'mongoose';
import { DOCUMENT_TYPES, DOCUMENT_THEMES } from '../utils/constants.js';

const { Schema } = mongoose;

/**
 * Reusable content template per document type. bodyContent is real HTML,
 * authored via the admin RichEditor (TipTap), with {{placeholder}} tokens
 * substituted as plain text before rendering — the tokens live inside <p>
 * text nodes, so simple string substitution on the raw HTML works the same
 * way it would on plain text. Rendered to PDF by
 * backend/src/services/pdfHtmlRenderer.js, which walks a constrained tag set
 * (p, h1-h3, ul/ol>li, blockquote, hr, br + inline marks).
 */
const documentTemplateSchema = new Schema(
  {
    documentType: { type: String, enum: Object.values(DOCUMENT_TYPES), required: true, index: true },
    name: { type: String, required: true },
    description: String,

    bodyContent: { type: String, required: true }, // HTML, e.g. "<p>This is to certify that <strong>{{employeeName}}</strong>...</p>"
    // Documented tokens the body/UI can reference — mirrors EmailTemplate.model.js's `variables`.
    variables: [{ key: String, description: String, example: String }],
    // Visual layout for the generated PDF — see pdfHtmlRenderer.js / certificatePdf.service.js.
    theme: { type: String, enum: Object.values(DOCUMENT_THEMES), default: DOCUMENT_THEMES.CLASSIC },

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
