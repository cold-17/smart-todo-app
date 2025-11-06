const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { parseTask, suggestPriority, decomposeTask, categorizeTask } = require('../services/openai');
const { validate, aiSchemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const router = express.Router();

// All AI routes are protected
router.use(authMiddleware);

/**
 * POST /api/ai/parse-task
 * Parse natural language input into structured todo data
 * Body: { input: string }
 * Returns: { title, description, category, priority, dueDate, subtasks }
 */
router.post('/parse-task', validate(aiSchemas.parseTask), asyncHandler(async (req, res) => {
  const { input } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    logger.warn('AI service called but not configured', { userId: req.user._id });
    return res.status(503).json({
      message: 'AI service not configured. Please add your OpenAI API key to the .env file.'
    });
  }

  logger.info('Parsing task with AI', { userId: req.user._id });

  const parsed = await parseTask(input);
  res.json(parsed);
}));

/**
 * POST /api/ai/suggest-priority
 * Suggest priority based on task content
 * Body: { title: string, description?: string, dueDate?: string }
 * Returns: { priority: string }
 */
router.post('/suggest-priority', validate(aiSchemas.suggestPriority), asyncHandler(async (req, res) => {
  const { title, description, dueDate } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    return res.status(503).json({
      message: 'AI service not configured'
    });
  }

  logger.info('Suggesting priority with AI', { userId: req.user._id });

  const priority = await suggestPriority(title, description, dueDate);
  res.json({ priority });
}));

/**
 * POST /api/ai/decompose-task
 * Break down a complex task into subtasks
 * Body: { title: string, description?: string }
 * Returns: { subtasks: string[] }
 */
router.post('/decompose-task', validate(aiSchemas.decomposeTask), asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    return res.status(503).json({
      message: 'AI service not configured'
    });
  }

  logger.info('Decomposing task with AI', { userId: req.user._id });

  const subtasks = await decomposeTask(title, description);
  res.json({ subtasks });
}));

/**
 * POST /api/ai/categorize-task
 * Auto-categorize a task based on content
 * Body: { title: string, description?: string }
 * Returns: { category: string }
 */
router.post('/categorize-task', validate(aiSchemas.categorizeTask), asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    return res.status(503).json({
      message: 'AI service not configured'
    });
  }

  logger.info('Categorizing task with AI', { userId: req.user._id });

  const category = await categorizeTask(title, description);
  res.json({ category });
}));

module.exports = router;
