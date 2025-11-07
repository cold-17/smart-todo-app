# Performance & Load Testing

This directory contains performance and load testing tools for the Smart Todo App backend.

## Testing Tools

We provide three different testing approaches:

### 1. Artillery.io (Recommended)

Feature-rich load testing toolkit with YAML configuration.

**Installation:**
```bash
npm install -g artillery
```

**Running Tests:**
```bash
# Run basic test
artillery run performance-tests/artillery-config.yml

# Run with report output
artillery run --output report.json performance-tests/artillery-config.yml

# Generate HTML report
artillery report report.json

# Quick test (shorter duration)
artillery quick --count 10 --num 20 http://localhost:5000/api/todos
```

**Features:**
- Multiple test phases (warm-up, ramp-up, sustained, peak, cool-down)
- Custom JavaScript processors for complex scenarios
- Built-in metrics and reporting
- Plugin ecosystem

### 2. K6 by Grafana Labs

Modern load testing tool with JavaScript scripting.

**Installation:**
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

**Running Tests:**
```bash
# Run basic test
k6 run performance-tests/k6-load-test.js

# Custom VUs and duration
k6 run --vus 10 --duration 30s performance-tests/k6-load-test.js

# With custom base URL
k6 run -e BASE_URL=https://api.example.com performance-tests/k6-load-test.js

# With cloud output (requires k6 cloud account)
k6 run --out cloud performance-tests/k6-load-test.js
```

**Features:**
- JavaScript ES6+ scripting
- Custom metrics and thresholds
- Performance thresholds validation
- Cloud integration for distributed testing

### 3. Simple Benchmark Script

Lightweight Node.js script without external dependencies.

**Running:**
```bash
node performance-tests/simple-benchmark.js

# With custom parameters
CONCURRENT_USERS=20 DURATION_SECONDS=60 node performance-tests/simple-benchmark.js

# Against production
BASE_URL=https://api.example.com node performance-tests/simple-benchmark.js
```

**Features:**
- No external dependencies
- Simple and quick
- Basic metrics (response times, error rates)
- Good for quick checks

## Test Scenarios

All testing tools include the following scenarios:

1. **User Registration** - Tests authentication system under load
2. **User Login** - Validates login performance and token generation
3. **Todo CRUD Operations** - Full create, read, update, delete workflow
4. **Analytics Dashboard** - Tests complex aggregation queries
5. **Bulk Operations** - Stress test with rapid todo creation

## Performance Targets

Our performance thresholds:

- **Error Rate**: < 1%
- **P95 Response Time**: < 1500ms
- **P99 Response Time**: < 3000ms
- **Requests/Second**: > 100 (for 20 concurrent users)

## Prerequisites

Before running performance tests:

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Ensure test user exists:**
   The tests use `testuser1@example.com` with password `TestPassword123!`. Either:
   - Create this user manually via the app
   - Or modify test credentials in the test files

3. **Configure environment:**
   ```bash
   # Default test target
   export BASE_URL=http://localhost:5000

   # For production testing
   export BASE_URL=https://api.your-domain.com
   ```

4. **Prepare database:**
   - Use a test database, not production
   - Consider starting with a clean state
   - Or populate with realistic data

## Running in CI/CD

### GitHub Actions Example

```yaml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  performance:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm install

      - name: Start server
        run: |
          cd backend
          npm start &
          sleep 5
        env:
          MONGODB_URI: mongodb://localhost:27017/smart-todo-test
          JWT_SECRET: test-secret

      - name: Run simple benchmark
        run: node backend/performance-tests/simple-benchmark.js

      - name: Install K6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run K6 tests
        run: k6 run backend/performance-tests/k6-load-test.js

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: summary.json
```

## Interpreting Results

### Response Times
- **< 100ms**: Excellent
- **100-500ms**: Good
- **500-1000ms**: Acceptable
- **1000-2000ms**: Needs optimization
- **> 2000ms**: Poor, requires immediate attention

### Error Rates
- **0%**: Perfect
- **< 0.1%**: Excellent
- **< 1%**: Acceptable
- **> 1%**: Needs investigation

### Throughput (Requests/second)
- Depends on your infrastructure
- Monitor for degradation over time
- Compare against baseline metrics

## Performance Optimization Tips

If tests reveal performance issues:

1. **Database Optimization**
   - Add indexes for frequently queried fields
   - Use lean queries for read-only operations
   - Enable MongoDB query profiling

2. **Caching**
   - Implement Redis for session storage
   - Cache frequently accessed data
   - Use CDN for static assets

3. **Code Optimization**
   - Review slow endpoints (check metrics)
   - Optimize database queries (use explain)
   - Reduce middleware overhead
   - Enable gzip compression

4. **Infrastructure**
   - Scale horizontally (add more instances)
   - Use load balancer
   - Upgrade server resources
   - Use CDN for static content

5. **Rate Limiting**
   - Already implemented (see middleware/rateLimiter.js)
   - Consider Redis store for multi-server setup

## Monitoring in Production

Combine load testing with production monitoring:

1. **Sentry** - Already integrated for error tracking
2. **DataDog/New Relic** - APM and metrics
3. **CloudWatch** - If using AWS
4. **Grafana + Prometheus** - Self-hosted monitoring

## Best Practices

1. **Run tests regularly** - Include in CI/CD pipeline
2. **Test against staging** - Never against production
3. **Use realistic data** - Populate test database with realistic data
4. **Gradual load increase** - Use ramp-up phases
5. **Monitor server resources** - Watch CPU, memory, disk I/O during tests
6. **Test different scenarios** - Not just CRUD, test real user workflows
7. **Document baselines** - Keep track of historical performance
8. **Test after changes** - Run performance tests before deploying

## Troubleshooting

### Tests fail immediately
- Check if server is running: `curl http://localhost:5000/health`
- Verify test user credentials exist
- Check database connection

### High error rates
- Check server logs for errors
- Review rate limiting settings (might be too strict for tests)
- Ensure database can handle the load

### Inconsistent results
- Server might be warming up - run warm-up phase
- Other processes consuming resources
- Network instability
- Database performance varies

## Additional Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [K6 Documentation](https://k6.io/docs/)
- [Performance Testing Best Practices](https://www.nginx.com/blog/performance-testing-best-practices/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
