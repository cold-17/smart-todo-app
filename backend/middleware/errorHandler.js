const logger = require('../config/logger');

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the full error with stack trace
  logger.error('Request error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user._id : 'unauthenticated',
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Prepare error response
  const errorResponse = {
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Don't expose internal errors to clients in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    errorResponse.message = 'An unexpected error occurred. Please try again later.';
  }

  res.status(statusCode).json(errorResponse);
};

// Not found handler
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Async handler wrapper to catch async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
