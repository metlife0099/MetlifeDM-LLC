import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { Settings } from '../models/index.js';

const PUBLIC_FIELDS = [
  'site', 'contact', 'social', 'business', 'seo', 'theme',
  'features', 'homepage', 'footer', 'chatbot', 'analytics.ga4Id',
  'analytics.gtmId', 'analytics.metaPixelId',
];

/* GET /settings/public — non-sensitive, cached */
export const getPublic = asyncHandler(async (req, res) => {
  const doc = await Settings.getGlobal();
  const settings = doc.toObject();
  // Strip admin-only
  delete settings.notifications;
  delete settings.lastUpdatedBy;
  return ApiResponse.ok(res, { settings }, 'Public settings');
});

/* GET /settings — admin (full) */
export const getAdmin = asyncHandler(async (req, res) => {
  const settings = await Settings.getGlobal();
  return ApiResponse.ok(res, { settings }, 'Settings');
});

/* PATCH /settings — admin */
export const update = asyncHandler(async (req, res) => {
  const settings = await Settings.getGlobal();
  Object.assign(settings, req.body);
  settings.lastUpdatedBy = req.user._id;
  await settings.save();

  // Toggle global maintenance flag
  global.MAINTENANCE_MODE = settings.features?.maintenanceMode || false;

  return ApiResponse.ok(res, { settings }, 'Settings updated');
});
