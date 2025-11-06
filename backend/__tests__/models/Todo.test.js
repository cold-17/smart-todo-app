const Todo = require('../../models/Todo');
const User = require('../../models/User');

// Setup
require('../setup');

describe('Todo Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPass123!',
    });
  });

  describe('Schema Validation', () => {
    it('should create a todo with valid data', async () => {
      const todoData = {
        user: testUser._id,
        title: 'Test Todo',
        description: 'Test description',
        category: 'work',
        priority: 'high',
      };

      const todo = await Todo.create(todoData);

      expect(todo._id).toBeDefined();
      expect(todo.title).toBe(todoData.title);
      expect(todo.description).toBe(todoData.description);
      expect(todo.category).toBe(todoData.category);
      expect(todo.priority).toBe(todoData.priority);
      expect(todo.completed).toBe(false);
      expect(todo.createdAt).toBeDefined();
      expect(todo.updatedAt).toBeDefined();
    });

    it('should require user', async () => {
      const todo = new Todo({
        title: 'Test Todo',
      });

      await expect(todo.save()).rejects.toThrow();
    });

    it('should require title', async () => {
      const todo = new Todo({
        user: testUser._id,
      });

      await expect(todo.save()).rejects.toThrow();
    });

    it('should use default category if not provided', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
      });

      expect(todo.category).toBe('general');
    });

    it('should use default priority if not provided', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
      });

      expect(todo.priority).toBe('medium');
    });

    it('should trim title', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: '  Test Todo  ',
      });

      expect(todo.title).toBe('Test Todo');
    });

    it('should enforce title max length', async () => {
      const todo = new Todo({
        user: testUser._id,
        title: 'a'.repeat(201),
      });

      await expect(todo.save()).rejects.toThrow();
    });

    it('should enforce description max length', async () => {
      const todo = new Todo({
        user: testUser._id,
        title: 'Test Todo',
        description: 'a'.repeat(1001),
      });

      await expect(todo.save()).rejects.toThrow();
    });

    it('should accept valid categories', async () => {
      const categories = ['work', 'personal', 'health', 'learning', 'general'];

      for (const category of categories) {
        const todo = await Todo.create({
          user: testUser._id,
          title: `${category} todo`,
          category,
        });

        expect(todo.category).toBe(category);
      }
    });

    it('should reject invalid category', async () => {
      const todo = new Todo({
        user: testUser._id,
        title: 'Test Todo',
        category: 'invalid',
      });

      await expect(todo.save()).rejects.toThrow();
    });

    it('should accept valid priorities', async () => {
      const priorities = ['low', 'medium', 'high', 'urgent'];

      for (const priority of priorities) {
        const todo = await Todo.create({
          user: testUser._id,
          title: `${priority} todo`,
          priority,
        });

        expect(todo.priority).toBe(priority);
      }
    });

    it('should reject invalid priority', async () => {
      const todo = new Todo({
        user: testUser._id,
        title: 'Test Todo',
        priority: 'invalid',
      });

      await expect(todo.save()).rejects.toThrow();
    });
  });

  describe('Completion Tracking', () => {
    it('should start as not completed', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
      });

      expect(todo.completed).toBe(false);
      expect(todo.completedAt).toBeUndefined();
    });

    it('should set completedAt when marked as completed', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
      });

      todo.completed = true;
      await todo.save();

      expect(todo.completedAt).toBeInstanceOf(Date);
    });

    it('should clear completedAt when marked as incomplete', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
        completed: true,
      });

      expect(todo.completedAt).toBeInstanceOf(Date);

      todo.completed = false;
      await todo.save();

      expect(todo.completedAt).toBeNull();
    });

    it('should not update completedAt if already completed', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
      });

      todo.completed = true;
      await todo.save();

      const firstCompletedAt = todo.completedAt;

      await new Promise((resolve) => setTimeout(resolve, 100));

      todo.title = 'Updated title';
      await todo.save();

      expect(todo.completedAt.getTime()).toBe(firstCompletedAt.getTime());
    });
  });

  describe('Subtasks', () => {
    it('should create todo with subtasks', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
        subtasks: [
          { text: 'Subtask 1', completed: false },
          { text: 'Subtask 2', completed: true },
        ],
      });

      expect(todo.subtasks).toHaveLength(2);
      expect(todo.subtasks[0].text).toBe('Subtask 1');
      expect(todo.subtasks[0].completed).toBe(false);
      expect(todo.subtasks[1].text).toBe('Subtask 2');
      expect(todo.subtasks[1].completed).toBe(true);
    });

    it('should enforce subtask text max length', async () => {
      const todo = new Todo({
        user: testUser._id,
        title: 'Test Todo',
        subtasks: [{ text: 'a'.repeat(201), completed: false }],
      });

      await expect(todo.save()).rejects.toThrow();
    });

    it('should set createdAt for subtasks', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
        subtasks: [{ text: 'Subtask 1', completed: false }],
      });

      expect(todo.subtasks[0].createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Due Date', () => {
    it('should accept valid due date', async () => {
      const dueDate = new Date('2025-12-31');
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
        dueDate,
      });

      expect(todo.dueDate).toBeInstanceOf(Date);
    });

    it('should allow null due date', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
        dueDate: null,
      });

      expect(todo.dueDate).toBeNull();
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
      });

      expect(todo.createdAt).toBeInstanceOf(Date);
      expect(todo.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when todo is modified', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Test Todo',
      });

      const originalUpdatedAt = todo.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 100));

      todo.title = 'Updated title';
      await todo.save();

      expect(todo.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Recurrence', () => {
    it('should create todo with recurrence settings', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Recurring Todo',
        recurrence: {
          enabled: true,
          pattern: 'daily',
          interval: 1,
        },
      });

      expect(todo.recurrence.enabled).toBe(true);
      expect(todo.recurrence.pattern).toBe('daily');
      expect(todo.recurrence.interval).toBe(1);
    });

    it('should allow weekly recurrence with specific days', async () => {
      const todo = await Todo.create({
        user: testUser._id,
        title: 'Weekly Todo',
        recurrence: {
          enabled: true,
          pattern: 'weekly',
          interval: 1,
          daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        },
      });

      expect(todo.recurrence.daysOfWeek).toEqual([1, 3, 5]);
    });
  });
});
