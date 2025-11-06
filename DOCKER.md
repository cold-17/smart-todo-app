# Docker Setup Guide

## Overview

The Smart Todo App is fully containerized with Docker for easy development and deployment. The setup includes:
- **Backend**: Node.js API server
- **Frontend**: React + Vite (dev) or Nginx (prod)
- **MongoDB**: Database with persistent storage

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## Quick Start (Development)

### 1. Start the entire stack

```bash
docker-compose up
```

That's it! The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

### 2. Stop the stack

```bash
docker-compose down
```

### 3. Stop and remove volumes (clean slate)

```bash
docker-compose down -v
```

## Development Workflow

### Start with live reload

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild after dependency changes

```bash
# Rebuild and restart
docker-compose up --build

# Rebuild specific service
docker-compose up --build backend
```

### Run commands in containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Run tests in backend
docker-compose exec backend npm test

# Install new package
docker-compose exec backend npm install <package-name>
```

### Database access

```bash
# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password123

# View database
docker-compose exec mongodb mongosh -u admin -p password123 --eval "use smart-todo-app; db.users.find().pretty()"
```

## Production Deployment

### 1. Create production environment file

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` with production values:
```bash
# Generate secure JWT secret
openssl rand -base64 32

# Update MongoDB password
# Update CLIENT_URL to your domain
# Add OPENAI_API_KEY if using AI features
```

### 2. Build and start production containers

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Stop production services

```bash
docker-compose -f docker-compose.prod.yml down
```

## Container Details

### Backend Container

**Image**: Node.js 20 Alpine
**Port**: 5000
**Volumes**:
- `./backend:/app` - Source code (dev only)
- `/app/node_modules` - Dependencies
- `backend_logs:/app/logs` - Log files

**Environment Variables**:
- `NODE_ENV` - development/production
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CLIENT_URL` - Frontend URL for CORS
- `OPENAI_API_KEY` - OpenAI API key (optional)

**Health Check**: GET /health every 30s

### Frontend Container

**Development**:
- Image: Node.js 20 Alpine with Vite dev server
- Port: 5173
- Hot reload enabled

**Production**:
- Image: Nginx Alpine
- Port: 80 (HTTP), 443 (HTTPS)
- Optimized build with caching headers
- SPA fallback routing

**Health Check**: HTTP GET / every 30s

### MongoDB Container

**Image**: MongoDB 7.0
**Port**: 27017 (dev only)
**Volumes**:
- `mongodb_data:/data/db` - Database files
- `mongodb_config:/data/configdb` - Config files

**Authentication**:
- Development: admin/password123
- Production: Set via environment variables

## Architecture

```
┌─────────────────────────────────────────────┐
│                 User Browser                │
└──────────────┬──────────────────────────────┘
               │
               │ HTTP
               ▼
┌──────────────────────────────┐
│  Frontend Container          │
│  - Vite Dev (dev)           │
│  - Nginx (prod)             │
│  Port: 5173 / 80            │
└──────────────┬───────────────┘
               │
               │ API Calls
               ▼
┌──────────────────────────────┐
│  Backend Container           │
│  - Node.js + Express        │
│  - JWT Auth                 │
│  Port: 5000                 │
└──────────────┬───────────────┘
               │
               │ MongoDB Protocol
               ▼
┌──────────────────────────────┐
│  MongoDB Container           │
│  - MongoDB 7.0              │
│  - Persistent Storage       │
│  Port: 27017                │
└──────────────────────────────┘
```

## Docker Commands Cheatsheet

### Container Management

```bash
# List running containers
docker-compose ps

# Start services
docker-compose start

# Stop services
docker-compose stop

# Restart service
docker-compose restart backend

# Remove stopped containers
docker-compose rm
```

### Logs & Debugging

```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs backend
```

### Images & Cleanup

```bash
# List images
docker images

# Remove unused images
docker image prune

# Remove all unused data
docker system prune

# Remove everything (including volumes)
docker system prune -a --volumes
```

### Health Checks

```bash
# Check container health
docker-compose ps

# Inspect health
docker inspect smart-todo-backend | grep -A 10 Health

# View health check logs
docker inspect smart-todo-backend --format='{{json .State.Health}}' | jq
```

## Volumes

### Development Volumes

- `mongodb_data` - MongoDB database files
- `mongodb_config` - MongoDB configuration
- `backend_logs` - Application logs

### Production Volumes

- `mongodb_data_prod` - MongoDB database files
- `mongodb_config_prod` - MongoDB configuration
- `backend_logs_prod` - Application logs

### Backup Volumes

```bash
# Backup MongoDB
docker run --rm \
  --volumes-from smart-todo-mongodb \
  -v $(pwd):/backup \
  mongo:7.0 \
  tar czf /backup/mongodb-backup-$(date +%Y%m%d).tar.gz /data/db

# Restore MongoDB
docker run --rm \
  --volumes-from smart-todo-mongodb \
  -v $(pwd):/backup \
  mongo:7.0 \
  tar xzf /backup/mongodb-backup-YYYYMMDD.tar.gz
```

## Troubleshooting

### Port already in use

```bash
# Check what's using the port
lsof -i :5000
lsof -i :5173
lsof -i :27017

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "5001:5000"  # Map host 5001 to container 5000
```

### MongoDB connection issues

```bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify MongoDB is healthy
docker-compose ps

# Test connection
docker-compose exec mongodb mongosh -u admin -p password123 --eval "db.adminCommand('ping')"
```

### Container won't start

```bash
# View container logs
docker-compose logs <service-name>

# Check container status
docker-compose ps -a

# Rebuild container
docker-compose up --build <service-name>

# Start in foreground for debugging
docker-compose up <service-name>
```

### Permission issues

```bash
# Fix log directory permissions
docker-compose exec backend chown -R nodejs:nodejs /app/logs

# Fix volume permissions
sudo chown -R $USER:$USER ./backend/logs
```

### Clean slate restart

```bash
# Stop everything
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild and start
docker-compose up --build
```

## Production Best Practices

1. **Use secrets management** - Never commit .env.docker
2. **Enable HTTPS** - Use reverse proxy (Nginx, Traefik)
3. **Set resource limits** - Already configured in docker-compose.prod.yml
4. **Monitor containers** - Use Prometheus + Grafana
5. **Backup databases** - Automated MongoDB backups
6. **Update regularly** - Keep base images updated
7. **Security scanning** - Run `docker scan` on images
8. **Use Docker secrets** - For sensitive environment variables

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Docker Images

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build images
        run: docker-compose -f docker-compose.prod.yml build

      - name: Run tests
        run: docker-compose exec backend npm test
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Official Image](https://hub.docker.com/_/mongo)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
