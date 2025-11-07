#!/usr/bin/env node

/**
 * Simple Performance Benchmark Script
 *
 * A lightweight alternative to Artillery/K6 for quick performance checks
 * Uses Node.js native modules only
 *
 * Usage: node performance-tests/simple-benchmark.js
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '10', 10);
const DURATION_SECONDS = parseInt(process.env.DURATION_SECONDS || '30', 10);
const TEST_USER = {
  email: 'testuser1@example.com',
  password: 'TestPassword123!'
};

// Metrics
const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: {},
  startTime: null,
  endTime: null
};

/**
 * Make HTTP request
 */
function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const startTime = performance.now();

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          duration
        });
      });
    });

    req.on('error', (error) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      reject({
        error,
        duration
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Parse URL
 */
function parseUrl(urlString) {
  const url = new URL(urlString);
  return {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search
  };
}

/**
 * Login and get token
 */
async function login() {
  const urlParts = parseUrl(`${BASE_URL}/api/auth/login`);

  const options = {
    ...urlParts,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, TEST_USER);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      return data.token;
    }

    throw new Error(`Login failed: ${response.statusCode}`);
  } catch (error) {
    console.error('Login error:', error.message || error);
    return null;
  }
}

/**
 * Test scenario - Full CRUD workflow
 */
async function runTestScenario(token) {
  metrics.totalRequests++;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Create todo
    const createUrl = parseUrl(`${BASE_URL}/api/todos`);
    const createOptions = {
      ...createUrl,
      method: 'POST',
      headers
    };

    const todoData = {
      title: `Benchmark todo ${Date.now()}`,
      description: 'Performance test',
      category: 'work',
      priority: 'medium'
    };

    const createResponse = await makeRequest(createOptions, todoData);
    metrics.responseTimes.push(createResponse.duration);

    if (createResponse.statusCode !== 201) {
      throw new Error(`Create failed: ${createResponse.statusCode}`);
    }

    const todo = JSON.parse(createResponse.body);

    // Get all todos
    const getUrl = parseUrl(`${BASE_URL}/api/todos`);
    const getOptions = {
      ...getUrl,
      method: 'GET',
      headers
    };

    const getResponse = await makeRequest(getOptions);
    metrics.responseTimes.push(getResponse.duration);

    // Update todo
    const updateUrl = parseUrl(`${BASE_URL}/api/todos/${todo._id}`);
    const updateOptions = {
      ...updateUrl,
      method: 'PUT',
      headers
    };

    const updateData = { completed: true };
    const updateResponse = await makeRequest(updateOptions, updateData);
    metrics.responseTimes.push(updateResponse.duration);

    // Delete todo
    const deleteUrl = parseUrl(`${BASE_URL}/api/todos/${todo._id}`);
    const deleteOptions = {
      ...deleteUrl,
      method: 'DELETE',
      headers
    };

    const deleteResponse = await makeRequest(deleteOptions);
    metrics.responseTimes.push(deleteResponse.duration);

    metrics.successfulRequests++;
  } catch (error) {
    metrics.failedRequests++;

    const errorKey = error.message || 'Unknown error';
    metrics.errors[errorKey] = (metrics.errors[errorKey] || 0) + 1;
  }
}

/**
 * Run concurrent users
 */
async function runConcurrentUsers(token, durationMs) {
  const endTime = Date.now() + durationMs;
  const promises = [];

  // Start concurrent users
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    promises.push(runUser(token, endTime));
  }

  await Promise.all(promises);
}

/**
 * Simulate single user
 */
async function runUser(token, endTime) {
  while (Date.now() < endTime) {
    await runTestScenario(token);

    // Think time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  }
}

/**
 * Calculate statistics
 */
function calculateStats() {
  const sorted = metrics.responseTimes.sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);

  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / sorted.length,
    p50: sorted[p50Index],
    p95: sorted[p95Index],
    p99: sorted[p99Index]
  };
}

/**
 * Print results
 */
function printResults() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const stats = calculateStats();
  const requestsPerSecond = metrics.totalRequests / duration;
  const errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Performance Benchmark Results');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Duration:              ${duration.toFixed(2)}s`);
  console.log(`Concurrent Users:      ${CONCURRENT_USERS}`);
  console.log(`\nRequests:`);
  console.log(`  Total:               ${metrics.totalRequests}`);
  console.log(`  Successful:          ${metrics.successfulRequests}`);
  console.log(`  Failed:              ${metrics.failedRequests}`);
  console.log(`  Requests/sec:        ${requestsPerSecond.toFixed(2)}`);
  console.log(`  Error Rate:          ${errorRate.toFixed(2)}%`);
  console.log(`\nResponse Times (ms):`);
  console.log(`  Min:                 ${stats.min.toFixed(2)}`);
  console.log(`  Max:                 ${stats.max.toFixed(2)}`);
  console.log(`  Average:             ${stats.avg.toFixed(2)}`);
  console.log(`  Median (P50):        ${stats.p50.toFixed(2)}`);
  console.log(`  P95:                 ${stats.p95.toFixed(2)}`);
  console.log(`  P99:                 ${stats.p99.toFixed(2)}`);

  if (Object.keys(metrics.errors).length > 0) {
    console.log(`\nErrors:`);
    Object.entries(metrics.errors).forEach(([error, count]) => {
      console.log(`  ${error}: ${count}`);
    });
  }

  console.log('═══════════════════════════════════════════════════════\n');

  // Performance assessment
  if (errorRate > 1) {
    console.log('⚠️  WARNING: Error rate exceeds 1%');
  }

  if (stats.p95 > 1500) {
    console.log('⚠️  WARNING: P95 response time exceeds 1500ms');
  }

  if (errorRate <= 1 && stats.p95 <= 1500) {
    console.log('✅ All performance targets met!');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Smart Todo App - Performance Benchmark');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Target URL:            ${BASE_URL}`);
  console.log(`Concurrent Users:      ${CONCURRENT_USERS}`);
  console.log(`Duration:              ${DURATION_SECONDS}s`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Check server health
  console.log('Checking server health...');
  try {
    const healthUrl = parseUrl(`${BASE_URL}/health`);
    await makeRequest({ ...healthUrl, method: 'GET' });
    console.log('✓ Server is healthy\n');
  } catch (error) {
    console.error('✗ Server health check failed:', error.message);
    process.exit(1);
  }

  // Login
  console.log('Logging in...');
  const token = await login();

  if (!token) {
    console.error('✗ Login failed');
    process.exit(1);
  }

  console.log('✓ Login successful\n');

  // Run test
  console.log('Starting performance test...\n');

  metrics.startTime = Date.now();
  await runConcurrentUsers(token, DURATION_SECONDS * 1000);
  metrics.endTime = Date.now();

  // Print results
  printResults();
}

// Run benchmark
main().catch(error => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
