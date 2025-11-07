#!/usr/bin/env node

/**
 * MongoDB Database Backup Script
 *
 * This script creates automated backups of the MongoDB database using mongodump.
 * Can be run manually or scheduled via cron/task scheduler.
 *
 * Usage:
 *   node scripts/backup-database.js
 *
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string (required)
 *   BACKUP_DIR - Directory to store backups (default: ./backups)
 *   BACKUP_RETENTION_DAYS - Number of days to keep backups (default: 30)
 *   S3_BUCKET - AWS S3 bucket name for remote backup (optional)
 *   S3_REGION - AWS S3 region (default: us-east-1)
 *
 * Setup:
 *   1. Install dependencies: npm install
 *   2. Ensure mongodump is installed: https://www.mongodb.com/docs/database-tools/
 *   3. Configure environment variables
 *   4. Schedule with cron: 0 2 * * * /path/to/node /path/to/backup-database.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { existsSync, mkdirSync } = require('fs');

const execAsync = promisify(exec);

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/smart-todo-app';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10);
const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || 'us-east-1';

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Format date as YYYY-MM-DD-HHmmss
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

/**
 * Create MongoDB backup using mongodump
 */
async function createBackup() {
  const timestamp = getTimestamp();
  const backupName = `backup-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);

  console.log(`[${new Date().toISOString()}] Starting database backup...`);
  console.log(`Backup location: ${backupPath}`);

  try {
    // Check if mongodump is available
    try {
      await execAsync('mongodump --version');
    } catch (error) {
      throw new Error(
        'mongodump not found. Please install MongoDB Database Tools: ' +
        'https://www.mongodb.com/docs/database-tools/installation/installation/'
      );
    }

    // Create backup using mongodump
    const dumpCommand = `mongodump --uri="${MONGODB_URI}" --out="${backupPath}"`;
    const { stdout, stderr } = await execAsync(dumpCommand);

    if (stderr && !stderr.includes('done dumping')) {
      console.error('Backup stderr:', stderr);
    }

    console.log(`[${new Date().toISOString()}] Backup completed successfully!`);

    // Create a compressed archive
    await compressBackup(backupPath, `${backupPath}.tar.gz`);

    // Upload to S3 if configured
    if (S3_BUCKET) {
      await uploadToS3(`${backupPath}.tar.gz`, backupName);
    }

    return { success: true, backupPath: `${backupPath}.tar.gz` };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Backup failed:`, error.message);
    throw error;
  }
}

/**
 * Compress backup directory to tar.gz
 */
async function compressBackup(sourcePath, targetPath) {
  console.log(`[${new Date().toISOString()}] Compressing backup...`);

  try {
    const tarCommand = `tar -czf "${targetPath}" -C "${path.dirname(sourcePath)}" "${path.basename(sourcePath)}"`;
    await execAsync(tarCommand);

    // Remove uncompressed directory
    await execAsync(`rm -rf "${sourcePath}"`);

    const stats = await fs.stat(targetPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`[${new Date().toISOString()}] Backup compressed: ${sizeInMB} MB`);
  } catch (error) {
    console.error('Compression failed:', error.message);
    throw error;
  }
}

/**
 * Upload backup to AWS S3
 */
async function uploadToS3(filePath, backupName) {
  console.log(`[${new Date().toISOString()}] Uploading to S3...`);

  try {
    // Check if AWS CLI is available
    await execAsync('aws --version');

    const s3Key = `backups/${backupName}.tar.gz`;
    const uploadCommand = `aws s3 cp "${filePath}" "s3://${S3_BUCKET}/${s3Key}" --region ${S3_REGION}`;

    await execAsync(uploadCommand);
    console.log(`[${new Date().toISOString()}] Uploaded to S3: s3://${S3_BUCKET}/${s3Key}`);
  } catch (error) {
    if (error.message.includes('aws: command not found')) {
      console.warn('AWS CLI not found. Skipping S3 upload. Install: https://aws.amazon.com/cli/');
    } else {
      console.error('S3 upload failed:', error.message);
      // Don't throw - local backup still succeeded
    }
  }
}

/**
 * Clean up old backups based on retention policy
 */
async function cleanupOldBackups() {
  console.log(`[${new Date().toISOString()}] Cleaning up old backups (retention: ${RETENTION_DAYS} days)...`);

  try {
    const files = await fs.readdir(BACKUP_DIR);
    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('backup-') || !file.endsWith('.tar.gz')) {
        continue;
      }

      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > retentionMs) {
        await fs.unlink(filePath);
        console.log(`Deleted old backup: ${file}`);
        deletedCount++;
      }
    }

    console.log(`[${new Date().toISOString()}] Cleanup complete. Deleted ${deletedCount} old backup(s).`);
  } catch (error) {
    console.error('Cleanup failed:', error.message);
    // Don't throw - main backup still succeeded
  }
}

/**
 * List all available backups
 */
async function listBackups() {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = [];

    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.tar.gz')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        backups.push({
          name: file,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          created: stats.mtime.toISOString()
        });
      }
    }

    return backups.sort((a, b) => b.created.localeCompare(a.created));
  } catch (error) {
    console.error('Failed to list backups:', error.message);
    return [];
  }
}

/**
 * Main backup routine
 */
async function main() {
  const startTime = Date.now();

  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  MongoDB Backup Script - Smart Todo App');
    console.log('═══════════════════════════════════════════════════════');

    // Create backup
    const result = await createBackup();

    // Clean up old backups
    await cleanupOldBackups();

    // List current backups
    const backups = await listBackups();
    console.log(`\nCurrent backups: ${backups.length}`);
    backups.slice(0, 5).forEach(backup => {
      console.log(`  - ${backup.name} (${backup.size}) - ${backup.created}`);
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[${new Date().toISOString()}] Backup process completed in ${duration}s`);
    console.log('═══════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Backup process failed:', error.message);
    console.error('═══════════════════════════════════════════════════════');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createBackup, cleanupOldBackups, listBackups };
