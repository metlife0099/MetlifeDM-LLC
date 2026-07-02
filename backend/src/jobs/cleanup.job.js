import cron from 'node-cron';
import { User, Notification, AuditLog } from '../models/index.js';
import logger from '../config/logger.js';

/**
 * Nightly 3 AM UTC cleanup:
 * - Expired / revoked refresh tokens > 30 days old
 * - Read notifications > 90 days old
 * - Non-critical audit logs > 1 year old
 */
export const startCleanupJob = () => {
  cron.schedule('0 3 * * *', async () => {
    try {
      const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const cutoff365 = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

      const [tokens, notifs, logs] = await Promise.all([
        User.updateMany(
          {},
          { $pull: { refreshTokens: { $or: [{ expiresAt: { $lt: new Date() } }, { revokedAt: { $lt: cutoff30 } }] } } }
        ),
        Notification.deleteMany({ isRead: true, readAt: { $lt: cutoff90 } }),
        AuditLog.deleteMany({ severity: 'info', createdAt: { $lt: cutoff365 } }),
      ]);

      logger.info(
        `🧹  Cleanup: tokens=${tokens.modifiedCount}, notifs=${notifs.deletedCount}, logs=${logs.deletedCount}`
      );
    } catch (err) {
      logger.error(`Cleanup job failed: ${err.message}`);
    }
  });

  logger.info('⏰  Cleanup job scheduled (daily 3AM UTC)');
};
