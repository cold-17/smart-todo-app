const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register User
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('Registration attempt for:', { username, email });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return res.status(400).json({
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    console.log('Creating new user...');

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    console.log('User created successfully:', user.username);

    // Generate token
    const token = generateToken(user._id);

    console.log('Token generated for user:', user.username);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error (detailed):', error.message);
    console.error('Full error stack:', error.stack);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', user.username);

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Password matched, generating token');

    // Generate token
    const token = generateToken(user._id);

    console.log('Login successful for user:', user.username);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error (detailed):', error.message);
    console.error('Full error stack:', error.stack);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

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