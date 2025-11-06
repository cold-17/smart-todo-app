const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Rate Limiting Middleware
 *
 * Protects against abuse and DDoS attacks by limiting the number of requests
 * from a single IP address within a time window.
 *
 * For production with multiple servers, consider using Redis store:
 * npm install rate-limit-redis redis
 *
 * Then use:
 * const RedisStore = require('rate-limit-redis');
 * const redis = require('redis');
 * const client = redis.createClient({ url: process.env.REDIS_URL });
 *
 * And add to limiter config:
 * store: new RedisStore({ client, prefix: 'rl:' })
 */

// Default message for rate limit exceeded
const defaultMessage = {
  error: 'Too many requests',
  message: 'You have exceeded the rate limit. Please try again later.',
  retryAfter: 'See Retry-After header'
};

// Handler for when rate limit is exceeded
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
  });

  res.status(429).json(defaultMessage);
};

// Skip rate limiting for successful requests (useful for auth)
const skipSuccessfulRequests = (req, res) => {
  return res.statusCode < 400;
};

/**
 * General API rate limiter
 * Applies to all API routes
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: defaultMessage,
  handler: rateLimitHandler,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests for this limiter? false - count all requests
  skip: (req) => {
    // Skip rate limiting in test environment
    return process.env.NODE_ENV === 'test';
  }
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 * 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login or registration attempts. Please try again later.',
    retryAfter: 'See Retry-After header'
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('user-agent'),
    });

    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many login or registration attempts. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: (req) => process.env.NODE_ENV === 'test'
});

/**
 * Moderate rate limiter for AI endpoints
 * AI operations are expensive, so we limit them more strictly
 * 20 requests per 15 minutes per IP
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 AI requests per windowMs
  message: {
    error: 'Too many AI requests',
    message: 'You have exceeded the AI request limit. Please try again later.',
    retryAfter: 'See Retry-After header'
  },
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?._id,
    });

    res.status(429).json({
      error: 'Too many AI requests',
      message: 'You have exceeded the AI request limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
});

/**
 * Strict rate limiter for password reset/sensitive operations
 * 3 attempts per hour per IP
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    error: 'Too many attempts',
    message: 'Too many attempts for this sensitive operation. Please try again later.',
    retryAfter: 'See Retry-After header'
  },
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test'
});

/**
 * Create a custom rate limiter with specific options
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || defaultMessage,
    handler: options.handler || rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'test',
    ...options
  });
};

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
  strictLimiter,
  createRateLimiter
};
