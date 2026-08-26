import dayjs from 'dayjs';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Document, DocumentTemplate, Settings, AuditLog } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { toSlug } from '../utils/helpers.js';
import { DOCUMENT_STATUS, DOCUMENT_TYPES, PROJECT_DOCUMENT_TYPES } from '../utils/constants.js';
import cloudinary, { uploadToCloudinary } from '../config/cloudinary.js';
import { config } from '../config/index.js';
import { generateCertificatePdf } from '../services/certificatePdf.service.js';
import { issueDocumentIdentifiers } from '../services/documentNumber.service.js';
import { generateVerifyQrDataUrl, verifyUrl } from '../services/qr.service.js';
import { logAudit } from '../services/audit.service.js';

const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.EXPERIENCE_CERTIFICATE]: 'Experience Certificate',
  [DOCUMENT_TYPES.EXPERIENCE_LETTER]: 'Experience Letter',
  [DOCUMENT_TYPES.OFFER_LETTER]: 'Offer / Appointment Letter',
  [DOCUMENT_TYPES.RECOMMENDATION_LETTER]: 'Letter of Recommendation',
  [DOCUMENT_TYPES.PROJECT_COMPLETION_CERTIFICATE]: 'Project Completion Certificate',
  [DOCUMENT_TYPES.INTERNSHIP_CERTIFICATE]: 'Internship Certificate',
  [DOCUMENT_TYPES.APPRECIATION_LETTER]: 'Appreciation Letter',
  [DOCUMENT_TYPES.RELIEVING_LETTER]: 'Relieving Letter',
  [DOCUMENT_TYPES.EMPLOYMENT_VERIFICATION_LETTER]: 'Employment Verification Letter',
};

const formatDate = (d) => (d ? dayjs(d).format('MMMM D, YYYY') : '');

const resolveSignatory = (settings, signatoryId) => {
  const list = settings.business?.signatories || [];
  const match =
    (signatoryId && list.find((s) => String(s._id) === String(signatoryId))) ||
    list.find((s) => s.isDefault) ||
    list[0];
  if (!match) return { name: 'Authorized Signatory', title: '', signatureImageUrl: null };
  return { name: match.name, title: match.title, signatureImageUrl: match.signatureImage?.url || null };
};

const buildTokenValues = (fields, issueDate) => ({
  employeeName: fields.employeeName || '',
  employeeId: fields.employeeId || '',
  designation: fields.designation || '',
  department: fields.department || '',
  joiningDate: formatDate(fields.joiningDate),
  endDate: fields.isCurrentlyEmployed ? 'Present' : formatDate(fields.endDate),
  projectName: fields.projectName || '',
  projectDescription: fields.projectDescription || '',
  issueDate: formatDate(issueDate),
});

const renderTemplateBody = (bodyContent, tokenValues) =>
  bodyContent.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (tokenValues[key] !== undefined ? tokenValues[key] : ''));

/**
 * Shared by issueDocument and replaceDocument — resolves the template and
 * signatory, freezes a snapshot, generates the number/token/PDF, uploads it,
 * and transitions the document to `issued`. Never called directly by a route.
 */
const performIssue = async (doc, { signatoryId, issueDate, actor }) => {
  const settings = await Settings.getGlobal();
  const template = await DocumentTemplate.findOne({ documentType: doc.documentType, isActive: true }).sort({
    isDefault: -1,
    createdAt: -1,
  });
  if (!template) {
    throw ApiError.badRequest('No active template configured for this document type — create one in Document Templates first');
  }

  const finalIssueDate = issueDate || new Date();
  const fields = doc.fields?.toObject ? doc.fields.toObject() : doc.fields || {};
  const tokenValues = buildTokenValues(fields, finalIssueDate);
  const signatory = resolveSignatory(settings, signatoryId);
  const primaryAddress = settings.contact?.addresses?.find((a) => a.isPrimary) || settings.contact?.addresses?.[0];

  const snapshot = {
    documentTypeLabel: DOCUMENT_TYPE_LABELS[doc.documentType],
    recipientName: fields.employeeName,
    employeeId: fields.employeeId,
    designation: fields.designation,
    department: fields.department,
    projectName: fields.projectName,
    responsibilities: fields.responsibilities || [],
    technologies: fields.technologies || [],
    renderedBody: renderTemplateBody(template.bodyContent, tokenValues),
    issueDate: finalIssueDate,
    signatory,
    company: {
      name: settings.site?.name,
      tagline: settings.site?.tagline,
      logoUrl: settings.site?.logo?.url,
      sealImageUrl: settings.business?.sealImage?.url,
      email: settings.contact?.email,
      phone: settings.contact?.phone,
      website: config.urls.client,
      addressLine: primaryAddress ? [primaryAddress.city, primaryAddress.state].filter(Boolean).join(', ') : undefined,
    },
  };

  const { documentNumber, verificationToken } = await issueDocumentIdentifiers(doc.documentType, finalIssueDate);

  const pdfBuffer = await generateCertificatePdf({
    document: { documentNumber, verificationToken, snapshot },
    settings: settings.toObject(),
  });

  const upload = await uploadToCloudinary(pdfBuffer, {
    folder: 'metlifedm/documents',
    resource_type: 'raw',
    type: 'authenticated',
    public_id: toSlug(documentNumber),
    format: 'pdf',
    quality: undefined,
    fetch_format: undefined,
  });

  doc.documentNumber = documentNumber;
  doc.verificationToken = verificationToken;
  doc.snapshot = snapshot;
  doc.templateUsed = template._id;
  doc.pdfPublicId = upload.public_id;
  doc.issuedBy = actor._id;
  doc.issuedAt = finalIssueDate;
  doc.updatedBy = actor._id;
  doc.pushStatus(DOCUMENT_STATUS.ISSUED, 'Approved and issued', actor._id);
  await doc.save();
  return doc;
};

export const listDocuments = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.documentType) filter.documentType = req.query.documentType;
  if (req.query.status) filter.status = req.query.status;
  if (opts.search) {
    filter.$or = [
      { documentNumber: { $regex: opts.search, $options: 'i' } },
      { 'fields.employeeName': { $regex: opts.search, $options: 'i' } },
      { 'snapshot.recipientName': { $regex: opts.search, $options: 'i' } },
    ];
  }
  const { items, meta } = await paginate(Document, filter, opts);
  return ApiResponse.ok(res, items, 'Documents', meta);
});

export const getDocumentStats = asyncHandler(async (req, res) => {
  const [total, draft, issued, revoked, cancelled, replaced, recent] = await Promise.all([
    Document.countDocuments({}),
    Document.countDocuments({ status: DOCUMENT_STATUS.DRAFT }),
    Document.countDocuments({ status: DOCUMENT_STATUS.ISSUED }),
    Document.countDocuments({ status: DOCUMENT_STATUS.REVOKED }),
    Document.countDocuments({ status: DOCUMENT_STATUS.CANCELLED }),
    Document.countDocuments({ status: DOCUMENT_STATUS.REPLACED }),
    Document.find({ status: { $ne: DOCUMENT_STATUS.DRAFT } })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('documentType documentNumber status fields.employeeName snapshot.recipientName issuedAt createdAt'),
  ]);
  return ApiResponse.ok(res, { total, draft, issued, valid: issued, revoked, cancelled, replaced, recent }, 'Document stats');
});

export const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');
  return ApiResponse.ok(res, { document }, 'Document');
});

export const createDocument = asyncHandler(async (req, res) => {
  const document = await Document.create({
    documentType: req.body.documentType,
    fields: req.body.fields,
    status: DOCUMENT_STATUS.DRAFT,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  await logAudit({
    action: 'document.create',
    actorId: req.user._id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    resource: 'document',
    resourceId: document._id,
    severity: 'info',
  });
  return ApiResponse.created(res, { document }, 'Document draft created');
});

export const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');
  if (document.status !== DOCUMENT_STATUS.DRAFT) {
    throw ApiError.badRequest('Only draft documents can be edited — issued documents are immutable');
  }
  const before = { documentType: document.documentType, fields: document.fields };
  if (req.body.documentType) document.documentType = req.body.documentType;
  if (req.body.fields) document.fields = { ...document.fields.toObject(), ...req.body.fields };
  document.updatedBy = req.user._id;
  await document.save();
  await logAudit({
    action: 'document.update',
    actorId: req.user._id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    resource: 'document',
    resourceId: document._id,
    changes: { before, after: { documentType: document.documentType, fields: document.fields } },
    severity: 'info',
  });
  return ApiResponse.ok(res, { document }, 'Document updated');
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');
  if (document.status !== DOCUMENT_STATUS.DRAFT) throw ApiError.badRequest('Only draft documents can be deleted');
  await document.deleteOne();
  return ApiResponse.ok(res, null, 'Draft deleted');
});

export const issueDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');
  if (document.status !== DOCUMENT_STATUS.DRAFT) throw ApiError.badRequest('Only draft documents can be issued');

  await performIssue(document, { signatoryId: req.body.signatoryId, issueDate: req.body.issueDate, actor: req.user });

  await logAudit({
    action: 'document.issue',
    actorId: req.user._id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    resource: 'document',
    resourceId: document._id,
    metadata: { documentNumber: document.documentNumber },
    severity: 'warning',
  });

  const { pdfPublicId: _pdfPublicId, ...safeDocument } = document.toObject();
  return ApiResponse.ok(res, { document: safeDocument }, 'Document issued');
});

export const revokeDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');
  if (document.status !== DOCUMENT_STATUS.ISSUED) throw ApiError.badRequest('Only issued documents can be revoked');
  document.pushStatus(DOCUMENT_STATUS.REVOKED, req.body.reason, req.user._id);
  document.updatedBy = req.user._id;
  await document.save();
  await logAudit({
    action: 'document.revoke',
    actorId: req.user._id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    resource: 'document',
    resourceId: document._id,
    changes: { after: { reason: req.body.reason } },
    severity: 'critical',
  });
  return ApiResponse.ok(res, { document }, 'Document revoked');
});

export const cancelDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');
  if (document.status !== DOCUMENT_STATUS.ISSUED) throw ApiError.badRequest('Only issued documents can be cancelled');
  document.pushStatus(DOCUMENT_STATUS.CANCELLED, req.body.reason, req.user._id);
  document.updatedBy = req.user._id;
  await document.save();
  await logAudit({
    action: 'document.cancel',
    actorId: req.user._id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    resource: 'document',
    resourceId: document._id,
    changes: { after: { reason: req.body.reason } },
    severity: 'critical',
  });
  return ApiResponse.ok(res, { document }, 'Document cancelled');
});

export const replaceDocument = asyncHandler(async (req, res) => {
  const oldDocument = await Document.findById(req.params.id);
  if (!oldDocument) throw ApiError.notFound('Document not found');
  if (oldDocument.status !== DOCUMENT_STATUS.ISSUED) throw ApiError.badRequest('Only issued documents can be replaced');

  // Create + issue the replacement first — if this fails, the original
  // document is left untouched rather than ending up replaced with nothing
  // to point to.
  const newDocument = await Document.create({
    documentType: oldDocument.documentType,
    fields: req.body.fields || oldDocument.fields,
    status: DOCUMENT_STATUS.DRAFT,
    createdBy: req.user._id,
    updatedBy: req.user._id,
    replaces: oldDocument._id,
  });
  await performIssue(newDocument, { actor: req.user });

  oldDocument.replacedBy = newDocument._id;
  oldDocument.updatedBy = req.user._id;
  oldDocument.pushStatus(DOCUMENT_STATUS.REPLACED, req.body.reason, req.user._id);
  await oldDocument.save();

  await logAudit({
    action: 'document.replace',
    actorId: req.user._id,
    actorEmail: req.user.email,
    actorRole: req.user.role,
    resource: 'document',
    resourceId: oldDocument._id,
    changes: { after: { reason: req.body.reason, replacedBy: newDocument._id } },
    severity: 'critical',
  });

  const { pdfPublicId: _pdfPublicId, ...safeNewDocument } = newDocument.toObject();
  return ApiResponse.ok(res, { oldDocument, newDocument: safeNewDocument }, 'Document replaced');
});

export const downloadDocumentPdf = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id).select('+pdfPublicId');
  if (!document) throw ApiError.notFound('Document not found');
  if (!document.pdfPublicId) throw ApiError.badRequest('This document has not been issued yet');

  const url = cloudinary.url(document.pdfPublicId, { resource_type: 'raw', type: 'authenticated', sign_url: true });
  const response = await fetch(url);
  if (!response.ok) throw ApiError.internal('Failed to retrieve the document PDF');
  const buffer = Buffer.from(await response.arrayBuffer());

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${document.documentNumber}.pdf"`);
  res.setHeader('Content-Length', buffer.length);
  return res.send(buffer);
});

export const getDocumentQrPreview = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');
  if (!document.verificationToken) throw ApiError.badRequest('This document has not been issued yet');
  const qrCode = await generateVerifyQrDataUrl(document.verificationToken);
  return ApiResponse.ok(res, { qrCode, verifyUrl: verifyUrl(document.verificationToken) }, 'QR preview');
});

export const getDocumentAuditHistory = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document not found');
  const history = await AuditLog.find({ resource: 'document', resourceId: document._id }).sort({ createdAt: -1 }).lean();
  return ApiResponse.ok(res, { history }, 'Audit history');
});

/* Public — GET /verify/:identifier. Never throws for "not found"; always
 * returns the same response shape so a bad guess is indistinguishable from a
 * legitimately-absent record. Only an explicit allowlist of fields is ever
 * returned — never the raw document. */
export const verifyDocument = asyncHandler(async (req, res) => {
  const identifier = req.params.identifier;
  const document = await Document.findOne({
    $or: [{ verificationToken: identifier }, { documentNumber: identifier }],
    status: { $ne: DOCUMENT_STATUS.DRAFT },
  });

  if (!document) {
    return ApiResponse.ok(res, { status: 'not_found' }, 'Verification result');
  }

  const snapshot = document.snapshot || {};
  const payload = {
    status: document.status === DOCUMENT_STATUS.ISSUED ? 'valid' : document.status,
    documentType: document.documentType,
    documentNumber: document.documentNumber,
    recipientName: snapshot.recipientName,
    designation: snapshot.designation,
    projectName: PROJECT_DOCUMENT_TYPES.includes(document.documentType) ? snapshot.projectName : undefined,
    issueDate: document.issuedAt,
    issuingOrganization: snapshot.company?.name || 'MetlifeDM LLC',
    verifiedAt: new Date(),
  };
  return ApiResponse.ok(res, payload, 'Verification result');
});
