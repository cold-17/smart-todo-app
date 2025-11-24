import * as Sentry from '@sentry/react';
import React from 'react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

/**
 * Initialize Sentry for frontend error tracking
 *
 * Set VITE_SENTRY_DSN in your environment to enable Sentry.
 * Get your DSN from: https://sentry.io
 *
 * Environment variables:
 * - VITE_SENTRY_DSN: Sentry DSN (required for error tracking)
 * - VITE_SENTRY_ENVIRONMENT: Environment name (default: based on mode)
 * - VITE_SENTRY_TRACES_SAMPLE_RATE: Sample rate for performance (0.0-1.0, default: 0.1)
 */

export const initSentry = () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  // Skip Sentry if DSN is not configured
  if (!sentryDsn) {
    if (import.meta.env.MODE === 'production') {
      console.warn('Sentry DSN not configured. Error tracking is disabled.');
    }
    return false;
  }

  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;
  const tracesSampleRate = parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1');

  Sentry.init({
    dsn: sentryDsn,
    environment,

    // Set tracesSampleRate to capture performance data
    // 1.0 = 100% of transactions, lower for production
    tracesSampleRate,

    // Integrations
    integrations: [
      // Capture browser performance data
      new Sentry.BrowserTracing({
        // Trace React Router navigation
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),

      // Capture user interactions (clicks, form submissions, etc.)
      new Sentry.Replay({
        // Replay sessions where errors occur
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Configure what to send
    beforeSend(event, hint) {
      // Filter out errors in development
      if (environment === 'development') {
        console.error('Sentry event:', event, hint);
      }

      // Don't send network errors (these are often due to connectivity)
      if (event.exception) {
        const error = hint.originalException;

        // Skip common network errors
        if (error?.message?.includes('Network') ||
            error?.message?.includes('Failed to fetch')) {
          return null;
        }

        // Skip cancelled requests
        if (error?.name === 'AbortError' || error?.name === 'CancelledError') {
          return null;
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extension errors
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Common non-actionable errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',

      // Network errors
      'Network request failed',
      'NetworkError',
      'Failed to fetch',

      // Cancelled requests
      'Request aborted',
      'AbortError',
      'CancelledError',
    ],

    // Ignore errors from certain URLs
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],

    // Replay configuration
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  });

  console.log('Sentry initialized', {
    environment,
    tracesSampleRate
  });

  return true;
};

/**
 * Set user context in Sentry
 * @param {Object} user - User object
 */
export const setUser = (user) => {
  if (user) {
    Sentry.setUser({
      id: user._id,
      username: user.username,
      email: user.email
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Capture an exception manually
 * @param {Error} error - The error to capture
 * @param {Object} context - Additional context
 */
export const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    extra: context,
    level: 'error'
  });
};

/**
 * Capture a message manually
 * @param {string} message - The message to capture
 * @param {string} level - The severity level
 * @param {Object} context - Additional context
 */
export const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.captureMessage(message, {
    level,
    extra: context
  });
};

/**
 * Add breadcrumb for debugging
 * @param {Object} breadcrumb - Breadcrumb data
 */
export const addBreadcrumb = (breadcrumb) => {
  Sentry.addBreadcrumb(breadcrumb);
};

/**
 * Start a transaction for performance monitoring
 * @param {string} name - Transaction name
 * @param {string} op - Operation type
 * @returns {Object} Transaction object
 */
export const startTransaction = (name, op = 'navigation') => {
  return Sentry.startTransaction({
    name,
    op
  });
};

// Export Sentry for advanced use cases
export { Sentry };
