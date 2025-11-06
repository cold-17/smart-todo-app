const express = require('express');
const Todo = require('../models/Todo');
const authMiddleware = require('../middleware/authMiddleware');
const { handleRecurringCompletion, calculateNextDueDate } = require('../services/recurrenceService');
const { validate, todoSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Get all todos for logged-in user
router.get('/', asyncHandler(async (req, res) => {
  const { category, completed, priority } = req.query;

  let filter = { user: req.user._id };

  // Apply filters
  if (category && category !== 'all') {
    filter.category = category;
  }
  if (completed !== undefined) {
    filter.completed = completed === 'true';
  }
  if (priority && priority !== 'all') {
    filter.priority = priority;
  }

  const todos = await Todo.find(filter).sort({ createdAt: -1 });

  logger.debug('Fetched todos', { userId: req.user._id, count: todos.length, filters: filter });

  res.json(todos);
}));

// Create new todo
router.post('/', validate(todoSchemas.create), asyncHandler(async (req, res) => {
  const { title, description, category, priority, dueDate, subtasks, recurrence, sharedList } = req.body;

  const todo = new Todo({
    user: req.user._id,
    title,
    description,
    category,
    priority,
    dueDate,
    subtasks,
    recurrence,
    sharedList
  });

  await todo.save();

  logger.info('Todo created', { userId: req.user._id, todoId: todo._id, title: todo.title });

  res.status(201).json(todo);
}));

// Update todo
router.put('/:id', validate(todoSchemas.update), asyncHandler(async (req, res) => {
  const { title, description, category, priority, completed, dueDate, subtasks, recurrence } = req.body;

  const todo = await Todo.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  // Update fields
  if (title !== undefined) todo.title = title;
  if (description !== undefined) todo.description = description;
  if (category !== undefined) todo.category = category;
  if (priority !== undefined) todo.priority = priority;
  if (completed !== undefined) {
    const wasIncomplete = !todo.completed;
    todo.completed = completed;

    // If task is being marked complete and has recurrence, create next instance
    if (completed && wasIncomplete && todo.recurrence && todo.recurrence.enabled) {
      await handleRecurringCompletion(todo._id);
    }
  }
  if (dueDate !== undefined) todo.dueDate = dueDate;
  if (subtasks !== undefined) todo.subtasks = subtasks;
  if (recurrence !== undefined) todo.recurrence = recurrence;

  await todo.save();

  logger.info('Todo updated', { userId: req.user._id, todoId: todo._id, changes: Object.keys(req.body) });

  res.json(todo);
}));

// Delete todo
router.delete('/:id', asyncHandler(async (req, res) => {
  const todo = await Todo.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  await Todo.findByIdAndDelete(req.params.id);

  logger.info('Todo deleted', { userId: req.user._id, todoId: req.params.id });

  res.json({ message: 'Todo deleted successfully' });
}));

// Set or update recurrence for a todo
router.put('/:id/recurrence', asyncHandler(async (req, res) => {
  const { recurrence } = req.body;

  const todo = await Todo.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  // Update recurrence settings
  todo.recurrence = {
    ...todo.recurrence,
    ...recurrence,
    nextDue: calculateNextDueDate(todo, new Date())
  };

  await todo.save();

  logger.info('Todo recurrence updated', { userId: req.user._id, todoId: todo._id });

  res.json(todo);
}));

// Remove recurrence from a todo
router.delete('/:id/recurrence', asyncHandler(async (req, res) => {
  const todo = await Todo.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!todo) {
    return res.status(404).json({ message: 'Todo not found' });
  }

  // Disable recurrence
  todo.recurrence.enabled = false;
  await todo.save();

  logger.info('Todo recurrence disabled', { userId: req.user._id, todoId: todo._id });

  res.json({ message: 'Recurrence disabled', todo });
}));

// Get todo statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get start and end of today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [total, completed, pending, overdue, dueToday] = await Promise.all([
    Todo.countDocuments({ user: userId }),
    Todo.countDocuments({ user: userId, completed: true }),
    Todo.countDocuments({ user: userId, completed: false }),
    Todo.countDocuments({
      user: userId,
      completed: false,
      dueDate: { $lt: todayStart }
    }),
    Todo.countDocuments({
      user: userId,
      completed: false,
      dueDate: { $gte: todayStart, $lte: todayEnd }
    })
  ]);

  const byCategory = await Todo.aggregate([
    { $match: { user: userId } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const categoryStats = {};
  byCategory.forEach(item => {
    categoryStats[item._id] = item.count;
  });

  logger.debug('Stats fetched', { userId, total, completed, pending });

  res.json({
    total,
    completed,
    pending,
    overdue,
    dueToday,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    byCategory: categoryStats
  });
}));

module.exports = router;