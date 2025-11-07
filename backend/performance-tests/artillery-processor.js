/**
 * Artillery Processor
 * Custom JavaScript functions for Artillery load tests
 */

const crypto = require('crypto');

/**
 * Generate random string
 */
function generateRandomString(userContext, events, done) {
  userContext.vars.randomString = crypto.randomBytes(8).toString('hex');
  return done();
}

/**
 * Generate random email
 */
function generateRandomEmail(userContext, events, done) {
  const randomId = crypto.randomBytes(8).toString('hex');
  userContext.vars.randomEmail = `loadtest_${randomId}@example.com`;
  return done();
}

/**
 * Log response for debugging
 */
function logResponse(requestParams, response, context, ee, next) {
  if (response.statusCode >= 400) {
    console.error('Request failed:', {
      url: requestParams.url,
      status: response.statusCode,
      body: response.body
    });
  }
  return next();
}

/**
 * Set custom headers
 */
function setCustomHeaders(requestParams, context, ee, next) {
  requestParams.headers = requestParams.headers || {};
  requestParams.headers['X-Load-Test'] = 'true';
  requestParams.headers['X-Request-ID'] = crypto.randomUUID();
  return next();
}

/**
 * Validate response time
 */
function validateResponseTime(requestParams, response, context, ee, next) {
  const responseTime = response.timings.phases.firstByte;

  if (responseTime > 2000) {
    console.warn(`Slow response detected: ${requestParams.url} took ${responseTime}ms`);
  }

  return next();
}

/**
 * Setup function - runs once before the test
 */
function setupTest(context, events, done) {
  console.log('Starting load test...');
  console.log('Target:', context.vars.target);
  return done();
}

/**
 * Teardown function - runs once after the test
 */
function teardownTest(context, events, done) {
  console.log('Load test completed!');
  return done();
}

module.exports = {
  generateRandomString,
  generateRandomEmail,
  logResponse,
  setCustomHeaders,
  validateResponseTime,
  setupTest,
  teardownTest
};
