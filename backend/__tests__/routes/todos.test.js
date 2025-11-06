const request = require('supertest');
const express = require('express');
const todoRoutes = require('../../routes/todos');
const Todo = require('../../models/Todo');
const { createAuthenticatedUser, validTodoData } = require('../helpers/testUtils');

// Setup
require('../setup');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/todos', todoRoutes);

describe('Todo Routes', () => {
  let authUser;
  let authToken;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser();
    authUser = auth.user;
    authToken = auth.token;
  });

  describe('POST /api/todos', () => {
    it('should create a new todo with valid data', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validTodoData)
        .expect(201);

      expect(res.body).toHaveProperty('_id');
      expect(res.body.title).toBe(validTodoData.title);
      expect(res.body.description).toBe(validTodoData.description);
      expect(res.body.category).toBe(validTodoData.category);
      expect(res.body.priority).toBe(validTodoData.priority);
      expect(res.body.completed).toBe(false);
      expect(res.body.user).toBe(authUser._id.toString());
    });

    it('should create todo with minimal data (only title)', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Minimal Todo' })
        .expect(201);

      expect(res.body.title).toBe('Minimal Todo');
      expect(res.body.category).toBe('general');
      expect(res.body.priority).toBe('medium');
    });

    it('should reject todo without title', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No title' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject todo with invalid category', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validTodoData, category: 'invalid' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject todo with invalid priority', async () => {
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validTodoData, priority: 'invalid' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject todo with title too long', async () => {
      const longTitle = 'a'.repeat(201);
      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: longTitle })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject request without authentication', async () => {
      const res = await request(app)
        .post('/api/todos')
        .send(validTodoData)
        .expect(401);
    });

    it('should create todo with subtasks', async () => {
      const todoWithSubtasks = {
        ...validTodoData,
        subtasks: [
          { text: 'Subtask 1', completed: false },
          { text: 'Subtask 2', completed: false },
        ],
      };

      const res = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoWithSubtasks)
        .expect(201);

      expect(res.body.subtasks).toHaveLength(2);
      expect(res.body.subtasks[0].text).toBe('Subtask 1');
    });
  });

  describe('GET /api/todos', () => {
    beforeEach(async () => {
      // Create some test todos
      await Todo.create([
        { ...validTodoData, user: authUser._id, title: 'Todo 1', category: 'work', completed: false },
        { ...validTodoData, user: authUser._id, title: 'Todo 2', category: 'personal', completed: true },
        { ...validTodoData, user: authUser._id, title: 'Todo 3', category: 'work', completed: false },
      ]);
    });

    it('should get all todos for authenticated user', async () => {
      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);
    });

    it('should filter todos by category', async () => {
      const res = await request(app)
        .get('/api/todos?category=work')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body.every((todo) => todo.category === 'work')).toBe(true);
    });

    it('should filter todos by completion status', async () => {
      const res = await request(app)
        .get('/api/todos?completed=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].completed).toBe(true);
    });

    it('should filter todos by priority', async () => {
      await Todo.create({
        ...validTodoData,
        user: authUser._id,
        title: 'Urgent Todo',
        priority: 'urgent',
      });

      const res = await request(app)
        .get('/api/todos?priority=urgent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].priority).toBe('urgent');
    });

    it('should not return todos from other users', async () => {
      const otherUser = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com',
      });

      await Todo.create({
        ...validTodoData,
        user: otherUser.user._id,
        title: 'Other User Todo',
      });

      const res = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveLength(3); // Only original 3 todos
    });

    it('should reject request without authentication', async () => {
      await request(app).get('/api/todos').expect(401);
    });
  });

  describe('PUT /api/todos/:id', () => {
    let todoId;

    beforeEach(async () => {
      const todo = await Todo.create({
        ...validTodoData,
        user: authUser._id,
      });
      todoId = todo._id.toString();
    });

    it('should update todo with valid data', async () => {
      const updates = {
        title: 'Updated Title',
        priority: 'urgent',
        completed: true,
      };

      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(res.body.title).toBe(updates.title);
      expect(res.body.priority).toBe(updates.priority);
      expect(res.body.completed).toBe(true);
      expect(res.body.completedAt).toBeTruthy();
    });

    it('should update only specified fields', async () => {
      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Title Only' })
        .expect(200);

      expect(res.body.title).toBe('New Title Only');
      expect(res.body.description).toBe(validTodoData.description); // Unchanged
    });

    it('should reject update with invalid data', async () => {
      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ category: 'invalid' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should reject update with empty body', async () => {
      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });

    it('should not allow updating another user\'s todo', async () => {
      const otherUser = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com',
      });

      const res = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${otherUser.token}`)
        .send({ title: 'Hacked' })
        .expect(404);

      expect(res.body.message).toBe('Todo not found');
    });

    it('should reject update with invalid todo ID', async () => {
      const res = await request(app)
        .put('/api/todos/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(500);
    });

    it('should reject request without authentication', async () => {
      await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ title: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    let todoId;

    beforeEach(async () => {
      const todo = await Todo.create({
        ...validTodoData,
        user: authUser._id,
      });
      todoId = todo._id.toString();
    });

    it('should delete todo successfully', async () => {
      const res = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.message).toBe('Todo deleted successfully');

      // Verify todo is actually deleted
      const deletedTodo = await Todo.findById(todoId);
      expect(deletedTodo).toBeNull();
    });

    it('should not allow deleting another user\'s todo', async () => {
      const otherUser = await createAuthenticatedUser({
        username: 'otheruser',
        email: 'other@example.com',
      });

      const res = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${otherUser.token}`)
        .expect(404);

      expect(res.body.message).toBe('Todo not found');

      // Verify todo still exists
      const todo = await Todo.findById(todoId);
      expect(todo).toBeTruthy();
    });

    it('should return 404 for non-existent todo', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/todos/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.message).toBe('Todo not found');
    });

    it('should reject request without authentication', async () => {
      await request(app).delete(`/api/todos/${todoId}`).expect(401);
    });
  });

  describe('GET /api/todos/stats', () => {
    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      await Todo.create([
        { ...validTodoData, user: authUser._id, title: 'Todo 1', completed: true },
        { ...validTodoData, user: authUser._id, title: 'Todo 2', completed: false },
        { ...validTodoData, user: authUser._id, title: 'Todo 3', completed: false, dueDate: yesterday },
        { ...validTodoData, user: authUser._id, title: 'Todo 4', completed: false, category: 'personal' },
      ]);
    });

    it('should return todo statistics', async () => {
      const res = await request(app)
        .get('/api/todos/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('completed');
      expect(res.body).toHaveProperty('pending');
      expect(res.body).toHaveProperty('overdue');
      expect(res.body).toHaveProperty('completionRate');
      expect(res.body).toHaveProperty('byCategory');

      expect(res.body.total).toBe(4);
      expect(res.body.completed).toBe(1);
      expect(res.body.pending).toBe(3);
      expect(res.body.overdue).toBe(1);
      expect(res.body.completionRate).toBe(25);
    });

    it('should reject request without authentication', async () => {
      await request(app).get('/api/todos/stats').expect(401);
    });
  });
});
