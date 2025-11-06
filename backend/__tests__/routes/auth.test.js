const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');
const {
  createTestUser,
  createAuthenticatedUser,
  validUserData,
  invalidUserData,
} = require('../helpers/testUtils');

// Setup
require('../setup');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toBe(validUserData.username);
      expect(res.body.user.email).toBe(validUserData.email);
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.message).toBe('User registered successfully');
    });

    it('should reject registration with short username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData.shortUsername)
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'username',
            message: expect.stringContaining('at least 3 characters'),
          }),
        ])
      );
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData.invalidEmail)
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('valid email'),
          }),
        ])
      );
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData.weakPassword)
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(res.body.errors[0].field).toBe('password');
    });

    it('should reject registration with password missing uppercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData.noUppercase)
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('uppercase'),
          }),
        ])
      );
    });

    it('should reject registration with password missing special character', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData.noSpecialChar)
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: expect.stringContaining('special character'),
          }),
        ])
      );
    });

    it('should reject registration with duplicate email', async () => {
      await createTestUser({ email: 'duplicate@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'duplicate@example.com',
          password: 'SecurePass123!',
        })
        .expect(400);

      expect(res.body.message).toBe('Email already registered');
    });

    it('should reject registration with duplicate username', async () => {
      await createTestUser({ username: 'duplicateuser' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'newemail@example.com',
          password: 'SecurePass123!',
        })
        .expect(400);

      expect(res.body.message).toBe('Username already taken');
    });

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await createTestUser();
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!',
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.message).toBe('Login successful');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123!',
        })
        .expect(400);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPass123!',
        })
        .expect(400);

      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject login with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'TestPass123!',
        })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const { user, token } = await createAuthenticatedUser();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(user._id.toString());
      expect(res.body.user.email).toBe(user.email);
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.message.toLowerCase()).toContain('token');
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(res.body.message.toLowerCase()).toContain('token');
    });
  });
});
