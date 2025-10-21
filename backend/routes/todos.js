const express = require('express');
const Todo = require('../models/Todo');
const authMiddleware = require('../middleware/authMiddleware');

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
    const { title, description, category, priority, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    const todo = new Todo({
      user: req.user._id,
      title: title.trim(),
      description: description?.trim() || '',
      category: category || 'general',
      priority: priority || 'medium',
      dueDate: dueDate || null
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
    const { title, description, category, priority, completed, dueDate, subtasks } = req.body;

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
    if (completed !== undefined) todo.completed = completed;
    if (dueDate !== undefined) todo.dueDate = dueDate;
    if (subtasks !== undefined) todo.subtasks = subtasks;

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

// Get todo statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [total, completed, pending, overdue] = await Promise.all([
      Todo.countDocuments({ user: userId }),
      Todo.countDocuments({ user: userId, completed: true }),
      Todo.countDocuments({ user: userId, completed: false }),
      Todo.countDocuments({ 
        user: userId, 
        completed: false, 
        dueDate: { $lt: new Date() }
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
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCategory: categoryStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;