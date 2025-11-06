# Docker Quick Start

## 🚀 Get Started in 30 Seconds

### Development Mode

```bash
# Start the entire application
docker-compose up

# That's it! Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:5000
# - MongoDB: localhost:27017
```

### Production Mode

```bash
# 1. Copy environment template
cp .env.docker.example .env.docker

# 2. Edit .env.docker with your values
nano .env.docker

# 3. Start production stack
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d
```

## 📋 Common Commands

```bash
# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Run backend tests
docker-compose exec backend npm test

# Access MongoDB
docker-compose exec mongodb mongosh -u admin -p password123

# Clean slate (removes data!)
docker-compose down -v
```

## 🏗️ What's Included

- **Backend**: Node.js 20 + Express + MongoDB
- **Frontend**: React 19 + Vite (dev) / Nginx (prod)
- **Database**: MongoDB 7.0 with persistent storage
- **Security**: Non-root users, health checks, resource limits
- **Development**: Hot reload, source maps, debugging

## 📖 Full Documentation

See [DOCKER.md](./DOCKER.md) for complete documentation including:
- Detailed configuration
- Troubleshooting guide
- Production deployment
- Backup strategies
- CI/CD integration

## ⚠️ Important Notes

**Development (docker-compose.yml)**:
- Uses default credentials (admin/password123)
- Ports exposed to host
- Volume mounts for live reload
- Debug logging enabled

**Production (docker-compose.prod.yml)**:
- Requires .env.docker file
- No default credentials
- Resource limits enforced
- Optimized builds
- Security hardened

## 🔧 Prerequisites

Install Docker:
- **macOS/Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux**:
  ```bash
  # Install Docker
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh

  # Install Docker Compose
  sudo apt-get install docker-compose-plugin
  ```

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Kill existing processes
killall node
# Or change ports in docker-compose.yml
```

**MongoDB won't start?**
```bash
# Check logs
docker-compose logs mongodb
# Try clean restart
docker-compose down -v && docker-compose up
```

**Can't connect to backend?**
```bash
# Check if backend is healthy
docker-compose ps
# View backend logs
docker-compose logs backend
```

## 🎯 Next Steps

1. Start development: `docker-compose up`
2. Make changes to code (auto-reloads!)
3. Run tests: `docker-compose exec backend npm test`
4. For production deployment, see [DOCKER.md](./DOCKER.md)
