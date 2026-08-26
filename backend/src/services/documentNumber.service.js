import crypto from 'node:crypto';
import { Counter } from '../models/index.js';
import { DOCUMENT_TYPE_CODES } from '../utils/constants.js';

/**
 * Generates a document's public number and verification token — only ever
 * called at issue time. This is the single place this logic lives; nothing
 * else should build a document number or token directly.
 */
export const issueDocumentIdentifiers = async (documentType, issueDate = new Date()) => {
  const year = issueDate.getFullYear();
  const code = DOCUMENT_TYPE_CODES[documentType];
  const seq = await Counter.getNextSeq(`${code}-${year}`);
  const documentNumber = `MLDM/${code}/${year}/${String(seq).padStart(4, '0')}`;
  const verificationToken = crypto.randomBytes(24).toString('hex');
  return { documentNumber, verificationToken };
};
