const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Load and validate environment variables
const validateEnv = require('./config/env');
const env = validateEnv();

// Initialize logger
const logger = require('./config/logger');

// Import error handlers
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security Middleware
app.use(helmet());
// NoSQL injection prevention is handled by Joi validation (stripUnknown: true)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true
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