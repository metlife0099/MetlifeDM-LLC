import http from 'node:http';
import app from './app.js';
import { config } from './config/index.js';
import logger from './config/logger.js';
import connectDatabase, { disconnectDatabase } from './config/database.js';
import connectRedis, { disconnectRedis } from './config/redis.js';
import { initSocket } from './sockets/index.js';
import { startConsultationReminderJob } from './jobs/reminder.job.js';
import { startCleanupJob } from './jobs/cleanup.job.js';

/* ---------------------------------------------------------------
 * Global crash safety
 * ------------------------------------------------------------- */
process.on('uncaughtException', (err) => {
  logger.error(`💥  Uncaught Exception: ${err.message}`, { stack: err.stack });
  // Give logger a chance to flush, then exit
  setTimeout(() => process.exit(1), 500);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`💥  Unhandled Rejection: ${reason instanceof Error ? reason.message : reason}`, {
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

/* ---------------------------------------------------------------
 * Bootstrap
 * ------------------------------------------------------------- */
const start = async () => {
  try {
    logger.info(`🚀  Starting MetlifeDM backend in ${config.env} mode...`);

    // 1. Database
    await connectDatabase();

    // 2. Redis (non-fatal if unavailable)
    await connectRedis();

    // 3. HTTP server
    const server = http.createServer(app);

    // 4. Socket.io
    initSocket(server);

    // 4b. Cron jobs (skip in test to avoid interfering)
    if (config.env !== 'test') {
      startConsultationReminderJob();
      startCleanupJob();
    }

    // 5. Listen
    server.listen(config.server.port, () => {
      logger.info(
        `✅  Server listening on http://localhost:${config.server.port} — API at ${config.server.apiPrefix}/${config.server.apiVersion}`
      );
    });

    // 6. Graceful shutdown
    const shutdown = async (signal) => {
      logger.warn(`⚠️  ${signal} received — starting graceful shutdown...`);
      server.close(async () => {
        logger.info('🔌  HTTP server closed');
        await Promise.allSettled([disconnectDatabase(), disconnectRedis()]);
        logger.info('👋  Shutdown complete');
        process.exit(0);
      });

      // Force exit after 15s
      setTimeout(() => {
        logger.error('⏰  Force shutdown after timeout');
        process.exit(1);
      }, 15000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    logger.error(`❌  Failed to start server: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
};

start();
