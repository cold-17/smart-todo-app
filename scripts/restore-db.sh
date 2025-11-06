#!/bin/bash

################################################################################
# MongoDB Restore Script
#
# This script restores a MongoDB database from a backup created with backup-db.sh
#
# Usage:
#   ./scripts/restore-db.sh [options] BACKUP_PATH
#
# Options:
#   -d, --drop           Drop existing database before restore
#   -y, --yes            Skip confirmation prompt
#   -h, --help           Show this help message
#
# Environment Variables (set in .env or pass directly):
#   MONGODB_URI          MongoDB connection string (required)
#
# Examples:
#   # Restore from local backup
#   ./scripts/restore-db.sh backups/backup-smart-todo-app-20240101_120000
#
#   # Restore from compressed backup
#   ./scripts/restore-db.sh backups/backup-smart-todo-app-20240101_120000.tar.gz
#
#   # Restore and drop existing data (DANGEROUS!)
#   ./scripts/restore-db.sh --drop --yes backups/backup-smart-todo-app-20240101_120000
#
#   # Download from S3 and restore
#   aws s3 cp s3://my-bucket/backups/backup.tar.gz ./backups/
#   ./scripts/restore-db.sh backups/backup.tar.gz
#
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
DROP=false
SKIP_CONFIRM=false
BACKUP_PATH=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--drop)
      DROP=true
      shift
      ;;
    -y|--yes)
      SKIP_CONFIRM=true
      shift
      ;;
    -h|--help)
      sed -n '2,32p' "$0" | sed 's/^# //'
      exit 0
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
    *)
      BACKUP_PATH="$1"
      shift
      ;;
  esac
done

# Check if backup path is provided
if [ -z "$BACKUP_PATH" ]; then
  echo -e "${RED}Error: Backup path is required${NC}"
  echo "Usage: $0 [options] BACKUP_PATH"
  echo "Use --help for more information"
  exit 1
fi

# Check if backup exists
if [ ! -e "$BACKUP_PATH" ]; then
  echo -e "${RED}Error: Backup not found: $BACKUP_PATH${NC}"
  exit 1
fi

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

# Extract database name from MongoDB URI
DB_NAME=$(echo "$MONGODB_URI" | sed -E 's|.*/([-_a-zA-Z0-9]+)(\?.*)?$|\1|')

if [ -z "$DB_NAME" ]; then
  echo -e "${RED}Error: Could not extract database name from MONGODB_URI${NC}"
  exit 1
fi

# Check if backup is compressed
IS_COMPRESSED=false
if [[ "$BACKUP_PATH" == *.tar.gz ]] || [[ "$BACKUP_PATH" == *.tgz ]]; then
  IS_COMPRESSED=true
fi

echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}MongoDB Restore${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo "Database:     $DB_NAME"
echo "Backup:       $BACKUP_PATH"
echo "Compressed:   $IS_COMPRESSED"
echo "Drop first:   $DROP"
echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
echo ""

# Confirm before proceeding
if [ "$SKIP_CONFIRM" = false ]; then
  if [ "$DROP" = true ]; then
    echo -e "${RED}WARNING: This will DROP the existing database and restore from backup!${NC}"
    echo -e "${RED}All current data will be PERMANENTLY DELETED!${NC}"
  else
    echo -e "${YELLOW}This will restore the database from backup.${NC}"
    echo -e "${YELLOW}Existing data may be overwritten.${NC}"
  fi

  echo ""
  read -p "Are you sure you want to continue? (yes/no): " CONFIRM

  if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
  fi
fi

# Extract compressed backup if needed
RESTORE_PATH="$BACKUP_PATH"

if [ "$IS_COMPRESSED" = true ]; then
  echo ""
  echo "Extracting compressed backup..."

  TEMP_DIR=$(mktemp -d)
  tar -xzf "$BACKUP_PATH" -C "$TEMP_DIR"

  # Find the extracted directory
  RESTORE_PATH=$(find "$TEMP_DIR" -maxdepth 1 -type d -name "backup-*" | head -n 1)

  if [ -z "$RESTORE_PATH" ]; then
    echo -e "${RED}Error: Could not find backup directory in archive${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi

  echo -e "${GREEN}✓ Extraction completed${NC}"
fi

# Perform restore using mongorestore
echo ""
echo "Starting database restore..."

RESTORE_CMD="mongorestore --uri=\"$MONGODB_URI\""

if [ "$DROP" = true ]; then
  RESTORE_CMD="$RESTORE_CMD --drop"
fi

# Add the backup path (mongodump creates a directory structure)
RESTORE_CMD="$RESTORE_CMD \"$RESTORE_PATH\""

echo "Running mongorestore..."

if eval $RESTORE_CMD 2>&1; then
  echo -e "${GREEN}✓ Restore completed successfully${NC}"
else
  echo -e "${RED}✗ Restore failed${NC}"

  # Clean up temp directory if we created one
  if [ "$IS_COMPRESSED" = true ]; then
    rm -rf "$TEMP_DIR"
  fi

  exit 1
fi

# Clean up temp directory if we created one
if [ "$IS_COMPRESSED" = true ]; then
  echo ""
  echo "Cleaning up temporary files..."
  rm -rf "$TEMP_DIR"
  echo -e "${GREEN}✓ Cleanup completed${NC}"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}Restore Summary${NC}"
echo "═══════════════════════════════════════════════════════"
echo "Database:     $DB_NAME"
echo "Restored from: $(basename $BACKUP_PATH)"
echo "Dropped:      $DROP"
echo "═══════════════════════════════════════════════════════"

echo ""
echo -e "${GREEN}✓ Database restore completed successfully!${NC}"

# Verification suggestion
echo ""
echo -e "${YELLOW}Suggestion:${NC} Verify the restored data by:"
echo "  1. Checking document counts in collections"
echo "  2. Running a few test queries"
echo "  3. Testing application functionality"
