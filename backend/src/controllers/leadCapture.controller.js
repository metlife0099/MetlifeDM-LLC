import mongoose from 'mongoose';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Contact, Consultation, Newsletter, Career, JobApplication } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { CONSULTATION_STATUS, REGEX } from '../utils/constants.js';
import * as XLSX from 'xlsx';
import emailService from '../services/email.service.js';
import logger from '../config/logger.js';
import { notifyAdmins } from './notification.controller.js';

/* ========== CONTACT ========== */
export const contact = {
  submit: asyncHandler(async (req, res) => {
    const c = await Contact.create({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
    });
    emailService.contactReceived(c).catch((e) => logger.warn(`Contact ack email failed: ${e.message}`));
    emailService.notifyAdmins(c, 'contact').catch(() => {});
    notifyAdmins({
      type: 'contact',
      title: 'New contact form submission',
      message: `${c.firstName} ${c.lastName} — ${c.subject}`,
      resourceType: 'contact',
      resourceId: c._id,
      actionUrl: `/leads/contacts`,
    }).catch(() => {});
    return ApiResponse.created(res, null, "Thanks! We'll get back within 4 business hours.");
  }),
  list: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (opts.search) {
      filter.$or = [
        { email: { $regex: opts.search, $options: 'i' } },
        { firstName: { $regex: opts.search, $options: 'i' } },
        { lastName: { $regex: opts.search, $options: 'i' } },
        { subject: { $regex: opts.search, $options: 'i' } },
      ];
    }
    const { items, meta } = await paginate(Contact, filter, opts);
    return ApiResponse.ok(res, items, 'Contacts', meta);
  }),
  update: asyncHandler(async (req, res) => {
    const c = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!c) throw ApiError.notFound('Contact not found');
    return ApiResponse.ok(res, { contact: c }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const c = await Contact.findByIdAndDelete(req.params.id);
    if (!c) throw ApiError.notFound('Contact not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
};

/* ========== CONSULTATION ========== */
export const consultation = {
  book: asyncHandler(async (req, res) => {
    const c = await Consultation.create({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    emailService.notifyAdmins(c, 'consultation').catch(() => {});
    notifyAdmins({
      type: 'consultation',
      title: 'New consultation requested',
      message: `${c.firstName} ${c.lastName} — ${c.preferredDate?.toDateString?.() || ''}`,
      resourceType: 'consultation',
      resourceId: c._id,
      actionUrl: `/leads/consultations`,
    }).catch(() => {});
    return ApiResponse.created(res, { consultation: c }, 'Consultation requested');
  }),
  list: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.upcoming === 'true') filter.preferredDate = { $gte: new Date() };
    if (opts.search) {
      filter.$or = [
        { email: { $regex: opts.search, $options: 'i' } },
        { firstName: { $regex: opts.search, $options: 'i' } },
      ];
    }
    const { items, meta } = await paginate(Consultation, filter, opts);
    return ApiResponse.ok(res, items, 'Consultations', meta);
  }),
  confirm: asyncHandler(async (req, res) => {
    const c = await Consultation.findByIdAndUpdate(
      req.params.id,
      {
        status: CONSULTATION_STATUS.CONFIRMED,
        confirmedAt: new Date(),
        meetingLink: req.body.meetingLink,
        assignedTo: req.user._id,
      },
      { new: true }
    );
    if (!c) throw ApiError.notFound('Consultation not found');
    emailService.consultationConfirmed(c, c).catch(() => {});
    return ApiResponse.ok(res, { consultation: c }, 'Confirmed');
  }),
  update: asyncHandler(async (req, res) => {
    const c = await Consultation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!c) throw ApiError.notFound('Consultation not found');
    return ApiResponse.ok(res, { consultation: c }, 'Updated');
  }),
};

/* ========== NEWSLETTER ========== */
export const newsletter = {
  subscribe: asyncHandler(async (req, res) => {
    const existing = await Newsletter.findOne({ email: req.body.email });
    let isNew = false;
    if (existing) {
      if (existing.isActive) return ApiResponse.ok(res, null, "You're already subscribed!");
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      await existing.save();
    } else {
      await Newsletter.create({
        ...req.body,
        ipAddress: req.ip,
        isVerified: true,
      });
      isNew = true;
    }
    emailService.newsletterWelcome(req.body.email).catch(() => {});
    if (isNew) {
      notifyAdmins({
        type: 'subscriber',
        title: 'New newsletter subscriber',
        message: req.body.email,
        resourceType: 'subscriber',
        actionUrl: '/leads/subscribers',
      }).catch(() => {});
    }
    return ApiResponse.created(res, null, "You're in — welcome!");
  }),
  unsubscribe: asyncHandler(async (req, res) => {
    const email = req.query.email;
    if (!email) throw ApiError.badRequest('Email required');
    await Newsletter.updateOne(
      { email: email.toLowerCase() },
      { isActive: false, unsubscribedAt: new Date(), unsubscribeReason: req.query.reason }
    );
    return ApiResponse.ok(res, null, "You've been unsubscribed.");
  }),
  list: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.active === 'true') filter.isActive = true;
    if (req.query.featured === 'true') filter.isFeatured = true;
    if (opts.search) filter.email = { $regex: opts.search, $options: 'i' };
    const { items, meta } = await paginate(Newsletter, filter, opts);
    return ApiResponse.ok(res, items, 'Subscribers', meta);
  }),
  /* Admin: toggle isFeatured / isActive / rename a subscriber */
  update: asyncHandler(async (req, res) => {
    const allowed = ['name', 'isFeatured', 'isActive', 'tags'];
    const patch = {};
    for (const key of allowed) if (key in req.body) patch[key] = req.body[key];
    const subscriber = await Newsletter.findByIdAndUpdate(req.params.id, patch, { new: true });
    if (!subscriber) throw ApiError.notFound('Subscriber not found');
    return ApiResponse.ok(res, { subscriber }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    await Newsletter.findByIdAndDelete(req.params.id);
    return ApiResponse.ok(res, null, 'Removed');
  }),

  /* Admin: add a single subscriber directly */
  createOne: asyncHandler(async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const name = (req.body.name || '').trim();
    if (!email || !REGEX.EMAIL.test(email)) throw ApiError.badRequest('A valid email is required');

    const existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.isActive) throw ApiError.conflict('This email is already subscribed');
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      if (name) existing.name = name;
      await existing.save();
      return ApiResponse.ok(res, { subscriber: existing }, 'Subscriber reactivated');
    }

    const subscriber = await Newsletter.create({
      email,
      name: name || undefined,
      source: 'admin',
      isVerified: true,
    });
    emailService.newsletterWelcome(email).catch(() => {});
    return ApiResponse.created(res, { subscriber }, 'Subscriber added');
  }),

  /* Admin: add multiple subscribers at once (pasted rows) */
  createBulk: asyncHandler(async (req, res) => {
    const rows = Array.isArray(req.body.subscribers) ? req.body.subscribers : [];
    if (!rows.length) throw ApiError.badRequest('No subscribers provided');
    const summary = await bulkUpsertSubscribers(rows, 'admin-bulk');
    return ApiResponse.created(res, summary, `${summary.created} added, ${summary.skipped} skipped`);
  }),

  /* Admin: import subscribers from an uploaded CSV/Excel file */
  importFile: asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('File required');

    let rows;
    try {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } catch {
      throw ApiError.badRequest('Could not read that file — please upload a valid CSV or Excel file');
    }

    const NAME_KEYS = ['name', 'full name', 'fullname', 'full_name'];
    const EMAIL_KEYS = ['email', 'email address', 'gmail', 'e-mail'];
    const pick = (row, keys) => {
      const foundKey = Object.keys(row).find((k) => keys.includes(k.trim().toLowerCase()));
      return foundKey ? String(row[foundKey]).trim() : '';
    };

    const normalized = rows.map((row) => ({
      name: pick(row, NAME_KEYS),
      email: pick(row, EMAIL_KEYS),
    }));

    const summary = await bulkUpsertSubscribers(normalized, 'admin-import');
    return ApiResponse.created(res, summary, `${summary.created} added, ${summary.skipped} skipped`);
  }),
};

/**
 * Shared bulk-add logic for admin "add multiple" and CSV/Excel import.
 * Silent by design (no welcome emails) — importing an existing list
 * shouldn't blast everyone on it.
 */
const bulkUpsertSubscribers = async (rows, source) => {
  const created = [];
  const skipped = [];

  for (const row of rows) {
    const email = (row.email || '').trim().toLowerCase();
    const name = (row.name || '').trim();
    if (!email || !REGEX.EMAIL.test(email)) {
      skipped.push({ email: row.email || '(blank)', reason: 'Invalid or missing email' });
      continue;
    }
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      skipped.push({ email, reason: existing.isActive ? 'Already subscribed' : 'Previously unsubscribed' });
      continue;
    }
    const doc = await Newsletter.create({ email, name: name || undefined, source, isVerified: true });
    created.push(doc);
  }

  return { created: created.length, skipped: skipped.length, skippedDetails: skipped.slice(0, 20) };
};

/* ========== CAREERS ========== */
export const career = {
  list: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = { status: 'open' };
    if (req.query.department) filter.department = req.query.department;
    if (req.query.workMode) filter.workMode = req.query.workMode;
    const { items, meta } = await paginate(Career, filter, opts, {
      select: 'title slug department location workMode employmentType shortDescription postedAt',
    });
    return ApiResponse.ok(res, items, 'Openings', meta);
  }),
  listAdmin: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;
    if (opts.search) filter.title = { $regex: opts.search, $options: 'i' };
    const { items, meta } = await paginate(Career, filter, opts);
    return ApiResponse.ok(res, items, 'Jobs (admin)', meta);
  }),
  bySlug: asyncHandler(async (req, res) => {
    const key = req.params.slug ?? req.params.id;
    const query = mongoose.isValidObjectId(key) ? { _id: key } : { slug: key };
    const job = await Career.findOne(query);
    if (!job) throw ApiError.notFound('Job not found');
    Career.updateOne({ _id: job._id }, { $inc: { views: 1 } }).catch(() => {});
    return ApiResponse.ok(res, { job }, 'Job');
  }),
  create: asyncHandler(async (req, res) => {
    const job = await Career.create(req.body);
    return ApiResponse.created(res, { job }, 'Job posted');
  }),
  update: asyncHandler(async (req, res) => {
    const job = await Career.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) throw ApiError.notFound('Job not found');
    return ApiResponse.ok(res, { job }, 'Updated');
  }),
  remove: asyncHandler(async (req, res) => {
    const job = await Career.findByIdAndDelete(req.params.id);
    if (!job) throw ApiError.notFound('Job not found');
    return ApiResponse.ok(res, null, 'Deleted');
  }),
  apply: asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Resume required');
    const job = await Career.findById(req.params.id);
    if (!job || job.status !== 'open') throw ApiError.badRequest('Position not accepting applications');

    const existing = await JobApplication.findOne({ career: job._id, email: req.body.email.toLowerCase() });
    if (existing) throw ApiError.conflict('You already applied to this role');

    const application = await JobApplication.create({
      ...req.body,
      career: job._id,
      jobTitle: job.title,
      email: req.body.email.toLowerCase(),
      resume: { url: req.file.path, publicId: req.file.filename, name: req.file.originalname },
      ipAddress: req.ip,
    });
    await Career.updateOne({ _id: job._id }, { $inc: { applicationsCount: 1 } });
    emailService.notifyAdmins(application, 'application').catch(() => {});
    notifyAdmins({
      type: 'application',
      title: 'New job application',
      message: `${application.firstName} ${application.lastName} — ${job.title}`,
      resourceType: 'application',
      resourceId: application._id,
      actionUrl: `/careers/applications`,
    }).catch(() => {});
    return ApiResponse.created(res, null, 'Application received!');
  }),
  listApplications: asyncHandler(async (req, res) => {
    const opts = getPaginationOptions(req.query);
    const filter = {};
    if (req.params.jobId) filter.career = req.params.jobId;
    if (req.query.status) filter.status = req.query.status;
    const { items, meta } = await paginate(JobApplication, filter, opts, {
      populate: [{ path: 'career', select: 'title slug' }],
    });
    return ApiResponse.ok(res, items, 'Applications', meta);
  }),
  getApplication: asyncHandler(async (req, res) => {
    const application = await JobApplication.findById(req.params.id).populate('career', 'title slug');
    if (!application) throw ApiError.notFound('Application not found');
    return ApiResponse.ok(res, { application }, 'Application');
  }),
  updateApplication: asyncHandler(async (req, res) => {
    const key = req.params.appId ?? req.params.id;
    const app = await JobApplication.findByIdAndUpdate(key, req.body, { new: true });
    if (!app) throw ApiError.notFound('Application not found');
    return ApiResponse.ok(res, { application: app }, 'Updated');
  }),
};
