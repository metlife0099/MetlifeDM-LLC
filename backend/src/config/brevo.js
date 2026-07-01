import nodemailer from 'nodemailer';
import { config } from './index.js';
import logger from './logger.js';

const transporter = nodemailer.createTransport({
  host: config.mail.smtp.host,
  port: config.mail.smtp.port,
  secure: config.mail.smtp.port === 465,
  auth: {
    user: config.mail.smtp.user,
    pass: config.mail.smtp.pass,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

// Verify on startup (non-blocking)
transporter
  .verify()
  .then(() => logger.info('✅  Brevo SMTP verified'))
  .catch((err) => logger.warn(`⚠️  Brevo SMTP verification failed: ${err.message}`));

/**
 * Send a transactional email.
 * @param {Object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 * @param {Object[]} [opts.attachments]
 */
export const sendEmail = async ({ to, subject, html, text, attachments, cc, bcc }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${config.mail.from.name}" <${config.mail.from.address}>`,
      replyTo: config.mail.replyTo,
      to: Array.isArray(to) ? to.join(',') : to,
      cc,
      bcc,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      attachments,
    });
    logger.info(`📧  Email sent → ${to} | ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`❌  Email send failed → ${to}: ${err.message}`);
    throw err;
  }
};

export default transporter;
