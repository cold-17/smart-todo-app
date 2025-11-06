const jwt = require('jsonwebtoken');
const User = require('../../models/User');

/**
 * Create a test user
 */
const createTestUser = async (userData = {}) => {
  const defaultData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'TestPass123!',
  };

  const user = new User({ ...defaultData, ...userData });
  await user.save();
  return user;
};

/**
 * Generate JWT token for a user
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'test-secret-key-for-testing-only-32chars', {
    expiresIn: '7d',
  });
};

/**
 * Create authenticated test user with token
 */
const createAuthenticatedUser = async (userData = {}) => {
  const user = await createTestUser(userData);
  const token = generateToken(user._id);
  return { user, token };
};

/**
 * Valid test user data
 */
const validUserData = {
  username: 'newuser',
  email: 'newuser@example.com',
  password: 'SecurePass123!',
};

/**
 * Invalid test user data
 */
const invalidUserData = {
  shortUsername: {
    username: 'ab',
    email: 'test@example.com',
    password: 'SecurePass123!',
  },
  invalidEmail: {
    username: 'testuser',
    email: 'not-an-email',
    password: 'SecurePass123!',
  },
  weakPassword: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'weak',
  },
  noUppercase: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'weakpass123!',
  },
  noSpecialChar: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'WeakPass123',
  },
};

/**
 * Valid todo data
 */
const validTodoData = {
  title: 'Test Todo',
  description: 'Test description',
  category: 'work',
  priority: 'high',
};

module.exports = {
  createTestUser,
  generateToken,
  createAuthenticatedUser,
  validUserData,
  invalidUserData,
  validTodoData,
};
