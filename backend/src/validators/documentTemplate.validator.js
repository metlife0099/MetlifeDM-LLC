import { z } from 'zod';
import { DOCUMENT_TYPES, DOCUMENT_THEMES } from '../utils/constants.js';

const documentTemplateFields = z.object({
  documentType: z.enum(Object.values(DOCUMENT_TYPES)),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional(),
  // HTML from RichEditor — generous ceiling since multi-page rich content plus
  // markup overhead is expected (see pdfHtmlRenderer.js's pagination).
  bodyContent: z.string().trim().min(1).max(50000),
  variables: z.array(z.object({
    key: z.string().trim().min(1).max(60),
    description: z.string().trim().max(200).optional(),
    example: z.string().trim().max(200).optional(),
  })).max(50).optional(),
  theme: z.enum(Object.values(DOCUMENT_THEMES)).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const createTemplateSchema = documentTemplateFields;
export const updateTemplateSchema = documentTemplateFields.partial();
