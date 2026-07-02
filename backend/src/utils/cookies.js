import { config } from '../config/index.js';

const parseDuration = (str) => {
  const m = /^(\d+)([smhd])$/.exec(str);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return n * mult;
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.secure ? 'none' : 'lax',
  domain: config.cookie.domain,
  path: '/api',
  maxAge: parseDuration(config.jwt.refresh.expiresIn),
  signed: false,
};

export const clearCookieOptions = {
  httpOnly: true,
  secure: config.cookie.secure,
  sameSite: config.cookie.secure ? 'none' : 'lax',
  domain: config.cookie.domain,
  path: '/api',
};

export const REFRESH_COOKIE_NAME = 'metlife_rt';
