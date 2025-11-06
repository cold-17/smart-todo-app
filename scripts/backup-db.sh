#!/bin/bash

################################################################################
# MongoDB Backup Script
#
# This script creates a backup of the MongoDB database and stores it with a
# timestamp. Optionally uploads to cloud storage (S3, Google Cloud Storage, etc.)
#
# Usage:
#   ./scripts/backup-db.sh [options]
#
# Options:
#   -u, --upload         Upload backup to cloud storage
#   -k, --keep DAYS      Number of days to keep backups (default: 30)
#   -c, --compress       Compress backup with gzip
#   -h, --help           Show this help message
#
# Environment Variables (set in .env or pass directly):
#   MONGODB_URI          MongoDB connection string (required)
#   BACKUP_DIR           Directory to store backups (default: ./backups)
#   S3_BUCKET            S3 bucket name for cloud upload (optional)
#   GCS_BUCKET           Google Cloud Storage bucket (optional)
#
# Examples:
#   # Basic backup
#   ./scripts/backup-db.sh
#
#   # Backup and upload to S3
#   ./scripts/backup-db.sh --upload --compress
#
#   # Backup and keep for 7 days
#   ./scripts/backup-db.sh --keep 7
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
UPLOAD=false
KEEP_DAYS=30
COMPRESS=false
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -u|--upload)
      UPLOAD=true
      shift
      ;;
    -k|--keep)
      KEEP_DAYS="$2"
      shift 2
      ;;
    -c|--compress)
      COMPRESS=true
      shift
      ;;
    -h|--help)
      sed -n '2,36p' "$0" | sed 's/^# //'
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Load environment variables if .env exists
if [ -f .env ]; then
  echo -e "${YELLOW}Loading environment from .env${NC}"
  export $(grep -v '^#' .env | xargs)
fi

# Check if MONGODB_URI is set
if [ -z "$MONGODB_URI" ]; then
  echo -e "${RED}Error: MONGODB_URI is not set${NC}"
  echo "Please set it in .env file or pass as environment variable"
  exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Extract database name from MongoDB URI
# Handle both mongodb:// and mongodb+srv:// formats
DB_NAME=$(echo "$MONGODB_URI" | sed -E 's|.*/([-_a-zA-Z0-9]+)(\?.*)?$|\1|')

if [ -z "$DB_NAME" ]; then
  echo -e "${RED}Error: Could not extract database name from MONGODB_URI${NC}"
  exit 1
fi

# Backup file path
BACKUP_NAME="backup-${DB_NAME}-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo -e "${GREEN}Starting MongoDB backup...${NC}"
echo "Database: $DB_NAME"
echo "Timestamp: $TIMESTAMP"
echo "Backup location: $BACKUP_PATH"
echo ""

# Perform backup using mongodump
echo "Running mongodump..."
if mongodump --uri="$MONGODB_URI" --out="$BACKUP_PATH" 2>&1; then
  echo -e "${GREEN}✓ Backup completed successfully${NC}"
else
  echo -e "${RED}✗ Backup failed${NC}"
  exit 1
fi

# Compress if requested
if [ "$COMPRESS" = true ]; then
  echo ""
  echo "Compressing backup..."
  tar -czf "${BACKUP_PATH}.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Compression completed${NC}"
    # Remove uncompressed backup
    rm -rf "$BACKUP_PATH"
    BACKUP_PATH="${BACKUP_PATH}.tar.gz"
  else
    echo -e "${RED}✗ Compression failed${NC}"
    exit 1
  fi
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "Backup size: $BACKUP_SIZE"

# Upload to cloud storage if requested
if [ "$UPLOAD" = true ]; then
  echo ""
  echo "Uploading backup to cloud storage..."

  # Upload to S3 if S3_BUCKET is set
  if [ -n "$S3_BUCKET" ]; then
    echo "Uploading to S3 bucket: $S3_BUCKET"

    if command -v aws &> /dev/null; then
      aws s3 cp "$BACKUP_PATH" "s3://${S3_BUCKET}/backups/$(basename $BACKUP_PATH)"

      if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Uploaded to S3${NC}"
      else
        echo -e "${YELLOW}⚠ Failed to upload to S3${NC}"
      fi
    else
      echo -e "${YELLOW}⚠ AWS CLI not installed, skipping S3 upload${NC}"
    fi
  fi

  # Upload to Google Cloud Storage if GCS_BUCKET is set
  if [ -n "$GCS_BUCKET" ]; then
    echo "Uploading to GCS bucket: $GCS_BUCKET"

    if command -v gsutil &> /dev/null; then
      gsutil cp "$BACKUP_PATH" "gs://${GCS_BUCKET}/backups/$(basename $BACKUP_PATH)"

      if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Uploaded to Google Cloud Storage${NC}"
      else
        echo -e "${YELLOW}⚠ Failed to upload to GCS${NC}"
      fi
    else
      echo -e "${YELLOW}⚠ gsutil not installed, skipping GCS upload${NC}"
    fi
  fi

  if [ -z "$S3_BUCKET" ] && [ -z "$GCS_BUCKET" ]; then
    echo -e "${YELLOW}⚠ No cloud storage bucket configured${NC}"
    echo "Set S3_BUCKET or GCS_BUCKET environment variable to enable upload"
  fi
fi

# Clean up old backups
echo ""
echo "Cleaning up old backups (keeping ${KEEP_DAYS} days)..."

find "$BACKUP_DIR" -type f -name "backup-${DB_NAME}-*" -mtime +${KEEP_DAYS} -delete
find "$BACKUP_DIR" -type d -name "backup-${DB_NAME}-*" -mtime +${KEEP_DAYS} -exec rm -rf {} + 2>/dev/null || true

echo -e "${GREEN}✓ Cleanup completed${NC}"

# Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}Backup Summary${NC}"
echo "═══════════════════════════════════════════════════════"
echo "Database:     $DB_NAME"
echo "Backup file:  $(basename $BACKUP_PATH)"
echo "Size:         $BACKUP_SIZE"
echo "Location:     $BACKUP_PATH"
echo "Compressed:   $COMPRESS"
echo "Uploaded:     $UPLOAD"
echo "═══════════════════════════════════════════════════════"

echo ""
echo -e "${GREEN}✓ Backup process completed successfully!${NC}"
