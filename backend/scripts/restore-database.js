#!/usr/bin/env node

/**
 * MongoDB Database Restore Script
 *
 * This script restores a MongoDB database from a backup created by backup-database.js
 *
 * Usage:
 *   node scripts/restore-database.js [backup-name]
 *
 * Examples:
 *   node scripts/restore-database.js backup-2025-01-15-143022.tar.gz
 *   node scripts/restore-database.js (will list available backups and prompt)
 *
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string (required)
 *   BACKUP_DIR - Directory where backups are stored (default: ./backups)
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');
const readline = require('readline');

const execAsync = promisify(exec);

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/smart-todo-app';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');

/**
 * Create readline interface for user input
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompt user for input
 */
function prompt(question) {
  const rl = createInterface();
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
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
          created: stats.mtime,
          createdISO: stats.mtime.toISOString()
        });
      }
    }

    return backups.sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error('Failed to list backups:', error.message);
    return [];
  }
}

/**
 * Decompress backup archive
 */
async function decompressBackup(archivePath, tempDir) {
  console.log(`[${new Date().toISOString()}] Decompressing backup...`);

  try {
    const tarCommand = `tar -xzf "${archivePath}" -C "${tempDir}"`;
    await execAsync(tarCommand);
    console.log(`[${new Date().toISOString()}] Backup decompressed successfully`);
  } catch (error) {
    console.error('Decompression failed:', error.message);
    throw error;
  }
}

/**
 * Restore database using mongorestore
 */
async function restoreBackup(backupName) {
  console.log(`[${new Date().toISOString()}] Starting database restore...`);
  console.log(`Backup: ${backupName}`);

  const backupPath = path.join(BACKUP_DIR, backupName);

  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  // Create temporary directory for decompression
  const tempDir = path.join(BACKUP_DIR, 'temp-restore');
  if (existsSync(tempDir)) {
    await execAsync(`rm -rf "${tempDir}"`);
  }
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Check if mongorestore is available
    try {
      await execAsync('mongorestore --version');
    } catch (error) {
      throw new Error(
        'mongorestore not found. Please install MongoDB Database Tools: ' +
        'https://www.mongodb.com/docs/database-tools/installation/installation/'
      );
    }

    // Decompress backup
    await decompressBackup(backupPath, tempDir);

    // Find the backup directory (it should be named backup-*)
    const files = await fs.readdir(tempDir);
    const backupDirName = files.find(f => f.startsWith('backup-'));

    if (!backupDirName) {
      throw new Error('Invalid backup format: backup directory not found');
    }

    const extractedBackupPath = path.join(tempDir, backupDirName);

    // Restore using mongorestore
    console.log(`[${new Date().toISOString()}] Restoring database...`);

    // Use --drop to drop existing collections before restoring
    const restoreCommand = `mongorestore --uri="${MONGODB_URI}" --drop "${extractedBackupPath}"`;
    const { stdout, stderr } = await execAsync(restoreCommand);

    if (stderr) {
      console.log('Restore output:', stderr);
    }

    console.log(`[${new Date().toISOString()}] Database restored successfully!`);

    // Clean up temporary directory
    await execAsync(`rm -rf "${tempDir}"`);

    return { success: true, backupName };
  } catch (error) {
    // Clean up temporary directory on error
    try {
      await execAsync(`rm -rf "${tempDir}"`);
    } catch (cleanupError) {
      console.error('Failed to clean up temp directory:', cleanupError.message);
    }

    console.error(`[${new Date().toISOString()}] Restore failed:`, error.message);
    throw error;
  }
}

/**
 * Interactive backup selection
 */
async function selectBackup() {
  const backups = await listBackups();

  if (backups.length === 0) {
    throw new Error('No backups found in backup directory');
  }

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              Available Backups                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   Size: ${backup.size} | Created: ${backup.createdISO}\n`);
  });

  const answer = await prompt('Enter backup number to restore (or "q" to quit): ');

  if (answer.toLowerCase() === 'q') {
    console.log('Restore cancelled.');
    process.exit(0);
  }

  const index = parseInt(answer, 10) - 1;

  if (isNaN(index) || index < 0 || index >= backups.length) {
    throw new Error('Invalid selection');
  }

  return backups[index].name;
}

/**
 * Confirm dangerous operation
 */
async function confirmRestore() {
  console.log('\n⚠️  WARNING: This will replace all existing data in the database!');
  const answer = await prompt('Are you sure you want to continue? (yes/no): ');

  return answer.toLowerCase() === 'yes';
}

/**
 * Main restore routine
 */
async function main() {
  const startTime = Date.now();

  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  MongoDB Restore Script - Smart Todo App');
    console.log('═══════════════════════════════════════════════════════');

    // Get backup name from command line or prompt user
    let backupName = process.argv[2];

    if (!backupName) {
      backupName = await selectBackup();
    }

    // Confirm restoration
    const confirmed = await confirmRestore();

    if (!confirmed) {
      console.log('\nRestore cancelled.');
      process.exit(0);
    }

    // Perform restore
    await restoreBackup(backupName);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n[${new Date().toISOString()}] Restore completed in ${duration}s`);
    console.log('═══════════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Restore failed:', error.message);
    console.error('═══════════════════════════════════════════════════════');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { restoreBackup, listBackups };
