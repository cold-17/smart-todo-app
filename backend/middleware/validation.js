const Joi = require('joi');
const logger = require('../config/logger');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation failed', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        errors,
      });

      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Common validation patterns
const patterns = {
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
    }),
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .max(255)
    .messages({
      'string.email': 'Please provide a valid email address',
    }),
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(20)
    .trim()
    .messages({
      'string.alphanum': 'Username must only contain alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 20 characters',
    }),
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid ID format',
    }),
};

// Auth validation schemas
const authSchemas = {
  register: Joi.object({
    username: patterns.username.required(),
    email: patterns.email.required(),
    password: patterns.password.required(),
  }),
  login: Joi.object({
    email: patterns.email.required(),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
};

// Todo validation schemas
const todoSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': 'Title is required',
      'string.max': 'Title must not exceed 200 characters',
    }),
    description: Joi.string().trim().max(1000).allow('').optional(),
    category: Joi.string()
      .valid('work', 'personal', 'health', 'learning', 'general')
      .default('general'),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .default('medium'),
    dueDate: Joi.date().iso().min('now').allow(null).optional().messages({
      'date.min': 'Due date cannot be in the past',
    }),
    subtasks: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().trim().min(1).max(200).required(),
          completed: Joi.boolean().default(false),
        })
      )
      .max(50)
      .optional(),
    sharedList: patterns.objectId.allow(null).optional(),
    recurrence: Joi.object({
      enabled: Joi.boolean().default(false),
      pattern: Joi.string()
        .valid('daily', 'weekly', 'monthly', 'yearly', 'custom')
        .default('daily'),
      interval: Joi.number().integer().min(1).max(365).default(1),
      daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
      dayOfMonth: Joi.number().integer().min(1).max(31).optional(),
      endDate: Joi.date().iso().min('now').allow(null).optional(),
    }).optional(),
  }),
  update: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    description: Joi.string().trim().max(1000).allow('').optional(),
    category: Joi.string()
      .valid('work', 'personal', 'health', 'learning', 'general')
      .optional(),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .optional(),
    completed: Joi.boolean().optional(),
    dueDate: Joi.date().iso().allow(null).optional(),
    subtasks: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().trim().min(1).max(200).required(),
          completed: Joi.boolean().default(false),
          _id: patterns.objectId.optional(),
        })
      )
      .max(50)
      .optional(),
    recurrence: Joi.object({
      enabled: Joi.boolean(),
      pattern: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly', 'custom'),
      interval: Joi.number().integer().min(1).max(365),
      daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
      dayOfMonth: Joi.number().integer().min(1).max(31).optional(),
      endDate: Joi.date().iso().min('now').allow(null).optional(),
    }).optional(),
  }).min(1),
};

// SharedList validation schemas
const sharedListSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'List name is required',
      'string.max': 'List name must not exceed 100 characters',
    }),
  }),
  invite: Joi.object({
    email: patterns.email.required(),
    role: Joi.string().valid('editor', 'viewer').default('editor'),
  }),
};

// AI validation schemas
const aiSchemas = {
  parseTask: Joi.object({
    input: Joi.string().trim().min(1).max(500).required().messages({
      'string.empty': 'Task input is required',
      'string.max': 'Task input must not exceed 500 characters',
    }),
  }),
  suggestPriority: Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(1000).allow('').optional(),
    dueDate: Joi.date().iso().allow(null).optional(),
  }),
  decomposeTask: Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(1000).allow('').optional(),
  }),
  categorizeTask: Joi.object({
    title: Joi.string().trim().min(1).max(200).required(),
    description: Joi.string().trim().max(1000).allow('').optional(),
  }),
};

module.exports = {
  validate,
  patterns,
  authSchemas,
  todoSchemas,
  sharedListSchemas,
  aiSchemas,
};
