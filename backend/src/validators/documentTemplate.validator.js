import { z } from 'zod';
import { DOCUMENT_TYPES } from '../utils/constants.js';

const documentTemplateFields = z.object({
  documentType: z.enum(Object.values(DOCUMENT_TYPES)),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(500).optional(),
  bodyContent: z.string().trim().min(1).max(8000),
  variables: z.array(z.object({
    key: z.string().trim().min(1).max(60),
    description: z.string().trim().max(200).optional(),
    example: z.string().trim().max(200).optional(),
  })).max(50).optional(),
  sections: z.array(z.object({
    heading: z.string().trim().max(160),
    items: z.array(z.string().trim().max(300)).max(50),
  })).max(20).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const createTemplateSchema = documentTemplateFields;
export const updateTemplateSchema = documentTemplateFields.partial();
