import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import logger from '../config/logger.js';
import { config } from '../config/index.js';

/**
 * Convert non-ApiError exceptions into ApiError before the final handler runs.
 */
export const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let errors = [];

    // Mongoose CastError (invalid ObjectId etc.)
    if (err instanceof mongoose.Error.CastError) {
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}`;
    }

    // Mongoose ValidationError
    if (err instanceof mongoose.Error.ValidationError) {
      statusCode = 422;
      message = 'Validation failed';
      errors = Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      }));
    }

    // Mongo duplicate key
    if (err.code === 11000) {
      statusCode = 409;
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      message = `Duplicate value for ${field}`;
      errors = [{ field, message: `${field} already exists` }];
    }

    // JWT errors
    if (err instanceof jwt.JsonWebTokenError) {
      statusCode = 401;
      message = 'Invalid token';
    }
    if (err instanceof jwt.TokenExpiredError) {
      statusCode = 401;
      message = 'Token expired';
    }

    // Multer file size
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'File too large';
    }

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  next(error);
};

/**
 * Final error handler — sends the response.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const { statusCode = 500, message, errors = [] } = err;

  // Log 5xx as errors, 4xx as warnings
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${statusCode} :: ${message}`, {
      stack: err.stack,
      ip: req.ip,
      user: req.user?._id,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} → ${statusCode} :: ${message}`);
  }

  const response = {
    success: false,
    statusCode,
    message: config.isProd && statusCode === 500 ? 'Something went wrong' : message,
    errors,
    timestamp: new Date().toISOString(),
  };

  if (!config.isProd) response.stack = err.stack;

  res.status(statusCode).json(response);
};

/**
 * 404 handler for unmatched routes.
 */
export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
