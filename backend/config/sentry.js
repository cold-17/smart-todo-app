const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const logger = require('./logger');

/**
 * Initialize Sentry for error tracking and performance monitoring
 *
 * Set SENTRY_DSN in your environment variables to enable Sentry.
 * Get your DSN from: https://sentry.io
 *
 * Optional environment variables:
 * - SENTRY_ENVIRONMENT: Environment name (default: NODE_ENV)
 * - SENTRY_TRACES_SAMPLE_RATE: Percentage of transactions to trace (0.0-1.0, default: 0.1)
 * - SENTRY_PROFILES_SAMPLE_RATE: Percentage of transactions to profile (0.0-1.0, default: 0.1)
 */

const initSentry = (app) => {
  const sentryDsn = process.env.SENTRY_DSN;

  // Skip Sentry initialization if DSN is not set or in test environment
  if (!sentryDsn || process.env.NODE_ENV === 'test') {
    if (!sentryDsn && process.env.NODE_ENV === 'production') {
      logger.warn('Sentry DSN not configured. Error tracking is disabled.');
    }
    return {
      isEnabled: false,
      Sentry: null,
      requestHandler: (req, res, next) => next(),
      tracingMiddleware: (req, res, next) => next(),
      errorHandler: (err, req, res, next) => next(err)
    };
  }

  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
  const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');
  const profilesSampleRate = parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1');

  // Initialize Sentry
  Sentry.init({
    dsn: sentryDsn,
    environment,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // We recommend adjusting this value in production
    tracesSampleRate,

    // Set profilesSampleRate to 1.0 to profile 100% of sampled transactions
    // We recommend adjusting this value in production
    profilesSampleRate,

    // Performance Monitoring
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),

      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),

      // Enable Profiling
      new ProfilingIntegration(),

      // Capture console logs
      new Sentry.Integrations.Console({
        levels: ['error']
      }),
    ],

    // Configure what data to send
    beforeSend(event, hint) {
      // Filter out errors in development if desired
      if (environment === 'development') {
        // Log to console in development
        console.error('Sentry event:', event);
      }

      // Don't send certain errors
      if (event.exception) {
        const error = hint.originalException;

        // Skip validation errors (these are expected user errors)
        if (error?.name === 'ValidationError') {
          return null;
        }

        // Skip JWT errors (these are authentication failures, not bugs)
        if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
          return null;
        }

        // Skip MongoDB duplicate key errors (expected business logic)
        if (error?.code === 11000) {
          return null;
        }
      }

      return event;
    },

    // Configure sensitive data scrubbing
    beforeBreadcrumb(breadcrumb) {
      // Don't send breadcrumbs for console logs in production
      if (breadcrumb.category === 'console' && environment === 'production') {
        return null;
      }

      return breadcrumb;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser errors that shouldn't affect the backend
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',

      // Network errors
      'Network request failed',
      'NetworkError',

      // Cancelled requests
      'Request aborted',
      'AbortError',
    ],
  });

  logger.info('Sentry initialized', {
    environment,
    tracesSampleRate,
    profilesSampleRate
  });

  return {
    isEnabled: true,
    Sentry,
    requestHandler: Sentry.Handlers.requestHandler(),
    tracingMiddleware: Sentry.Handlers.tracingHandler(),
    errorHandler: Sentry.Handlers.errorHandler({
      shouldHandleError(error) {
        // Capture all 500 errors
        if (error.status >= 500) {
          return true;
        }

        // Capture specific error types
        if (error.name === 'MongoError' || error.name === 'MongooseError') {
          return true;
        }

        return false;
      }
    })
  };
};

/**
 * Capture an exception manually
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
const captureException = (error, context = {}) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.captureException(error, {
      extra: context,
      level: 'error'
    });
  }

  // Always log locally
  logger.error('Exception captured', {
    error: error.message,
    stack: error.stack,
    ...context
  });
};

/**
 * Capture a message manually
 * @param {string} message - The message to capture
 * @param {string} level - The severity level (fatal, error, warning, info, debug)
 * @param {Object} context - Additional context
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.captureMessage(message, {
      level,
      extra: context
    });
  }

  logger[level](message, context);
};

/**
 * Set user context for error tracking
 * @param {Object} user - User object
 */
const setUser = (user) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.setUser({
      id: user._id?.toString(),
      username: user.username,
      email: user.email
    });
  }
};

/**
 * Clear user context
 */
const clearUser = () => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.setUser(null);
  }
};

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
const addBreadcrumb = (breadcrumb) => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

/**
 * Start a transaction for performance monitoring
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 * @returns {Object} Transaction object
 */
const startTransaction = (name, op = 'http.server') => {
  if (process.env.SENTRY_DSN && process.env.NODE_ENV !== 'test') {
    return Sentry.startTransaction({
      name,
      op
    });
  }

  // Return a mock transaction if Sentry is not enabled
  return {
    finish: () => {},
    setStatus: () => {},
    setData: () => {},
    setTag: () => {}
  };
};

module.exports = {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  startTransaction
};
