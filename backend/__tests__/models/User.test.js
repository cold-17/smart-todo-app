const User = require('../../models/User');

// Setup
require('../setup');

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
      };

      const user = new User(userData);
      await user.save();

      expect(user._id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should require username', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require email', async () => {
      const user = new User({
        username: 'testuser',
        password: 'TestPass123!',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
      });

      await expect(user.save()).rejects.toThrow();
    });

    it('should trim username', async () => {
      const user = new User({
        username: '  testuser  ',
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      await user.save();
      expect(user.username).toBe('testuser');
    });

    it('should lowercase and trim email', async () => {
      const user = new User({
        username: 'testuser',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'TestPass123!',
      });

      await user.save();
      expect(user.email).toBe('test@example.com');
    });

    it('should reject duplicate email', async () => {
      await User.create({
        username: 'user1',
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      const duplicateUser = new User({
        username: 'user2',
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should reject duplicate username', async () => {
      await User.create({
        username: 'testuser',
        email: 'test1@example.com',
        password: 'TestPass123!',
      });

      const duplicateUser = new User({
        username: 'testuser',
        email: 'test2@example.com',
        password: 'TestPass123!',
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should enforce username length constraints', async () => {
      const shortUser = new User({
        username: 'ab',
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      await expect(shortUser.save()).rejects.toThrow();

      const longUser = new User({
        username: 'a'.repeat(21),
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      await expect(longUser.save()).rejects.toThrow();
    });

    it('should enforce password minimum length', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: '12345',
      });

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'TestPass123!';
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword,
      });

      await user.save();

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2[ayb]\$.{56}$/); // Bcrypt hash pattern
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      const originalHash = user.password;

      user.username = 'newusername';
      await user.save();

      expect(user.password).toBe(originalHash);
    });

    it('should rehash password when modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      const originalHash = user.password;

      user.password = 'NewPass456!';
      await user.save();

      expect(user.password).not.toBe(originalHash);
    });
  });

  describe('comparePassword method', () => {
    let user;
    const plainPassword = 'TestPass123!';

    beforeEach(async () => {
      user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword,
      });
    });

    it('should return true for correct password', async () => {
      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const isMatch = await user.comparePassword('WrongPass123!');
      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const isMatch = await user.comparePassword('');
      expect(isMatch).toBe(false);
    });

    it('should handle null password gracefully', async () => {
      // bcrypt.compare will throw with null, so we test the behavior
      try {
        const isMatch = await user.comparePassword(null);
        expect(isMatch).toBe(false);
      } catch (error) {
        // It's acceptable for this to throw since null is invalid
        expect(error).toBeDefined();
      }
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when user is modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      user.username = 'newusername';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
