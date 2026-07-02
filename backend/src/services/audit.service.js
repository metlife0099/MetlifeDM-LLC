import { AuditLog } from '../models/index.js';
import logger from '../config/logger.js';

/**
 * Record an admin action for compliance / accountability.
 * @param {Object} params
 * @param {string} params.action - e.g. 'user.update', 'order.refund'
 * @param {string} params.actorId - The admin performing the action
 * @param {string} params.actorEmail
 * @param {string} params.resourceType
 * @param {string} params.resourceId
 * @param {Object} [params.changes]  { before, after, fields }
 * @param {string} [params.ip]
 * @param {string} [params.userAgent]
 * @param {string} [params.severity]  info|warning|critical
 */
export const logAudit = async (params) => {
  try {
    await AuditLog.create({
      action: params.action,
      actor: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      changes: params.changes,
      ipAddress: params.ip,
      userAgent: params.userAgent,
      severity: params.severity || 'info',
      status: 'success',
    });
  } catch (err) {
    logger.warn(`Audit log failed: ${err.message}`);
  }
};

export default logAudit;
