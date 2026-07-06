import { emailLayout } from './layout.js';
import { config } from '../../config/index.js';

const brand = (path = '') => `${config.urls.client}${path}`;

export const welcomeEmail = ({ firstName }) =>
  emailLayout({
    title: `Welcome to MetlifeDM, ${firstName} 👋`,
    previewText: 'Your account is ready — grow smarter with MetlifeDM.',
    bodyHtml: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Welcome aboard! You've just joined 200+ USA businesses trusting MetlifeDM to accelerate their growth through SEO, paid media, content, and AI-powered marketing.</p>
      <p>From your dashboard you can:</p>
      <ul style="padding-left:20px;color:#334155;">
        <li>Browse and purchase services</li>
        <li>Book a free 30-minute consultation</li>
        <li>Track orders, invoices, and results</li>
        <li>Chat live with our specialists</li>
      </ul>
      <p>If you have any questions, just reply to this email — we read every message.</p>
    `,
    ctaLabel: 'Go to Dashboard',
    ctaUrl: brand('/dashboard'),
    footerNote: 'Cheers,<br/>The MetlifeDM Team',
  });

export const emailVerificationEmail = ({ firstName, verifyUrl }) =>
  emailLayout({
    title: 'Verify your email',
    previewText: 'One click to activate your MetlifeDM account.',
    bodyHtml: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Please confirm your email address by clicking the button below. This link expires in 24 hours.</p>
    `,
    ctaLabel: 'Verify Email',
    ctaUrl: verifyUrl,
    footerNote: `If you didn't create an account, you can safely ignore this email.<br/><br/>Trouble with the button? Copy this link:<br/><code style="word-break:break-all;color:#0EA5E9;">${verifyUrl}</code>`,
  });

export const passwordResetEmail = ({ firstName, resetUrl }) =>
  emailLayout({
    title: 'Reset your password',
    previewText: 'Reset link inside — expires in 15 minutes.',
    bodyHtml: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>15 minutes</strong>.</p>
    `,
    ctaLabel: 'Reset Password',
    ctaUrl: resetUrl,
    footerNote: `If you didn't request this, no action is needed — your password stays the same.`,
  });

export const twoFactorCodeEmail = ({ firstName, code }) =>
  emailLayout({
    title: 'Your verification code',
    previewText: `Your MetlifeDM code: ${code}`,
    bodyHtml: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Use the code below to complete your sign-in. It expires in 10 minutes.</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:12px;color:#0F172A;background:#F1F5F9;padding:16px 24px;border-radius:12px;">${code}</span>
      </div>
    `,
    footerNote: `If you didn't try to sign in, please secure your account and contact support.`,
  });

export const orderConfirmationEmail = ({ firstName, order }) =>
  emailLayout({
    title: `Order confirmed — ${order.orderNumber}`,
    previewText: `Thanks for your order, ${firstName}!`,
    bodyHtml: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Thanks for choosing MetlifeDM. Your order <strong>${order.orderNumber}</strong> is confirmed.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border:1px solid #E2E8F0;border-radius:12px;">
        ${order.items
          .map(
            (i) => `<tr>
            <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;">${i.serviceName} <span style="color:#64748B;">× ${i.quantity}</span></td>
            <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;text-align:right;">$${i.subtotal.toFixed(2)}</td>
          </tr>`
          )
          .join('')}
        <tr>
          <td style="padding:12px 16px;font-weight:600;">Total</td>
          <td style="padding:12px 16px;text-align:right;font-weight:700;color:#1E40AF;">$${order.total.toFixed(2)} ${order.currency}</td>
        </tr>
      </table>
    `,
    ctaLabel: 'View Order',
    ctaUrl: brand(`/dashboard/orders/${order._id}`),
  });

export const paymentReceiptEmail = ({ firstName, payment, order }) =>
  emailLayout({
    title: `Payment received — ${payment.invoiceNumber}`,
    previewText: `Receipt for $${payment.amount.toFixed(2)}`,
    bodyHtml: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>We've received your payment of <strong>$${payment.amount.toFixed(2)} ${payment.currency}</strong> for order <strong>${order.orderNumber}</strong>. Invoice <strong>${payment.invoiceNumber}</strong> is attached to your account.</p>
    `,
    ctaLabel: 'Download Invoice',
    ctaUrl: brand(`/dashboard/invoices/${payment._id}`),
  });

export const consultationConfirmedEmail = ({ firstName, consultation }) =>
  emailLayout({
    title: 'Your consultation is confirmed 🎉',
    previewText: 'We can\'t wait to meet you.',
    bodyHtml: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your <strong>${consultation.durationMinutes}-minute strategy call</strong> is confirmed for:</p>
      <p style="font-size:16px;background:#F1F5F9;padding:16px;border-radius:12px;">
        📅 ${new Date(consultation.preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br/>
        🕐 ${consultation.preferredTimeSlot} (${consultation.timezone})<br/>
        📍 ${consultation.meetingType.replace('_', ' ')}
      </p>
      ${consultation.meetingLink ? `<p>Join here: <a href="${consultation.meetingLink}">${consultation.meetingLink}</a></p>` : ''}
      <p>We'll send a reminder 24 hours before the call.</p>
    `,
    ctaLabel: 'Add to Calendar',
    ctaUrl: brand(`/consultation/${consultation._id}/calendar`),
  });

export const contactReceivedEmail = ({ firstName }) =>
  emailLayout({
    title: `Thanks for reaching out, ${firstName}!`,
    previewText: 'We\'ll get back to you within 4 business hours.',
    bodyHtml: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Thanks for contacting MetlifeDM. A member of our team will reply within <strong>4 business hours</strong>.</p>
      <p>In the meantime, feel free to explore our case studies to see how we've helped US businesses like yours scale.</p>
    `,
    ctaLabel: 'View Case Studies',
    ctaUrl: brand('/case-studies'),
  });

export const ticketCreatedEmail = ({ firstName, ticket }) =>
  emailLayout({
    title: `Support ticket ${ticket.ticketNumber} opened`,
    previewText: 'We\'ve received your request.',
    bodyHtml: `
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your support ticket <strong>${ticket.ticketNumber}</strong> has been opened. Our team will respond within our standard SLA window.</p>
      <p><strong>Subject:</strong> ${ticket.subject}</p>
    `,
    ctaLabel: 'View Ticket',
    ctaUrl: brand(`/dashboard/tickets/${ticket._id}`),
  });

export const newsletterWelcomeEmail = () =>
  emailLayout({
    title: 'You\'re in the loop 📬',
    previewText: 'Growth insights, delivered.',
    bodyHtml: `
      <p>Thanks for subscribing to the MetlifeDM newsletter.</p>
      <p>Every week we send actionable insights on SEO, paid ads, content strategy, and AI-powered marketing — the exact playbooks we use for our US clients.</p>
    `,
    ctaLabel: 'Explore the Blog',
    ctaUrl: brand('/blog'),
  });

export const campaignEmail = ({ subject, preheader, bodyHtml, unsubscribeUrl }) =>
  emailLayout({
    title: subject,
    previewText: preheader || '',
    bodyHtml,
    unsubscribeUrl,
    footerNote: "You're receiving this because you subscribed to MetlifeDM LLC updates.",
  });

export const adminNewLeadEmail = ({ lead, type }) =>
  emailLayout({
    title: `🚨 New ${type} lead`,
    previewText: `${lead.firstName} ${lead.lastName || ''} · ${lead.email}`,
    bodyHtml: `
      <p><strong>${lead.firstName} ${lead.lastName || ''}</strong> just submitted a ${type} form.</p>
      <table role="presentation" width="100%" style="border-collapse:collapse;margin-top:12px;">
        <tr><td style="padding:6px 0;color:#64748B;">Email</td><td>${lead.email}</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;">Phone</td><td>${lead.phone || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;">Company</td><td>${lead.company || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#64748B;">Message</td><td>${lead.message || lead.subject || lead.projectGoals || '—'}</td></tr>
      </table>
    `,
    ctaLabel: 'Open in Admin',
    ctaUrl: `${config.urls.admin}/leads`,
  });
