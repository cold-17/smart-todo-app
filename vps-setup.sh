#!/bin/bash

# VPS Setup Script for Smart Todo App
# Run this on your VPS after initial server setup

set -e

echo "🚀 Smart Todo App - VPS Setup Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use: sudo ./vps-setup.sh)${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt-get install -y docker-compose
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Installing additional tools...${NC}"
apt-get update -qq
apt-get install -y git nano curl ufw nginx certbot python3-certbot-nginx
echo -e "${GREEN}✓ Tools installed${NC}"

echo ""
echo -e "${YELLOW}Step 4: Configuring firewall...${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo -e "${GREEN}✓ Firewall configured${NC}"

echo ""
echo -e "${YELLOW}Step 5: Creating application directory...${NC}"
mkdir -p /opt/smart-todo-app
cd /opt/smart-todo-app
echo -e "${GREEN}✓ Directory created at /opt/smart-todo-app${NC}"

echo ""
echo -e "${GREEN}======================================"
echo "✅ VPS Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. cd /opt/smart-todo-app"
echo "2. Clone your repository: git clone https://github.com/YOUR_USERNAME/smart-todo-app.git ."
echo "3. Create .env.docker file with your configuration"
echo "4. Run: docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d"
echo ""
