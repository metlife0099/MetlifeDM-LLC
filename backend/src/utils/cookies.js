import { config } from '../config/index.js';

export const parseDuration = (str) => {
  const m = /^(\d+)([smhd])$/.exec(str);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return n * mult;
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: config.isProd || config.cookie.secure,
  sameSite: 'lax',
  ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
  path: `${config.server.apiPrefix}/${config.server.apiVersion}/auth`,
  signed: false,
};

export const clearCookieOptions = {
  httpOnly: true,
  secure: config.isProd || config.cookie.secure,
  sameSite: 'lax',
  ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
  path: `${config.server.apiPrefix}/${config.server.apiVersion}/auth`,
};

export const REFRESH_COOKIE_NAME = 'metlife_rt';
