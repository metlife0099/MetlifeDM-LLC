import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Central configuration loader.
 * All environment variables are validated with Zod at startup.
 * If any required variable is missing/invalid, the process exits early.
 */

// z.coerce.boolean() runs JS `Boolean(str)`, so the string "false" (any
// non-empty string) coerces to `true`. Parse the literal "true"/"false"
// instead so env values are honored as written.
const zBoolean = (defaultValue) =>
  z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? defaultValue : v === 'true'));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),

  CLIENT_URL: z.string().url(),
  ADMIN_URL: z.string().url(),
  SERVER_URL: z.string().url(),

  MONGO_URI: z.string().min(1),
  MONGO_DB_NAME: z.string().default('metlifedm'),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_TTL_DEFAULT: z.coerce.number().default(3600),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  JWT_EMAIL_VERIFY_SECRET: z.string().min(16),
  JWT_EMAIL_VERIFY_EXPIRES: z.string().default('1d'),
  JWT_PASSWORD_RESET_SECRET: z.string().min(16),
  JWT_PASSWORD_RESET_EXPIRES: z.string().default('15m'),

  COOKIE_SECRET: z.string().min(8),
  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: zBoolean(false),

  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_CURRENCY: z.string().default('usd'),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_FOLDER: z.string().default('metlifedm'),

  BREVO_API_KEY: z.string().optional(),
  BREVO_SMTP_HOST: z.string().default('smtp-relay.brevo.com'),
  BREVO_SMTP_PORT: z.coerce.number().default(587),
  BREVO_SMTP_USER: z.string().min(1),
  BREVO_SMTP_PASS: z.string().min(1),
  MAIL_FROM_NAME: z.string().default('MetlifeDM LLC'),
  MAIL_FROM_ADDRESS: z.string().email(),
  MAIL_REPLY_TO: z.string().email(),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_MAX_TOKENS: z.coerce.number().default(800),
  OPENAI_TEMPERATURE: z.coerce.number().default(0.7),
  CHATBOT_CONFIDENCE_THRESHOLD: z.coerce.number().default(0.6),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(200),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),

  LOG_LEVEL: z.string().default('info'),
  LOG_DIR: z.string().default('logs'),

  CORS_ORIGINS: z.string(),
  TRUST_PROXY: z.coerce.number().default(1),

  SEED_SUPER_ADMIN_EMAIL: z.string().email(),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8),
  SEED_SUPER_ADMIN_NAME: z.string().default('Super Admin'),

  ENABLE_2FA: zBoolean(true),
  ENABLE_SWAGGER: zBoolean(true),
  ENABLE_REDIS_CACHE: zBoolean(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  isDev: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  server: {
    port: env.PORT,
    apiVersion: env.API_VERSION,
    apiPrefix: env.API_PREFIX,
    trustProxy: env.TRUST_PROXY,
  },

  urls: {
    client: env.CLIENT_URL,
    admin: env.ADMIN_URL,
    server: env.SERVER_URL,
  },

  db: {
    uri: env.MONGO_URI,
    name: env.MONGO_DB_NAME,
  },

  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    ttl: env.REDIS_TTL_DEFAULT,
    enabled: env.ENABLE_REDIS_CACHE,
  },

  jwt: {
    access: { secret: env.JWT_ACCESS_SECRET, expiresIn: env.JWT_ACCESS_EXPIRES },
    refresh: { secret: env.JWT_REFRESH_SECRET, expiresIn: env.JWT_REFRESH_EXPIRES },
    emailVerify: { secret: env.JWT_EMAIL_VERIFY_SECRET, expiresIn: env.JWT_EMAIL_VERIFY_EXPIRES },
    passwordReset: { secret: env.JWT_PASSWORD_RESET_SECRET, expiresIn: env.JWT_PASSWORD_RESET_EXPIRES },
  },

  cookie: {
    secret: env.COOKIE_SECRET,
    domain: env.COOKIE_DOMAIN,
    secure: env.COOKIE_SECURE,
  },

  bcrypt: {
    saltRounds: env.BCRYPT_SALT_ROUNDS,
  },

  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    currency: env.STRIPE_CURRENCY,
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    folder: env.CLOUDINARY_FOLDER,
  },

  mail: {
    apiKey: env.BREVO_API_KEY,
    smtp: {
      host: env.BREVO_SMTP_HOST,
      port: env.BREVO_SMTP_PORT,
      user: env.BREVO_SMTP_USER,
      pass: env.BREVO_SMTP_PASS,
    },
    from: { name: env.MAIL_FROM_NAME, address: env.MAIL_FROM_ADDRESS },
    replyTo: env.MAIL_REPLY_TO,
  },

  openai: {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
    maxTokens: env.OPENAI_MAX_TOKENS,
    temperature: env.OPENAI_TEMPERATURE,
    confidenceThreshold: env.CHATBOT_CONFIDENCE_THRESHOLD,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    authMax: env.AUTH_RATE_LIMIT_MAX,
  },

  log: {
    level: env.LOG_LEVEL,
    dir: env.LOG_DIR,
  },

  cors: {
    origins: env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  },

  seed: {
    email: env.SEED_SUPER_ADMIN_EMAIL,
    password: env.SEED_SUPER_ADMIN_PASSWORD,
    name: env.SEED_SUPER_ADMIN_NAME,
  },

  features: {
    twoFactorAuth: env.ENABLE_2FA,
    swagger: env.ENABLE_SWAGGER,
    redisCache: env.ENABLE_REDIS_CACHE,
  },
};

export default config;
