const Joi = require('joi');

// Environment variables schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(5000),
  MONGODB_URI: Joi.string().uri().required().messages({
    'any.required': 'MONGODB_URI is required. Please set it in your .env file.',
    'string.uri': 'MONGODB_URI must be a valid URI.',
  }),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_SECRET is required. Please set it in your .env file.',
    'string.min': 'JWT_SECRET must be at least 32 characters for security.',
  }),
  CLIENT_URL: Joi.string().uri().default('http://localhost:5173'),
  OPENAI_API_KEY: Joi.string().optional().messages({
    'string.base': 'OPENAI_API_KEY must be a valid string if provided.',
  }),
  SENTRY_DSN: Joi.string().uri().optional().messages({
    'string.uri': 'SENTRY_DSN must be a valid URI if provided.',
  }),
  SENTRY_ENVIRONMENT: Joi.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).optional().default(0.1),
  SENTRY_PROFILES_SAMPLE_RATE: Joi.number().min(0).max(1).optional().default(0.1),
})
  .unknown(true) // Allow other env vars
  .required();

// Validate environment variables
const validateEnv = () => {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message).join('\n');
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  return value;
};

module.exports = validateEnv;
