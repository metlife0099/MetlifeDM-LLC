import * as SibApiV3Sdk from '@sendinblue/client';
import { config } from './index.js';
import logger from './logger.js';

// Sends via Brevo's HTTPS API rather than raw SMTP. PaaS hosts (Render
// included) frequently block or throttle outbound SMTP ports (587/465),
// which surfaces as "Connection timeout" even though credentials are fine —
// the API only needs outbound HTTPS, which is never blocked.
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
if (config.mail.apiKey) {
  apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, config.mail.apiKey);
} else {
  logger.warn('⚠️  BREVO_API_KEY not set — transactional emails will fail');
}

const toRecipients = (value) => (Array.isArray(value) ? value : [value]).filter(Boolean).map((email) => ({ email }));

/**
 * Send a transactional email.
 * @param {Object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 * @param {Object[]} [opts.attachments] - [{ name, content|url }]
 */
export const sendEmail = async ({ to, subject, html, text, attachments, cc, bcc }) => {
  const payload = {
    sender: { name: config.mail.from.name, email: config.mail.from.address },
    replyTo: { email: config.mail.replyTo },
    to: toRecipients(to),
    subject,
    htmlContent: html,
    textContent: text || html.replace(/<[^>]*>/g, ''),
  };
  if (cc) payload.cc = toRecipients(cc);
  if (bcc) payload.bcc = toRecipients(bcc);
  if (attachments?.length) {
    payload.attachment = attachments.map((a) => ({
      name: a.name || a.filename,
      content: a.content,
      url: a.url || a.path,
    }));
  }

  try {
    const { body } = await apiInstance.sendTransacEmail(payload);
    logger.info(`📧  Email sent → ${to} | ${body?.messageId}`);
    return body;
  } catch (err) {
    const message = err?.response?.body?.message || err.message;
    logger.error(`❌  Email send failed → ${to}: ${message}`);
    throw new Error(message);
  }
};

export default apiInstance;
