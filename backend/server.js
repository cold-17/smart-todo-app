const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Load and validate environment variables
const validateEnv = require('./config/env');
const env = validateEnv();

// Initialize logger
const logger = require('./config/logger');

// Import error handlers
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import rate limiters
const { apiLimiter, authLimiter, aiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust proxy - needed when behind Nginx reverse proxy
app.set('trust proxy', 1);

// Initialize Sentry (must be before any other middleware)
const { initSentry } = require('./config/sentry');
const sentry = initSentry(app);

// Sentry request handler (must be the first middleware)
if (sentry.isEnabled) {
  app.use(sentry.requestHandler);
  app.use(sentry.tracingMiddleware);
}

const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security Middleware - Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
// NoSQL injection prevention is handled by Joi validation (stripUnknown: true)

// Rate limiting - Apply different limits to different route types
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', aiLimiter);

// CORS - Configure allowed origins
const allowedOrigins = env.CLIENT_URL.split(',').map(url => url.trim());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/shared-lists', require('./routes/sharedLists'));
app.use('/api/analytics', require('./routes/analytics'));

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Smart ToDo App Backend Running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// Database connection
mongoose.connect(env.MONGODB_URI)
  .then(() => {
    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    });
  })
  .catch(err => {
    logger.error('MongoDB connection error', { error: err.message });
    process.exit(1);
  });

// Socket.io connection handling
require('./sockets/todoSocket')(io);

// Error handling - must be after all routes
// Sentry error handler must be before other error handlers
if (sentry.isEnabled) {
  app.use(sentry.errorHandler);
}

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.PORT;
server.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: env.NODE_ENV,
    nodeVersion: process.version,
  });
});