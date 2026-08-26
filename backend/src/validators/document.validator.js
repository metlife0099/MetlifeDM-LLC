import { z } from 'zod';
import { objectId } from './user.validator.js';
import { DOCUMENT_TYPES, PROJECT_DOCUMENT_TYPES } from '../utils/constants.js';

const documentFields = z.object({
  employeeName: z.string().trim().min(1).max(160).optional(),
  employeeId: z.string().trim().max(60).optional(),
  designation: z.string().trim().max(160).optional(),
  department: z.string().trim().max(160).optional(),
  joiningDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isCurrentlyEmployed: z.boolean().optional(),
  projectName: z.string().trim().max(200).optional(),
  projectDescription: z.string().trim().max(4000).optional(),
  responsibilities: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
  technologies: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  additionalNotes: z.string().trim().max(2000).optional(),
});

const fieldCrossChecks = (data, context) => {
  if (PROJECT_DOCUMENT_TYPES.includes(data.documentType)) {
    if (!data.fields?.projectName) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['fields', 'projectName'], message: 'Project name is required for this document type' });
    }
    if (!data.fields?.projectDescription) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['fields', 'projectDescription'], message: 'Project description is required for this document type' });
    }
  }
  if (!data.fields?.employeeName) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['fields', 'employeeName'], message: 'Recipient name is required' });
  }
};

const documentBaseSchema = z.object({
  documentType: z.enum(Object.values(DOCUMENT_TYPES)),
  fields: documentFields.default({}),
});

export const createDocumentSchema = documentBaseSchema.superRefine(fieldCrossChecks);

// Partial update — documentType may still be present (unchanged), so cross-checks
// only run when both documentType and fields are provided.
export const updateDocumentSchema = z
  .object({
    documentType: z.enum(Object.values(DOCUMENT_TYPES)).optional(),
    fields: documentFields.optional(),
  })
  .superRefine((data, context) => {
    if (data.documentType && data.fields) fieldCrossChecks(data, context);
  });

export const issueDocumentSchema = z.object({
  signatoryId: objectId.optional(),
  issueDate: z.coerce.date().optional(),
});

export const reasonSchema = z.object({
  reason: z.string().trim().min(10, 'Please provide a reason of at least 10 characters').max(1000),
});

export const replaceDocumentSchema = reasonSchema.extend({
  fields: documentFields.optional(),
});
