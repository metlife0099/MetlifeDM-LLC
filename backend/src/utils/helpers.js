import slugify from 'slugify';
import otpGenerator from 'otp-generator';
import { customAlphabet } from 'nanoid';

const orderIdGen = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 10);
const invoiceIdGen = customAlphabet('0123456789', 8);

export const toSlug = (text) => slugify(text, { lower: true, strict: true, trim: true });

export const generateOTP = (digits = 6) =>
  otpGenerator.generate(digits, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });

export const generateOrderNumber = () => `MDM-${orderIdGen()}`;
export const generateInvoiceNumber = () =>
  `INV-${new Date().getFullYear()}-${invoiceIdGen()}`;

export const generateTicketNumber = () => `TKT-${orderIdGen().slice(0, 8)}`;

export const sanitizeHTML = (html) =>
  String(html || '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');

export const maskEmail = (email) => {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const masked =
    name.length <= 2 ? '*'.repeat(name.length) : `${name[0]}${'*'.repeat(name.length - 2)}${name.slice(-1)}`;
  return `${masked}@${domain}`;
};

export const pickFields = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

export const omitFields = (obj, keys) => {
  const clone = { ...obj };
  keys.forEach((k) => delete clone[k]);
  return clone;
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
