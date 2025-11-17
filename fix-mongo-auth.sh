#!/bin/bash

# This script fixes the MongoDB authentication issue
# Run this ON YOUR DROPLET as root

cd /opt/smart-todo-app

echo "Stopping all containers..."
docker-compose down

echo ""
echo "Reading current MongoDB credentials from .env.docker..."
MONGO_USER=$(grep MONGO_INITDB_ROOT_USERNAME .env.docker | cut -d'=' -f2)
MONGO_PASS=$(grep MONGO_INITDB_ROOT_PASSWORD .env.docker | cut -d'=' -f2)

echo "MongoDB Username: $MONGO_USER"
echo "MongoDB Password: ****"

echo ""
echo "Updating MONGODB_URI to match these credentials..."

# Escape special characters in password for sed
MONGO_PASS_ESCAPED=$(echo "$MONGO_PASS" | sed 's/[\/&]/\\&/g')

# Update MONGODB_URI to use the correct credentials
sed -i "s|MONGODB_URI=.*|MONGODB_URI=mongodb://${MONGO_USER}:${MONGO_PASS_ESCAPED}@mongodb:27017/smart-todo-app?authSource=admin|g" .env.docker

echo ""
echo "Updated .env.docker with matching credentials"
echo ""
echo "Rebuilding and starting containers..."
docker-compose up -d --build

echo ""
echo "Waiting for services to start..."
sleep 10

echo ""
echo "Checking backend logs..."
docker-compose logs --tail=20 backend

echo ""
echo "Done! Check if the MongoDB connection error is gone."
