import { sendEmail } from '../config/brevo.js';
import logger from '../config/logger.js';
import * as tpl from '../templates/emails/index.js';
import { config } from '../config/index.js';

const withRetry = async (fn, retries = 2) => {
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries) throw err;
      logger.warn(`Email retry ${i + 1}/${retries}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
  return null;
};

const send = async ({ to, subject, html }) => withRetry(() => sendEmail({ to, subject, html }));

export const emailService = {
  welcome: (user) =>
    send({ to: user.email, subject: 'Welcome to MetlifeDM 👋', html: tpl.welcomeEmail(user) }),

  emailVerification: (user, token) => {
    const verifyUrl = `${config.urls.client}/verify-email?token=${token}`;
    return send({
      to: user.email,
      subject: 'Verify your MetlifeDM email',
      html: tpl.emailVerificationEmail({ firstName: user.firstName, verifyUrl }),
    });
  },

  passwordReset: (user, token) => {
    const resetUrl = `${config.urls.client}/reset-password?token=${token}`;
    return send({
      to: user.email,
      subject: 'Reset your MetlifeDM password',
      html: tpl.passwordResetEmail({ firstName: user.firstName, resetUrl }),
    });
  },

  twoFactorCode: (user, code) =>
    send({
      to: user.email,
      subject: `Your verification code: ${code}`,
      html: tpl.twoFactorCodeEmail({ firstName: user.firstName, code }),
    }),

  orderConfirmation: (user, order) =>
    send({
      to: user.email,
      subject: `Order confirmed — ${order.orderNumber}`,
      html: tpl.orderConfirmationEmail({ firstName: user.firstName, order }),
    }),

  paymentReceipt: (user, payment, order) =>
    send({
      to: user.email,
      subject: `Receipt — ${payment.invoiceNumber}`,
      html: tpl.paymentReceiptEmail({ firstName: user.firstName, payment, order }),
    }),

  consultationConfirmed: (user, consultation) =>
    send({
      to: user.email,
      subject: 'Your consultation is confirmed 🎉',
      html: tpl.consultationConfirmedEmail({ firstName: user.firstName, consultation }),
    }),

  contactReceived: (contact) =>
    send({
      to: contact.email,
      subject: 'We received your message',
      html: tpl.contactReceivedEmail({ firstName: contact.firstName }),
    }),

  ticketCreated: (user, ticket) =>
    send({
      to: user.email,
      subject: `Ticket ${ticket.ticketNumber} opened`,
      html: tpl.ticketCreatedEmail({ firstName: user.firstName, ticket }),
    }),

  newsletterWelcome: (email) =>
    send({ to: email, subject: "You're in — MetlifeDM Newsletter", html: tpl.newsletterWelcomeEmail() }),

  notifyAdmins: (lead, type) => {
    const adminEmail = config.mail.replyTo;
    return send({
      to: adminEmail,
      subject: `🚨 New ${type} lead — ${lead.email}`,
      html: tpl.adminNewLeadEmail({ lead, type }),
    });
  },

  /* Marketing campaign blast — used by campaign.controller.js */
  campaignSend: (to, subject, html) => send({ to, subject, html }),
};

export default emailService;
