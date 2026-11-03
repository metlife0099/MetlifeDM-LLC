import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Quotation, Settings, Counter } from '../models/index.js';
import { config } from '../config/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { generateQuotationPdf } from '../services/quotationPdf.service.js';
import { sendEmail } from '../config/brevo.js';
import { logAudit } from '../services/audit.service.js';

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const calculateQuotationPricing = (body) => {
  const lineItems = body.lineItems.map((item) => ({
    title: item.title,
    description: item.description,
    quantity: Number(item.quantity),
    unitPrice: roundMoney(item.unitPrice),
    amount: roundMoney(Number(item.quantity) * Number(item.unitPrice)),
  }));
  const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0));
  const requestedDiscount = roundMoney(Number(body.discount || 0));
  if (requestedDiscount > subtotal) throw ApiError.badRequest('Discount cannot exceed the quotation subtotal');
  const discount = requestedDiscount;
  const taxable = roundMoney(subtotal - discount);
  const taxRate = Number(body.taxRate || 0);
  const tax = roundMoney(taxable * taxRate / 100);
  return { lineItems, subtotal, discount, taxRate, tax, total: roundMoney(taxable + tax) };
};

const addressLine = (address) => address
  ? [address.line1, address.line2, address.city, address.state, address.zip, address.country]
    .filter(Boolean).join(', ')
  : '';

const resolveBranding = async (signatoryId) => {
  const settings = await Settings.getGlobal();
  const signatories = settings.business?.signatories || [];
  const signatory = (signatoryId && signatories.find((item) => String(item._id) === String(signatoryId)))
    || signatories.find((item) => item.isDefault)
    || signatories[0];
  const configuredCoFounder = signatories.find((item) =>
    /co[ -]?founder/i.test(item.title || '') || /ahad javed shaikh/i.test(item.name || '')
  );
  if (signatoryId && !signatory) throw ApiError.badRequest('Selected signatory no longer exists');
  const primaryAddress = settings.contact?.addresses?.find((item) => item.isPrimary)
    || settings.contact?.addresses?.[0];
  return {
    companyName: settings.business?.registeredName || settings.site?.name || 'MetlifeDM LLC',
    tagline: settings.site?.tagline,
    logoUrl: settings.site?.logo?.url,
    sealImageUrl: settings.business?.sealImage?.url,
    email: settings.contact?.email || config.mail.from.address,
    website: config.urls.client?.replace(/^https?:\/\//, ''),
    address: addressLine(primaryAddress),
    signatory: signatory ? {
      id: signatory._id,
      name: signatory.name,
      title: signatory.title,
      signatureImageUrl: signatory.signatureImage?.url,
    } : { name: 'Authorized Signatory', title: 'MetlifeDM LLC' },
    coFounder: {
      name: configuredCoFounder?.name || 'Ahad Javed Shaikh',
      title: configuredCoFounder?.title || 'Co-Founder',
      signatureImageUrl: configuredCoFounder?.signatureImage?.url || null,
      digitalMark: false,
    },
  };
};

const quotationNumber = async () => {
  const year = new Date().getFullYear();
  const sequence = await Counter.getNextSeq(`QTN-${year}`);
  return `MLDM/QTN/${year}/${String(sequence).padStart(4, '0')}`;
};

const audit = (req, action, quotation, metadata) => logAudit({
  action,
  actorId: req.user._id,
  actorEmail: req.user.email,
  actorRole: req.user.role,
  resource: 'quotation',
  resourceId: quotation._id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  changes: metadata ? { after: metadata } : undefined,
});

const expireOldQuotations = () => Quotation.updateMany(
  { status: { $in: ['draft', 'sent'] }, validUntil: { $lt: new Date() } },
  { $set: { status: 'expired' } }
);

export const list = asyncHandler(async (req, res) => {
  await expireOldQuotations();
  const options = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (options.search) {
    filter.$or = [
      { quotationNumber: { $regex: options.search, $options: 'i' } },
      { projectTitle: { $regex: options.search, $options: 'i' } },
      { 'client.name': { $regex: options.search, $options: 'i' } },
      { 'client.email': { $regex: options.search, $options: 'i' } },
      { 'client.company': { $regex: options.search, $options: 'i' } },
    ];
  }
  const { items, meta } = await paginate(Quotation, filter, options);
  return ApiResponse.ok(res, items, 'Quotations', meta);
});

export const get = asyncHandler(async (req, res) => {
  await expireOldQuotations();
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw ApiError.notFound('Quotation not found');
  return ApiResponse.ok(res, { quotation }, 'Quotation');
});

export const create = asyncHandler(async (req, res) => {
  const pricing = calculateQuotationPricing(req.body);
  const branding = await resolveBranding(req.body.signatoryId || undefined);
  const quotation = await Quotation.create({
    ...req.body,
    ...pricing,
    quotationNumber: await quotationNumber(),
    signatoryId: req.body.signatoryId || undefined,
    branding,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  await audit(req, 'quotation.create', quotation, { quotationNumber: quotation.quotationNumber });
  return ApiResponse.created(res, { quotation }, 'Quotation created');
});

export const update = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw ApiError.notFound('Quotation not found');
  if (quotation.status === 'cancelled') throw ApiError.conflict('Cancelled quotations cannot be edited');
  const pricing = calculateQuotationPricing(req.body);
  const branding = await resolveBranding(req.body.signatoryId || undefined);
  const next = {
    ...req.body,
    ...pricing,
    signatoryId: req.body.signatoryId || undefined,
    branding,
    updatedBy: req.user._id,
    version: quotation.version + 1,
    status: 'draft',
  };
  Object.assign(quotation, next);
  await quotation.save();
  await audit(req, 'quotation.update', quotation, { version: quotation.version });
  return ApiResponse.ok(res, { quotation }, 'Quotation updated');
});

export const remove = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw ApiError.notFound('Quotation not found');
  if (quotation.status === 'sent') throw ApiError.conflict('Sent quotations must be cancelled rather than deleted');
  await quotation.deleteOne();
  await audit(req, 'quotation.delete', quotation, { quotationNumber: quotation.quotationNumber });
  return ApiResponse.ok(res, null, 'Quotation deleted');
});

export const cancel = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw ApiError.notFound('Quotation not found');
  quotation.status = 'cancelled';
  quotation.updatedBy = req.user._id;
  await quotation.save();
  await audit(req, 'quotation.cancel', quotation);
  return ApiResponse.ok(res, { quotation }, 'Quotation cancelled');
});

export const downloadPdf = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw ApiError.notFound('Quotation not found');
  const pdf = await generateQuotationPdf(quotation);
  const filename = `${quotation.quotationNumber.replaceAll('/', '-')}.pdf`;
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': pdf.length,
    'Cache-Control': 'private, no-store',
  });
  res.send(pdf);
});

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const send = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) throw ApiError.notFound('Quotation not found');
  if (quotation.validUntil < new Date() && quotation.status !== 'cancelled') {
    quotation.status = 'expired';
    await quotation.save();
  }
  if (quotation.status === 'cancelled' || quotation.status === 'expired') {
    throw ApiError.conflict('Only current quotations can be sent');
  }
  if (!quotation.branding?.signatory?.signatureImageUrl || !quotation.branding?.sealImageUrl) {
    throw ApiError.badRequest('Configure the CEO signature and company seal under Settings → Documents before sending');
  }

  const pdf = await generateQuotationPdf(quotation);
  const filename = `${quotation.quotationNumber.replaceAll('/', '-')}.pdf`;
  const messageHtml = escapeHtml(req.body.message).replace(/\n/g, '<br>');
  const body = await sendEmail({
    to: req.body.recipientEmail,
    cc: req.body.cc || undefined,
    subject: req.body.subject,
    html: `
      <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.65;max-width:680px;margin:auto">
        <div style="border-top:5px solid #0A2342;padding:28px 4px 10px">
          <h1 style="font-size:20px;margin:0 0 18px;color:#0A2342">${escapeHtml(quotation.projectTitle)}</h1>
          <p style="white-space:normal">${messageHtml}</p>
          <p style="margin-top:24px">The complete quotation <strong>${escapeHtml(quotation.quotationNumber)}</strong> is attached as a PDF.</p>
          <p style="color:#697386;font-size:13px;margin-top:30px">Valid through ${escapeHtml(new Date(quotation.validUntil).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' }))}.</p>
        </div>
        <div style="background:#0A2342;color:#fff;padding:18px 22px;font-size:12px">MetlifeDM LLC · ${escapeHtml(quotation.branding?.email || '')}</div>
      </div>`,
    attachments: [{ name: filename, content: pdf.toString('base64') }],
  });

  quotation.status = 'sent';
  quotation.lastSentAt = new Date();
  quotation.sentHistory.push({
    recipientEmail: req.body.recipientEmail,
    subject: req.body.subject,
    messageId: body?.messageId,
    version: quotation.version,
    sentBy: req.user._id,
  });
  await quotation.save();
  await audit(req, 'quotation.send', quotation, {
    recipientEmail: req.body.recipientEmail,
    version: quotation.version,
    messageId: body?.messageId,
  });
  return ApiResponse.ok(res, { quotation, messageId: body?.messageId }, 'Quotation sent');
});
