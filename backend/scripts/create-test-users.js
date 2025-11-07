#!/usr/bin/env node

/**
 * Create Test Users Script
 *
 * Creates test users for performance testing and development
 *
 * Usage: node scripts/create-test-users.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const TEST_USERS = [
  {
    username: 'testuser1',
    email: 'testuser1@example.com',
    password: 'TestPassword123!'
  },
  {
    username: 'testuser2',
    email: 'testuser2@example.com',
    password: 'TestPassword123!'
  },
  {
    username: 'testuser3',
    email: 'testuser3@example.com',
    password: 'TestPassword123!'
  },
  {
    username: 'testuser4',
    email: 'testuser4@example.com',
    password: 'TestPassword123!'
  },
  {
    username: 'testuser5',
    email: 'testuser5@example.com',
    password: 'TestPassword123!'
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/smart-todo-app';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('Creating test users...\n');

    let created = 0;
    let skipped = 0;

    for (const userData of TEST_USERS) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });

        if (existingUser) {
          console.log(`⊘ Skipped: ${userData.email} (already exists)`);
          skipped++;
          continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Create user
        const user = new User({
          username: userData.username,
          email: userData.email,
          password: hashedPassword
        });

        await user.save();
        console.log(`✓ Created: ${userData.email}`);
        created++;

      } catch (error) {
        console.error(`✗ Failed to create ${userData.email}:`, error.message);
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`Summary: ${created} created, ${skipped} skipped`);
    console.log('═══════════════════════════════════════\n');

    if (created > 0) {
      console.log('Test credentials:');
      console.log('  Email: testuser1@example.com');
      console.log('  Password: TestPassword123!\n');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createTestUsers();
}

module.exports = { createTestUsers, TEST_USERS };
