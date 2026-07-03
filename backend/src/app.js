import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './config/index.js';
import logger, { morganStream } from './config/logger.js';
import { globalLimiter } from './middleware/rateLimit.middleware.js';
import { xssClean } from './middleware/xssClean.middleware.js';
import { errorConverter, errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import ApiResponse from './utils/ApiResponse.js';

import webhookRoutes from './routes/webhook.routes.js';
import apiRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ---------------------------------------------------------------
 * Trust proxy (behind Vercel / Nginx / Load Balancer)
 * ------------------------------------------------------------- */
app.set('trust proxy', config.server.trustProxy);
app.disable('x-powered-by');

/* ---------------------------------------------------------------
 * Security headers
 * ------------------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: config.isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'https://res.cloudinary.com'],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com', 'https://www.googletagmanager.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            connectSrc: ["'self'", 'https://api.stripe.com', 'wss:', 'https:'],
            frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

/* ---------------------------------------------------------------
 * CORS
 * ------------------------------------------------------------- */
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow tools like curl / Postman
    if (config.cors.origins.includes(origin) || config.cors.origins.includes('*')) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Stripe-Signature'],
  exposedHeaders: ['X-Total-Count', 'X-Cache'],
  maxAge: 86400,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* ---------------------------------------------------------------
 * Stripe webhook — MUST come before body parsers (needs raw body)
 * ------------------------------------------------------------- */
app.use(`${config.server.apiPrefix}/webhooks`, webhookRoutes);

/* ---------------------------------------------------------------
 * Body parsing + cookies
 * ------------------------------------------------------------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookie.secret));

/* ---------------------------------------------------------------
 * Data sanitization
 * ------------------------------------------------------------- */
app.use(
  mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      logger.warn(`⚠️  Sanitized potentially malicious key "${key}" from ${req.ip}`);
    },
  })
);
app.use(xssClean(['content', 'description', 'html', 'body'])); // skip rich-text fields
app.use(hpp({ whitelist: ['tags', 'category', 'services', 'sort'] }));

/* ---------------------------------------------------------------
 * Compression
 * ------------------------------------------------------------- */
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => (req.headers['x-no-compression'] ? false : compression.filter(req, res)),
  })
);

/* ---------------------------------------------------------------
 * Logging
 * ------------------------------------------------------------- */
if (config.isDev) app.use(morgan('dev', { stream: morganStream }));
else app.use(morgan('combined', { stream: morganStream }));

/* ---------------------------------------------------------------
 * Static assets (uploads fallback if not using Cloudinary)
 * ------------------------------------------------------------- */
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), { maxAge: '30d' }));

/* ---------------------------------------------------------------
 * Global rate limit
 * ------------------------------------------------------------- */
app.use(config.server.apiPrefix, globalLimiter);

/* ---------------------------------------------------------------
 * Health & readiness
 * ------------------------------------------------------------- */
app.get('/health', (req, res) =>
  ApiResponse.ok(res, {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: config.env,
    version: '1.0.0',
    memory: process.memoryUsage(),
  }, 'OK')
);

app.get('/', (req, res) =>
  ApiResponse.ok(res, {
    name: 'MetlifeDM LLC API',
    docs: `${config.server.apiPrefix}/${config.server.apiVersion}/docs`,
  }, 'MetlifeDM Backend Running 🚀')
);

/* ---------------------------------------------------------------
 * Maintenance mode gate (dynamic via Settings — future)
 * ------------------------------------------------------------- */
app.use((req, res, next) => {
  if (global.MAINTENANCE_MODE && !req.path.startsWith('/health')) {
    return res.status(503).json({
      success: false,
      statusCode: 503,
      message: 'Service temporarily unavailable — maintenance in progress.',
    });
  }
  next();
});

/* ---------------------------------------------------------------
 * API routes (versioned)
 * ------------------------------------------------------------- */
app.use(`${config.server.apiPrefix}/${config.server.apiVersion}`, apiRoutes);

/* ---------------------------------------------------------------
 * 404 + error handlers (always last)
 * ------------------------------------------------------------- */
app.use(notFoundHandler);
app.use(errorConverter);
app.use(errorHandler);

export default app;
