import cron from 'node-cron';
import { Consultation, User } from '../models/index.js';
import { CONSULTATION_STATUS } from '../utils/constants.js';
import emailService from '../services/email.service.js';
import logger from '../config/logger.js';

/**
 * Every day at 9AM EST, remind customers of consultations happening within the next 24 hours.
 */
export const startConsultationReminderJob = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const toRemind = await Consultation.find({
        status: CONSULTATION_STATUS.CONFIRMED,
        preferredDate: { $gte: now, $lte: in24h },
        reminderSentAt: { $exists: false },
      });

      logger.info(`🔔  Consultation reminders: ${toRemind.length} to send`);
      for (const c of toRemind) {
        emailService.consultationConfirmed({ email: c.email, firstName: c.firstName }, c).catch(() => {});
        c.reminderSentAt = new Date();
        await c.save();
      }
    } catch (err) {
      logger.error(`Consultation reminder job failed: ${err.message}`);
    }
  }, { timezone: 'America/New_York' });

  logger.info('⏰  Consultation reminder job scheduled (daily 9AM EST)');
};
