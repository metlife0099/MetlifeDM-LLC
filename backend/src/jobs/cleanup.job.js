import cron from 'node-cron';
import { User, Notification, AuditLog, Campaign, Order } from '../models/index.js';
import logger from '../config/logger.js';
import { cancelOrderPayment } from '../services/stripe.service.js';
import { releaseCouponReservation } from '../services/coupon.service.js';
import { ORDER_STATUS } from '../utils/constants.js';

/**
 * Cancel the provider object before releasing a timed-out coupon reservation.
 * A failed Stripe cancellation intentionally leaves the reservation in place:
 * capacity must never be reallocated while the old intent remains payable.
 */
export const expireAbandonedCheckouts = async (now = new Date()) => {
  const orders = await Order.find({
    paymentExpiresAt: { $lte: now },
    status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.FAILED] },
  }).limit(100);
  let expired = 0;
  for (const order of orders) {
    try {
      await cancelOrderPayment(order);
      const result = await Order.updateOne(
        {
          _id: order._id,
          paymentExpiresAt: { $lte: now },
          status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.FAILED] },
        },
        {
          $set: { status: ORDER_STATUS.FAILED },
          $unset: { paymentExpiresAt: 1, paymentSetupLock: 1 },
          $push: {
            statusHistory: {
              status: ORDER_STATUS.FAILED,
              note: 'Checkout expired; start payment again to continue',
              at: now,
            },
          },
        }
      );
      if (result.modifiedCount) {
        await releaseCouponReservation(order);
        expired += 1;
      }
    } catch (error) {
      logger.error(`Could not expire checkout ${order.orderNumber}: ${error.message}`);
    }
  }
  return expired;
};

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
  cron.schedule('*/5 * * * *', async () => {
    try {
      const expired = await expireAbandonedCheckouts();
      if (expired) logger.info(`Expired ${expired} abandoned checkout(s)`);
    } catch (error) {
      logger.error(`Checkout expiration failed: ${error.message}`);
    }
  });

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
