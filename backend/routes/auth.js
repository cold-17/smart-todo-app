const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, authSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register User
router.post('/register', validate(authSchemas.register), asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  logger.info('Registration attempt', { username, email });

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    logger.warn('Registration failed - user already exists', { email });
    return res.status(400).json({
      message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
    });
  }

  // Create new user
  const user = new User({ username, email, password });
  await user.save();

  logger.info('User registered successfully', { userId: user._id, username: user.username });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
}));

// Login User
router.post('/login', validate(authSchemas.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  logger.info('Login attempt', { email });

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    logger.warn('Login failed - user not found', { email });
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    logger.warn('Login failed - invalid password', { email, userId: user._id });
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Generate token
  const token = generateToken(user._id);

  logger.info('Login successful', { userId: user._id, username: user.username });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  });
}));

// Get Current User
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

module.exports = router;