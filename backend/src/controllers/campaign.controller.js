import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Campaign, Newsletter } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { config } from '../config/index.js';
import * as tpl from '../templates/emails/index.js';
import emailService from '../services/email.service.js';
import logger from '../config/logger.js';

const MAX_CONCURRENCY = 5;
const FLUSH_EVERY = 10;

const buildUnsubscribeUrl = (email) =>
  `${config.urls.server}${config.server.apiPrefix}/${config.server.apiVersion}/newsletter/unsubscribe?email=${encodeURIComponent(email)}&reason=campaign`;

const resolveRecipients = (campaign) => {
  if (campaign.targetType === 'selected') {
    return Newsletter.find({ _id: { $in: campaign.recipients }, isActive: true }, 'email');
  }
  if (campaign.targetType === 'featured') {
    return Newsletter.find({ isActive: true, isFeatured: true }, 'email');
  }
  return Newsletter.find({ isActive: true }, 'email');
};

/** Runs `fn` over `items` with at most `limit` concurrent in-flight calls. */
const mapLimit = async (items, limit, fn) => {
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const current = idx;
      idx += 1;
      await fn(items[current], current);
    }
  });
  await Promise.all(workers);
};

/**
 * Sends the campaign to every recipient with bounded concurrency, persisting
 * progress every FLUSH_EVERY sends so the admin UI can poll for live status.
 * Deliberately not awaited by the `send` controller — this can take minutes
 * for large lists and must not hold the HTTP request open.
 */
const processCampaign = async (campaignId, snapshot, recipients) => {
  const total = recipients.length;
  let sentCount = 0;
  let failedCount = 0;
  const failedRecipients = [];
  let sinceFlush = 0;

  const flush = async (final = false) => {
    const update = {
      'stats.sentCount': sentCount,
      'stats.failedCount': failedCount,
      failedRecipients: failedRecipients.slice(-50),
    };
    if (final) {
      update.status = failedCount >= total && total > 0 ? 'failed' : failedCount > 0 ? 'partial' : 'sent';
      update.completedAt = new Date();
    }
    await Campaign.updateOne({ _id: campaignId }, update).catch((err) =>
      logger.error(`Campaign ${campaignId} progress save failed: ${err.message}`)
    );
  };

  await mapLimit(recipients, MAX_CONCURRENCY, async (sub) => {
    try {
      const unsubscribeUrl = buildUnsubscribeUrl(sub.email);
      const html = tpl.campaignEmail({
        subject: snapshot.subject,
        preheader: snapshot.preheader,
        bodyHtml: snapshot.htmlContent,
        unsubscribeUrl,
      });
      await emailService.campaignSend(sub.email, snapshot.subject, html);
      sentCount += 1;
      Newsletter.updateOne(
        { _id: sub._id },
        { $inc: { totalEmailsSent: 1 }, $set: { lastEmailSentAt: new Date() } }
      ).catch(() => {});
    } catch (err) {
      failedCount += 1;
      failedRecipients.push({ email: sub.email, reason: (err.message || 'Send failed').slice(0, 200) });
    }
    sinceFlush += 1;
    if (sinceFlush >= FLUSH_EVERY) {
      sinceFlush = 0;
      await flush(false);
    }
  });

  await flush(true);
  logger.info(`📣  Campaign ${campaignId} finished: ${sentCount} sent, ${failedCount} failed of ${total}`);
};

const validatePayload = (body) => {
  const name = (body.name || '').trim();
  const subject = (body.subject || '').trim();
  const htmlContent = body.htmlContent || '';
  if (!name) throw ApiError.badRequest('Campaign name is required');
  if (!subject) throw ApiError.badRequest('Email subject is required');
  if (!htmlContent || htmlContent === '<p></p>') throw ApiError.badRequest('Email content is required');

  const targetType = ['all', 'featured', 'selected'].includes(body.targetType) ? body.targetType : 'all';
  const recipients = Array.isArray(body.recipients) ? body.recipients : [];
  if (targetType === 'selected' && recipients.length === 0) {
    throw ApiError.badRequest('Select at least one subscriber');
  }

  return {
    name,
    subject,
    preheader: (body.preheader || '').trim(),
    htmlContent,
    targetType,
    recipients: targetType === 'selected' ? recipients : [],
  };
};

export const list = asyncHandler(async (req, res) => {
  const opts = getPaginationOptions(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (opts.search) {
    filter.$or = [
      { name: { $regex: opts.search, $options: 'i' } },
      { subject: { $regex: opts.search, $options: 'i' } },
    ];
  }
  const { items, meta } = await paginate(Campaign, filter, opts, {
    populate: [{ path: 'createdBy', select: 'firstName lastName' }],
  });
  return ApiResponse.ok(res, items, 'Campaigns', meta);
});

export const getById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate('recipients', 'email name')
    .populate('createdBy', 'firstName lastName email');
  if (!campaign) throw ApiError.notFound('Campaign not found');
  return ApiResponse.ok(res, { campaign }, 'Campaign');
});

export const create = asyncHandler(async (req, res) => {
  const payload = validatePayload(req.body);
  const campaign = await Campaign.create({ ...payload, createdBy: req.user._id });
  return ApiResponse.created(res, { campaign }, 'Campaign created');
});

export const update = asyncHandler(async (req, res) => {
  const existing = await Campaign.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Campaign not found');
  if (existing.status === 'sending') throw ApiError.conflict('Cannot edit a campaign while it is sending');

  const payload = validatePayload(req.body);
  Object.assign(existing, payload);
  await existing.save();
  return ApiResponse.ok(res, { campaign: existing }, 'Campaign updated');
});

export const remove = asyncHandler(async (req, res) => {
  const existing = await Campaign.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Campaign not found');
  if (existing.status === 'sending') throw ApiError.conflict('Cannot delete a campaign while it is sending');
  await existing.deleteOne();
  return ApiResponse.ok(res, null, 'Campaign deleted');
});

/** Sends one copy of the campaign to a single address without touching stats or subscriber records. */
export const sendTest = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw ApiError.notFound('Campaign not found');

  const to = (req.body.email || req.user.email || '').trim();
  if (!to) throw ApiError.badRequest('Email required');

  const html = tpl.campaignEmail({
    subject: campaign.subject,
    preheader: campaign.preheader,
    bodyHtml: campaign.htmlContent,
    unsubscribeUrl: buildUnsubscribeUrl(to),
  });
  await emailService.campaignSend(to, `[TEST] ${campaign.subject}`, html);
  return ApiResponse.ok(res, null, `Test email sent to ${to}`);
});

export const send = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) throw ApiError.notFound('Campaign not found');
  if (campaign.status === 'sending') throw ApiError.conflict('This campaign is already sending');

  const recipients = await resolveRecipients(campaign);
  if (!recipients.length) throw ApiError.badRequest("No active subscribers match this campaign's audience");

  campaign.status = 'sending';
  campaign.stats = { totalRecipients: recipients.length, sentCount: 0, failedCount: 0 };
  campaign.failedRecipients = [];
  campaign.startedAt = new Date();
  campaign.completedAt = undefined;
  campaign.errorMessage = undefined;
  await campaign.save();

  const snapshot = {
    subject: campaign.subject,
    preheader: campaign.preheader,
    htmlContent: campaign.htmlContent,
  };

  // Fire-and-forget: sending thousands of emails can take minutes and must
  // not hold this request open. Progress is polled via GET /campaigns/:id.
  processCampaign(campaign._id, snapshot, recipients).catch((err) => {
    logger.error(`Campaign ${campaign._id} send crashed: ${err.message}`);
    Campaign.updateOne(
      { _id: campaign._id },
      { status: 'failed', errorMessage: err.message, completedAt: new Date() }
    ).catch(() => {});
  });

  return ApiResponse.ok(res, { campaign }, `Sending to ${recipients.length} subscribers…`);
});
