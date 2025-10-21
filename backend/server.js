const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup with CORS
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/shared-lists', require('./routes/sharedLists'));

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Smart ToDo App Backend Running!' });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/smart-todo-app')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Socket.io connection handling
require('./sockets/todoSocket')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));