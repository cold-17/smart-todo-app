#!/bin/bash

# Quick status check script for Smart Todo App
# Run this to check if everything is working

echo "🔍 Smart Todo App - Status Check"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker is running
echo -e "${YELLOW}Docker Status:${NC}"
if systemctl is-active --quiet docker; then
    echo -e "  ${GREEN}✓ Docker is running${NC}"
else
    echo -e "  ${RED}✗ Docker is not running${NC}"
    exit 1
fi

echo ""

# Check containers
echo -e "${YELLOW}Container Status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""

# Check backend health
echo -e "${YELLOW}Backend Health:${NC}"
HEALTH=$(curl -s http://localhost:5000/health 2>/dev/null || echo "failed")
if [[ $HEALTH == *"ok"* ]]; then
    echo -e "  ${GREEN}✓ Backend is healthy${NC}"
    echo "  Response: $HEALTH"
else
    echo -e "  ${RED}✗ Backend health check failed${NC}"
fi

echo ""

# Check frontend
echo -e "${YELLOW}Frontend Status:${NC}"
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "000")
if [ "$FRONTEND" == "200" ]; then
    echo -e "  ${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "  ${RED}✗ Frontend is not accessible (HTTP $FRONTEND)${NC}"
fi

echo ""

# Check Nginx
echo -e "${YELLOW}Nginx Status:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "  ${GREEN}✓ Nginx is running${NC}"
else
    echo -e "  ${RED}✗ Nginx is not running${NC}"
fi

echo ""

# Check SSL certificate
echo -e "${YELLOW}SSL Certificate:${NC}"
certbot certificates 2>/dev/null | grep -A 2 "Certificate Name" || echo "  No certificates found (run certbot to set up)"

echo ""

# Check disk space
echo -e "${YELLOW}Disk Space:${NC}"
df -h / | tail -1 | awk '{print "  Used: "$3" / "$2" ("$5")"}'

echo ""

# Check memory
echo -e "${YELLOW}Memory Usage:${NC}"
free -h | grep Mem | awk '{print "  Used: "$3" / "$2" ("$3/$2*100"%)"}'

echo ""

# Docker resource usage
echo -e "${YELLOW}Docker Resource Usage:${NC}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "=================================="
echo "Status check complete!"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "  Restart: docker-compose -f docker-compose.prod.yml restart"
echo "  Stop: docker-compose -f docker-compose.prod.yml down"
