# Smart Todo App - Production Documentation

Complete guide for deploying and managing the Smart Todo App in production.

## 📚 Documentation Index

### Deployment & Infrastructure

- **[Production Deployment Guide](./PRODUCTION-DEPLOYMENT.md)** - Complete guide for deploying to production
  - AWS EC2, ECS/Fargate, DigitalOcean, Google Cloud Run, Heroku
  - Process management (PM2, systemd)
  - CI/CD pipelines
  - Scaling strategies

- **[SSL/TLS Certificate Setup](./SSL-TLS-SETUP.md)** - Guide for securing your application with HTTPS
  - Let's Encrypt (free)
  - Cloud provider certificates (AWS ACM, CloudFlare)
  - Nginx/Caddy configuration
  - Certificate renewal automation

### Operations & Maintenance

- **[Database Backups](../backend/scripts/)** - Automated backup and restore
  - Daily automated backups (`backup-database.js`)
  - Restore procedures (`restore-database.js`)
  - S3 integration for remote backups
  - Cron scheduling examples

- **[Performance Testing](../backend/performance-tests/)** - Load and performance testing
  - Artillery.io configuration
  - K6 load testing scripts
  - Simple benchmark tool
  - Performance thresholds and metrics

### Security & Monitoring

- **Rate Limiting** - Already implemented (`backend/middleware/rateLimiter.js`)
  - API rate limiting: 100 req/15min
  - Auth endpoints: 5 req/15min
  - AI endpoints: 20 req/15min
  - Redis integration for distributed systems

- **CORS Configuration** - Already implemented (`backend/server.js`)
  - Origin whitelisting
  - Credentials support
  - Method restrictions

- **Sentry Monitoring** - Already implemented (`backend/config/sentry.js`)
  - Error tracking
  - Performance monitoring
  - User context tracking
  - Custom error filtering

## 🚀 Quick Start

### 1. Pre-Production Checklist

```bash
# Run all checks before deploying
cd backend

# Run tests
npm test

# Run security audit
npm audit

# Run performance tests
node performance-tests/simple-benchmark.js

# Build frontend
cd ../frontend
npm run build
```

### 2. Environment Configuration

Create production `.env` file with required variables:

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
CLIENT_URL=https://yourdomain.com
SENTRY_DSN=https://...@sentry.io/...
```

See [Production Deployment Guide](./PRODUCTION-DEPLOYMENT.md#environment-setup) for complete list.

### 3. Deploy

Choose your deployment method:

- **Quick & Easy**: [Heroku](#heroku-deployment)
- **Full Control**: [AWS EC2](#aws-ec2-deployment)
- **Container**: [AWS ECS/Fargate](#aws-ecs-deployment)
- **Serverless**: [Google Cloud Run](#google-cloud-run-deployment)

### 4. Post-Deployment

```bash
# Setup SSL certificate
sudo certbot --nginx -d yourdomain.com

# Setup automated backups
crontab -e
# Add: 0 2 * * * cd /path/to/backend && node scripts/backup-database.js

# Monitor application
pm2 monit  # or check Sentry dashboard
```

## 📊 Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │   CDN   │ (Optional)
                    │CloudFlare│
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  SSL/TLS │
                    │ Let's    │
                    │ Encrypt  │
                    └────┬────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
     ┌────▼────┐                  ┌────▼────┐
     │  Nginx  │                  │   ALB   │ (AWS)
     │ Reverse │                  │  Load   │
     │  Proxy  │                  │ Balancer│
     └────┬────┘                  └────┬────┘
          │                             │
          └──────────────┬──────────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
    ┌────▼────┐                      ┌───▼────┐
    │ Node.js │◄────────────────────►│ Node.js│
    │  App 1  │      Socket.io       │  App 2 │
    │  (PM2)  │                      │  (PM2) │
    └────┬────┘                      └───┬────┘
         │                                │
         └────────────┬───────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
    ┌────▼────┐              ┌────▼────┐
    │ MongoDB │              │  Redis  │
    │  Atlas  │              │  Cache  │
    │Primary  │              │ Session │
    └────┬────┘              └─────────┘
         │
    ┌────▼────┐
    │  Backup │
    │  to S3  │
    └─────────┘
```

## 🔒 Security Features

### Already Implemented ✅

1. **Authentication**
   - JWT-based authentication
   - bcrypt password hashing
   - Secure token storage

2. **API Security**
   - Helmet security headers
   - CORS with origin whitelisting
   - NoSQL injection prevention (Joi validation)
   - Rate limiting per endpoint type
   - Input validation and sanitization

3. **Monitoring**
   - Sentry error tracking
   - Structured logging (Winston)
   - Request/response logging

### Additional Recommendations

1. **Enable HTTPS** - See [SSL/TLS Setup Guide](./SSL-TLS-SETUP.md)
2. **Database Security**
   - Enable MongoDB authentication
   - Use connection string with credentials
   - Network restrictions (IP whitelist)
3. **Secrets Management**
   - Use environment variables
   - Consider AWS Secrets Manager
4. **Regular Updates**
   - `npm audit fix` regularly
   - Monitor security advisories

## 📈 Performance Optimization

### Current Performance Targets

- **Response Time (P95)**: < 1500ms ✅
- **Response Time (P99)**: < 3000ms ✅
- **Error Rate**: < 1% ✅
- **Uptime**: > 99.9%

### Optimization Checklist

- [x] Database indexes created
- [x] Connection pooling configured
- [x] Gzip compression enabled (Helmet)
- [x] Rate limiting implemented
- [ ] Redis caching (optional)
- [ ] CDN for static assets (optional)
- [ ] Horizontal scaling (as needed)

### Load Testing

```bash
# Quick benchmark
node backend/performance-tests/simple-benchmark.js

# Full Artillery test
cd backend
artillery run performance-tests/artillery-config.yml

# K6 test
k6 run backend/performance-tests/k6-load-test.js
```

See [Performance Testing Guide](../backend/performance-tests/README.md) for details.

## 🔄 Backup & Recovery

### Automated Backups

**Setup:**
```bash
# Schedule daily backups
crontab -e

# Add this line (daily at 2 AM)
0 2 * * * cd /path/to/backend && node scripts/backup-database.js >> logs/backup.log 2>&1
```

**Features:**
- Automatic compression
- Configurable retention (default 30 days)
- S3 upload support
- Email notifications (optional)

### Recovery Procedure

```bash
# List available backups
node scripts/restore-database.js

# Restore specific backup
node scripts/restore-database.js backup-2025-01-15-143022.tar.gz
```

See backup scripts for details:
- [`backup-database.js`](../backend/scripts/backup-database.js)
- [`restore-database.js`](../backend/scripts/restore-database.js)

## 📱 Monitoring Dashboard

### Sentry (Error Tracking)

**Already Configured!** Just add `SENTRY_DSN` to environment variables.

**Features:**
- Real-time error tracking
- Performance monitoring
- User context
- Source maps support
- Email/Slack notifications

**Setup:**
1. Create account at sentry.io
2. Create new project
3. Copy DSN
4. Set `SENTRY_DSN` environment variable
5. Deploy!

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web dashboard
pm2 plus  # Sign up at pm2.io

# Logs
pm2 logs smart-todo-app --lines 100
```

### Custom Health Checks

**Built-in endpoint:**
```bash
curl http://localhost:5000/health

# Response:
{
  "status": "ok",
  "timestamp": "2025-01-15T14:30:22.123Z",
  "uptime": 3600.5,
  "environment": "production"
}
```

## 🚨 Incident Response

### Common Issues

1. **Application Crashes**
   ```bash
   # Check PM2 status
   pm2 status

   # Check logs
   pm2 logs smart-todo-app --err

   # Restart
   pm2 restart smart-todo-app
   ```

2. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod

   # Check connection from app server
   mongosh "mongodb+srv://cluster.mongodb.net" --username user
   ```

3. **High Memory Usage**
   ```bash
   # Check memory
   pm2 monit

   # Restart with memory limit
   pm2 restart smart-todo-app --max-memory-restart 1G
   ```

4. **Rate Limit Issues**
   - Check logs: `grep "Rate limit exceeded" logs/combined.log`
   - Adjust limits: `backend/middleware/rateLimiter.js`
   - Consider Redis store for distributed rate limiting

### Getting Help

1. **Check Logs**
   - Application: `pm2 logs`
   - Nginx: `/var/log/nginx/error.log`
   - System: `journalctl -u smart-todo-app`

2. **Check Monitoring**
   - Sentry dashboard
   - PM2 Plus dashboard
   - Server metrics (CPU, memory, disk)

3. **Debug Mode**
   ```bash
   # Enable debug logging
   DEBUG=* node server.js
   ```

## 📚 Additional Resources

### Official Documentation
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Express.js Production Guide](https://expressjs.com/en/advanced/best-practice-performance.html)

### Tools & Services
- [Sentry](https://sentry.io) - Error tracking
- [PM2](https://pm2.keymetrics.io) - Process management
- [Artillery](https://artillery.io) - Load testing
- [Let's Encrypt](https://letsencrypt.org) - Free SSL certificates

### Community
- [GitHub Issues](https://github.com/yourusername/smart-todo-app/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/node.js)

## 📝 Changelog

### v1.0.0 - Production Ready
- ✅ Rate limiting implemented
- ✅ CORS configured
- ✅ Sentry monitoring integrated
- ✅ Automated backups system
- ✅ SSL/TLS documentation
- ✅ Production deployment guides
- ✅ Performance testing suite
- ✅ Comprehensive logging

## 🤝 Contributing

See main [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## 📄 License

See [LICENSE](../LICENSE) for details.

---

**Need Help?** Check the guides above or [open an issue](https://github.com/yourusername/smart-todo-app/issues).
