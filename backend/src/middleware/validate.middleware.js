import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';

/**
 * validate(schema, source = 'body')
 * Runs a Zod schema against req[source] and replaces it with parsed data.
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const data = schema.parse(req[source]);
    req[source] = data;
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(ApiError.unprocessable('Validation failed', errors));
    }
    next(err);
  }
};

/**
 * validateMany({ body, query, params })
 */
export const validateMany = (schemas) => (req, res, next) => {
  try {
    for (const key of ['body', 'query', 'params']) {
      if (schemas[key]) req[key] = schemas[key].parse(req[key]);
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(ApiError.unprocessable('Validation failed', errors));
    }
    next(err);
  }
};
