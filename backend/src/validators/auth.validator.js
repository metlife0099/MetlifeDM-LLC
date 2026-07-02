import { z } from 'zod';
import { REGEX } from '../utils/constants.js';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(REGEX.STRONG_PASSWORD, 'Must contain uppercase, lowercase, number, and special character');

export const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email('Invalid email'),
  password,
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  newsletterSubscribed: z.boolean().optional(),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password required'),
  rememberMe: z.boolean().optional(),
  twoFactorCode: z.string().length(6).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

export const enable2FASchema = z.object({
  code: z.string().length(6),
});

export const verify2FASchema = z.object({
  code: z.string().length(6),
});
