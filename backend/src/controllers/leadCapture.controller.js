import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Contact, Consultation, Newsletter, Career, JobApplication } from '../models/index.js';
import { getPaginationOptions, paginate } from '../utils/pagination.js';
import { CONSULTATION_STATUS } from '../utils/constants.js';
import emailService from '../services/email.service.js';
import logger from '../config/logger.js';

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
    }
    emailService.newsletterWelcome(req.body.email).catch(() => {});
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
    if (opts.search) filter.email = { $regex: opts.search, $options: 'i' };
    const { items, meta } = await paginate(Newsletter, filter, opts);
    return ApiResponse.ok(res, items, 'Subscribers', meta);
  }),
  remove: asyncHandler(async (req, res) => {
    await Newsletter.findByIdAndDelete(req.params.id);
    return ApiResponse.ok(res, null, 'Removed');
  }),
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
  bySlug: asyncHandler(async (req, res) => {
    const job = await Career.findOne({ slug: req.params.slug });
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
  updateApplication: asyncHandler(async (req, res) => {
    const app = await JobApplication.findByIdAndUpdate(req.params.appId, req.body, { new: true });
    if (!app) throw ApiError.notFound('Application not found');
    return ApiResponse.ok(res, { application: app }, 'Updated');
  }),
};
