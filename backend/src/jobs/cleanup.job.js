import cron from 'node-cron';
import { User, Notification, AuditLog, Campaign } from '../models/index.js';
import logger from '../config/logger.js';

/**
 * Campaign sends run out-of-request in-process (no job queue). If the
 * server restarts or crashes mid-send, the campaign is left stuck in
 * 'sending' forever with no worker left to finish it — mark anything
 * that's been "sending" for too long as failed so the admin can resend.
 */
export const recoverInterruptedCampaigns = async (staleAfterMs = 30 * 60 * 1000) => {
  try {
    const cutoff = new Date(Date.now() - staleAfterMs);
    const result = await Campaign.updateMany(
      { status: 'sending', startedAt: { $lt: cutoff } },
      { status: 'failed', errorMessage: 'Interrupted (server restarted mid-send) — please resend.', completedAt: new Date() }
    );
    if (result.modifiedCount > 0) {
      logger.warn(`📣  Recovered ${result.modifiedCount} interrupted campaign send(s)`);
    }
  } catch (err) {
    logger.error(`Campaign recovery failed: ${err.message}`);
  }
};

/**
 * Nightly 3 AM UTC cleanup:
 * - Expired / revoked refresh tokens > 30 days old
 * - Read notifications > 90 days old
 * - Non-critical audit logs > 1 year old
 * - Interrupted campaign sends stuck in 'sending'
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
      await recoverInterruptedCampaigns();

      logger.info(
        `🧹  Cleanup: tokens=${tokens.modifiedCount}, notifs=${notifs.deletedCount}, logs=${logs.deletedCount}`
      );
    } catch (err) {
      logger.error(`Cleanup job failed: ${err.message}`);
    }
  });

  logger.info('⏰  Cleanup job scheduled (daily 3AM UTC)');
};
