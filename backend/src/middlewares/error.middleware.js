import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * 404 Not Found Middleware for unknown routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Global Centralized Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Transform Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid format for field '${err.path}': '${err.value}'`;
    error = ApiError.badRequest(message);
  }

  // Transform Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message
    }));
    error = ApiError.unprocessable('Validation failed', errors);
  }

  // Transform Mongo duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    error = ApiError.conflict(`Duplicate value '${value}' entered for field '${field}'. Must be unique.`);
  }

  // Transform JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid security token');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Security token has expired, please log in again');
  }

  // Ensure error is an ApiError instance
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  const errors = error.errors || [];

  // Log error with context
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} - Server Error: ${message}`, {
      stack: err.stack,
      body: req.body,
      query: req.query,
      params: req.params
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode}: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
