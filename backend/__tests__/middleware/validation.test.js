const {
  validate,
  authSchemas,
  todoSchemas,
  aiSchemas,
} = require('../../middleware/validation');

describe('Validation Middleware', () => {
  describe('Auth Schemas', () => {
    describe('register schema', () => {
      it('should accept valid registration data', () => {
        const validData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
        };

        const { error } = authSchemas.register.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject username shorter than 3 characters', () => {
        const { error } = authSchemas.register.validate({
          username: 'ab',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('username');
      });

      it('should reject non-alphanumeric username', () => {
        const { error } = authSchemas.register.validate({
          username: 'test@user',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

        expect(error).toBeDefined();
      });

      it('should reject invalid email format', () => {
        const { error } = authSchemas.register.validate({
          username: 'testuser',
          email: 'not-an-email',
          password: 'SecurePass123!',
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('email');
      });

      it('should reject password without uppercase', () => {
        const { error } = authSchemas.register.validate({
          username: 'testuser',
          email: 'test@example.com',
          password: 'weakpass123!',
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('password');
      });

      it('should reject password without lowercase', () => {
        const { error } = authSchemas.register.validate({
          username: 'testuser',
          email: 'test@example.com',
          password: 'WEAKPASS123!',
        });

        expect(error).toBeDefined();
      });

      it('should reject password without number', () => {
        const { error } = authSchemas.register.validate({
          username: 'testuser',
          email: 'test@example.com',
          password: 'WeakPassword!',
        });

        expect(error).toBeDefined();
      });

      it('should reject password without special character', () => {
        const { error } = authSchemas.register.validate({
          username: 'testuser',
          email: 'test@example.com',
          password: 'WeakPassword123',
        });

        expect(error).toBeDefined();
      });

      it('should reject password shorter than 8 characters', () => {
        const { error } = authSchemas.register.validate({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Weak1!',
        });

        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('password');
      });

      it('should trim and lowercase email', () => {
        const { value } = authSchemas.register.validate({
          username: 'testuser',
          email: '  TEST@EXAMPLE.COM  ',
          password: 'SecurePass123!',
        });

        expect(value.email).toBe('test@example.com');
      });

      it('should trim username', () => {
        const { value } = authSchemas.register.validate({
          username: '  testuser  ',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

        expect(value.username).toBe('testuser');
      });
    });

    describe('login schema', () => {
      it('should accept valid login data', () => {
        const { error } = authSchemas.login.validate({
          email: 'test@example.com',
          password: 'anypassword',
        });

        expect(error).toBeUndefined();
      });

      it('should reject missing email', () => {
        const { error } = authSchemas.login.validate({
          password: 'anypassword',
        });

        expect(error).toBeDefined();
      });

      it('should reject missing password', () => {
        const { error } = authSchemas.login.validate({
          email: 'test@example.com',
        });

        expect(error).toBeDefined();
      });
    });
  });

  describe('Todo Schemas', () => {
    describe('create schema', () => {
      it('should accept valid todo data', () => {
        const { error } = todoSchemas.create.validate({
          title: 'Test Todo',
          description: 'Test description',
          category: 'work',
          priority: 'high',
        });

        expect(error).toBeUndefined();
      });

      it('should accept todo with only title', () => {
        const { error } = todoSchemas.create.validate({
          title: 'Minimal Todo',
        });

        expect(error).toBeUndefined();
      });

      it('should set default category to general', () => {
        const { value } = todoSchemas.create.validate({
          title: 'Test Todo',
        });

        expect(value.category).toBe('general');
      });

      it('should set default priority to medium', () => {
        const { value } = todoSchemas.create.validate({
          title: 'Test Todo',
        });

        expect(value.priority).toBe('medium');
      });

      it('should reject empty title', () => {
        const { error } = todoSchemas.create.validate({
          title: '',
        });

        expect(error).toBeDefined();
      });

      it('should reject title longer than 200 characters', () => {
        const { error } = todoSchemas.create.validate({
          title: 'a'.repeat(201),
        });

        expect(error).toBeDefined();
      });

      it('should reject invalid category', () => {
        const { error } = todoSchemas.create.validate({
          title: 'Test Todo',
          category: 'invalid',
        });

        expect(error).toBeDefined();
      });

      it('should reject invalid priority', () => {
        const { error } = todoSchemas.create.validate({
          title: 'Test Todo',
          priority: 'invalid',
        });

        expect(error).toBeDefined();
      });

      it('should accept valid subtasks', () => {
        const { error } = todoSchemas.create.validate({
          title: 'Test Todo',
          subtasks: [
            { text: 'Subtask 1', completed: false },
            { text: 'Subtask 2', completed: true },
          ],
        });

        expect(error).toBeUndefined();
      });

      it('should trim title', () => {
        const { value } = todoSchemas.create.validate({
          title: '  Test Todo  ',
        });

        expect(value.title).toBe('Test Todo');
      });
    });

    describe('update schema', () => {
      it('should accept partial updates', () => {
        const { error } = todoSchemas.update.validate({
          title: 'Updated Title',
        });

        expect(error).toBeUndefined();
      });

      it('should reject empty update body', () => {
        const { error } = todoSchemas.update.validate({});

        expect(error).toBeDefined();
      });

      it('should accept completed status update', () => {
        const { error } = todoSchemas.update.validate({
          completed: true,
        });

        expect(error).toBeUndefined();
      });
    });
  });

  describe('AI Schemas', () => {
    describe('parseTask schema', () => {
      it('should accept valid input', () => {
        const { error } = aiSchemas.parseTask.validate({
          input: 'Complete the project by Friday',
        });

        expect(error).toBeUndefined();
      });

      it('should reject empty input', () => {
        const { error } = aiSchemas.parseTask.validate({
          input: '',
        });

        expect(error).toBeDefined();
      });

      it('should reject input longer than 500 characters', () => {
        const { error } = aiSchemas.parseTask.validate({
          input: 'a'.repeat(501),
        });

        expect(error).toBeDefined();
      });

      it('should trim input', () => {
        const { value } = aiSchemas.parseTask.validate({
          input: '  test task  ',
        });

        expect(value.input).toBe('test task');
      });
    });

    describe('suggestPriority schema', () => {
      it('should accept valid data', () => {
        const { error } = aiSchemas.suggestPriority.validate({
          title: 'Important task',
          description: 'Very urgent',
        });

        expect(error).toBeUndefined();
      });

      it('should reject missing title', () => {
        const { error } = aiSchemas.suggestPriority.validate({
          description: 'test',
        });

        expect(error).toBeDefined();
      });
    });
  });

  describe('validate middleware function', () => {
    it('should call next() with valid data', () => {
      const schema = authSchemas.login;
      const middleware = validate(schema);

      const req = {
        body: {
          email: 'test@example.com',
          password: 'password',
        },
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should return 400 with invalid data', () => {
      const schema = authSchemas.register;
      const middleware = validate(schema);

      const req = {
        body: {
          username: 'ab', // Too short
          email: 'invalid',
          password: 'weak',
        },
        path: '/test',
        method: 'POST',
        ip: '127.0.0.1',
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          errors: expect.any(Array),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should strip unknown fields', () => {
      const schema = authSchemas.login;
      const middleware = validate(schema);

      const req = {
        body: {
          email: 'test@example.com',
          password: 'password',
          unknownField: 'should be removed',
        },
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.body).not.toHaveProperty('unknownField');
    });
  });
});
