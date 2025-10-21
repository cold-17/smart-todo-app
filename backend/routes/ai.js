const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { parseTask, suggestPriority, decomposeTask, categorizeTask } = require('../services/openai');

const router = express.Router();

// All AI routes are protected
router.use(authMiddleware);

/**
 * POST /api/ai/parse-task
 * Parse natural language input into structured todo data
 * Body: { input: string }
 * Returns: { title, description, category, priority, dueDate, subtasks }
 */
router.post('/parse-task', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== 'string' || input.trim() === '') {
      return res.status(400).json({ message: 'Input text is required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return res.status(503).json({
        message: 'AI service not configured. Please add your OpenAI API key to the .env file.'
      });
    }

    const parsed = await parseTask(input.trim());
    res.json(parsed);
  } catch (error) {
    console.error('Parse task error:', error);
    res.status(500).json({ message: 'Failed to parse task', error: error.message });
  }
});

/**
 * POST /api/ai/suggest-priority
 * Suggest priority based on task content
 * Body: { title: string, description?: string, dueDate?: string }
 * Returns: { priority: string }
 */
router.post('/suggest-priority', async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return res.status(503).json({
        message: 'AI service not configured'
      });
    }

    const priority = await suggestPriority(title.trim(), description?.trim(), dueDate);
    res.json({ priority });
  } catch (error) {
    console.error('Suggest priority error:', error);
    res.status(500).json({ message: 'Failed to suggest priority', error: error.message });
  }
});

/**
 * POST /api/ai/decompose-task
 * Break down a complex task into subtasks
 * Body: { title: string, description?: string }
 * Returns: { subtasks: string[] }
 */
router.post('/decompose-task', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return res.status(503).json({
        message: 'AI service not configured'
      });
    }

    const subtasks = await decomposeTask(title.trim(), description?.trim());
    res.json({ subtasks });
  } catch (error) {
    console.error('Decompose task error:', error);
    res.status(500).json({ message: 'Failed to decompose task', error: error.message });
  }
});

/**
 * POST /api/ai/categorize-task
 * Auto-categorize a task based on content
 * Body: { title: string, description?: string }
 * Returns: { category: string }
 */
router.post('/categorize-task', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return res.status(503).json({
        message: 'AI service not configured'
      });
    }

    const category = await categorizeTask(title.trim(), description?.trim());
    res.json({ category });
  } catch (error) {
    console.error('Categorize task error:', error);
    res.status(500).json({ message: 'Failed to categorize task', error: error.message });
  }
});

module.exports = router;
