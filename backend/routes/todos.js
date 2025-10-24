const express = require('express');
const Todo = require('../models/Todo');
const authMiddleware = require('../middleware/authMiddleware');
const { handleRecurringCompletion, calculateNextDueDate } = require('../services/recurrenceService');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Get all todos for logged-in user
router.get('/', async (req, res) => {
  try {
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
    res.json(todos);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new todo
router.post('/', async (req, res) => {
  try {
    const { title, description, category, priority, dueDate, subtasks, recurrence } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    const todo = new Todo({
      user: req.user._id,
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'general',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      subtasks: subtasks || [],
      recurrence: recurrence || undefined
    });

    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update todo
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, priority, completed, dueDate, subtasks, recurrence } = req.body;

    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Update fields
    if (title !== undefined) todo.title = title.trim();
    if (description !== undefined) todo.description = description.trim();
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
    res.json(todo);
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set or update recurrence for a todo
router.put('/:id/recurrence', async (req, res) => {
  try {
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
    res.json(todo);
  } catch (error) {
    console.error('Update recurrence error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove recurrence from a todo
router.delete('/:id/recurrence', async (req, res) => {
  try {
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

    res.json({ message: 'Recurrence disabled', todo });
  } catch (error) {
    console.error('Remove recurrence error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get todo statistics
router.get('/stats', async (req, res) => {
  try {
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

    res.json({
      total,
      completed,
      pending,
      overdue,
      dueToday,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory: categoryStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;