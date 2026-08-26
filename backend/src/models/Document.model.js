import mongoose from 'mongoose';
import { DOCUMENT_TYPES, DOCUMENT_STATUS } from '../utils/constants.js';

const { Schema } = mongoose;

// Editable content while status === draft. Kept as a defined (not Mixed)
// sub-schema for clarity — every field is optional here because required-ness
// varies per documentType and is enforced by the Zod validator instead.
const documentFieldsSchema = new Schema(
  {
    employeeName: String,
    employeeId: String,
    designation: String,
    department: String,
    joiningDate: Date,
    endDate: Date,
    isCurrentlyEmployed: Boolean,
    projectName: String,
    projectDescription: String,
    responsibilities: [String],
    technologies: [String],
    additionalNotes: String,
  },
  { _id: false }
);

// Mirrors Order.model.js's statusHistory pattern exactly.
const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: Object.values(DOCUMENT_STATUS) },
    note: String,
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new Schema(
  {
    documentType: { type: String, enum: Object.values(DOCUMENT_TYPES), required: true, index: true },

    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.DRAFT,
      index: true,
    },
    statusHistory: [statusHistorySchema],

    // Set only at issue time — MLDM/{CODE}/{YEAR}/{seq}. Null while draft.
    documentNumber: { type: String, unique: true, sparse: true, index: true },
    // Separate, unguessable identifier for public verification. Null while draft.
    verificationToken: { type: String, unique: true, sparse: true, index: true },

    // Live/editable values while draft.
    fields: { type: documentFieldsSchema, default: () => ({}) },

    // Frozen, fully-resolved copy taken at issue time — the PDF and every
    // public verify response are built from this, never from `fields` or the
    // live template/Settings, so an issued certificate never silently changes.
    snapshot: { type: Schema.Types.Mixed, default: null },

    templateUsed: { type: Schema.Types.ObjectId, ref: 'DocumentTemplate' },

    // Cloudinary identifiers for the generated PDF (authenticated delivery —
    // never sent to any client; downloads are always proxied server-side).
    pdfPublicId: { type: String, select: false },

    replaces: { type: Schema.Types.ObjectId, ref: 'Document' },
    replacedBy: { type: Schema.Types.ObjectId, ref: 'Document' },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    issuedAt: Date,
  },
  { timestamps: true }
);

documentSchema.index({ documentType: 1, status: 1 });
documentSchema.index({ createdAt: -1 });

documentSchema.methods.pushStatus = function (status, note, changedBy) {
  this.status = status;
  this.statusHistory.push({ status, note, changedBy });
};

const Document = mongoose.model('Document', documentSchema);
export default Document;
