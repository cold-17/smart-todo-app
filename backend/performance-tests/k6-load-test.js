/**
 * K6 Load Testing Script
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run performance-tests/k6-load-test.js
 * Run with custom VUs: k6 run --vus 10 --duration 30s performance-tests/k6-load-test.js
 * Run with cloud output: k6 run --out cloud performance-tests/k6-load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginFailureRate = new Rate('login_failures');
const todoCreationTime = new Trend('todo_creation_time');
const authRequests = new Counter('authenticated_requests');

// Test configuration
export const options = {
  // Define test stages
  stages: [
    { duration: '30s', target: 10 },   // Ramp-up to 10 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 50 },   // Spike to 50 users
    { duration: '1m', target: 20 },    // Scale back to 20 users
    { duration: '30s', target: 0 },    // Ramp-down to 0 users
  ],

  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'], // 95% of requests must complete below 1.5s
    http_req_failed: ['rate<0.01'],                   // Error rate must be below 1%
    login_failures: ['rate<0.05'],                    // Login failure rate below 5%
    todo_creation_time: ['avg<500', 'p(95)<1000'],   // Todo creation performance
  },

  // Browser simulation
  userAgent: 'K6LoadTest/1.0',
};

// Base URL
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test data
const TEST_USERS = [
  { email: 'testuser1@example.com', password: 'TestPassword123!' },
  { email: 'testuser2@example.com', password: 'TestPassword123!' },
  { email: 'testuser3@example.com', password: 'TestPassword123!' },
];

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log(`Starting K6 load test against ${BASE_URL}`);

  // Check if server is accessible
  const response = http.get(`${BASE_URL}/health`);

  if (response.status !== 200) {
    throw new Error(`Server health check failed: ${response.status}`);
  }

  console.log('Server is healthy, starting test...');

  return { startTime: Date.now() };
}

/**
 * Main test function - runs for each virtual user
 */
export default function (data) {
  // Select a random test user
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];

  // Test scenario weights
  const scenario = Math.random();

  if (scenario < 0.6) {
    // 60% - Full CRUD workflow
    fullTodoCrudWorkflow(user);
  } else if (scenario < 0.85) {
    // 25% - Read-only operations
    readOnlyWorkflow(user);
  } else {
    // 15% - Analytics dashboard
    analyticsWorkflow(user);
  }

  // Think time - simulate user reading/thinking
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

/**
 * Login and get auth token
 */
function login(user) {
  const response = http.post(
    `${API_URL}/auth/login`,
    JSON.stringify(user),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login returns token': (r) => r.json('token') !== undefined,
  });

  loginFailureRate.add(!success);

  if (!success) {
    console.error(`Login failed for ${user.email}: ${response.status}`);
    return null;
  }

  return response.json('token');
}

/**
 * Full Todo CRUD workflow
 */
function fullTodoCrudWorkflow(user) {
  group('Full Todo CRUD Workflow', function () {
    // Login
    const token = login(user);
    if (!token) return;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    authRequests.add(1);

    // Create todo
    let todoId;
    group('Create Todo', function () {
      const todoData = {
        title: `Load test todo ${Date.now()}`,
        description: 'This is a load test todo item',
        category: ['work', 'personal', 'health', 'learning'][Math.floor(Math.random() * 4)],
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      };

      const start = Date.now();
      const response = http.post(
        `${API_URL}/todos`,
        JSON.stringify(todoData),
        { headers }
      );
      todoCreationTime.add(Date.now() - start);

      check(response, {
        'create todo status is 201': (r) => r.status === 201,
        'create todo returns ID': (r) => r.json('_id') !== undefined,
      });

      todoId = response.json('_id');
    });

    sleep(0.5);

    // Get all todos
    group('Get All Todos', function () {
      const response = http.get(`${API_URL}/todos`, { headers });

      check(response, {
        'get todos status is 200': (r) => r.status === 200,
        'get todos returns array': (r) => Array.isArray(r.json()),
      });
    });

    sleep(0.5);

    // Update todo
    if (todoId) {
      group('Update Todo', function () {
        const updateData = {
          title: `Updated load test todo ${Date.now()}`,
          completed: Math.random() > 0.5,
        };

        const response = http.put(
          `${API_URL}/todos/${todoId}`,
          JSON.stringify(updateData),
          { headers }
        );

        check(response, {
          'update todo status is 200': (r) => r.status === 200,
        });
      });

      sleep(0.5);

      // Delete todo
      group('Delete Todo', function () {
        const response = http.del(`${API_URL}/todos/${todoId}`, { headers });

        check(response, {
          'delete todo status is 200': (r) => r.status === 200,
        });
      });
    }
  });
}

/**
 * Read-only workflow
 */
function readOnlyWorkflow(user) {
  group('Read-Only Workflow', function () {
    const token = login(user);
    if (!token) return;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    authRequests.add(1);

    // Get all todos
    http.get(`${API_URL}/todos`, { headers });
    sleep(0.3);

    // Get todo stats
    const statsResponse = http.get(`${API_URL}/todos/stats`, { headers });
    check(statsResponse, {
      'stats status is 200': (r) => r.status === 200,
      'stats has total': (r) => r.json('total') !== undefined,
    });

    sleep(0.3);

    // Get filtered todos
    const categories = ['work', 'personal', 'health', 'learning'];
    const category = categories[Math.floor(Math.random() * categories.length)];
    http.get(`${API_URL}/todos?category=${category}`, { headers });
  });
}

/**
 * Analytics workflow
 */
function analyticsWorkflow(user) {
  group('Analytics Workflow', function () {
    const token = login(user);
    if (!token) return;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    authRequests.add(1);

    // Get analytics for different time periods
    const periods = [7, 30, 90];

    periods.forEach(days => {
      const response = http.get(`${API_URL}/analytics?days=${days}`, { headers });

      check(response, {
        [`analytics ${days}d status is 200`]: (r) => r.status === 200,
        [`analytics ${days}d has data`]: (r) => r.json('dailyActivity') !== undefined,
      });

      sleep(0.3);
    });
  });
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Test completed in ${duration.toFixed(2)} seconds`);
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  console.log('\n========================================');
  console.log('K6 Load Test Summary');
  console.log('========================================');
  console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%`);
  console.log(`Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log('========================================\n');

  return {
    'summary.json': JSON.stringify(data, null, 2),
  };
}
