# Smart ToDo App

A modern, feature-rich todo application with AI-powered task management, real-time collaboration, and comprehensive productivity analytics.

## Status

![Test Suite](https://github.com/YOUR_USERNAME/smart-todo-app/actions/workflows/test.yml/badge.svg)
![Docker Build](https://github.com/YOUR_USERNAME/smart-todo-app/actions/workflows/docker-build.yml/badge.svg)
![Code Quality](https://github.com/YOUR_USERNAME/smart-todo-app/actions/workflows/code-quality.yml/badge.svg)
![Deploy](https://github.com/YOUR_USERNAME/smart-todo-app/actions/workflows/deploy.yml/badge.svg)

> **Note**: Replace `YOUR_USERNAME` in the badge URLs with your GitHub username.

## Features

### Core Productivity
- **JWT Authentication** - Secure user authentication with token-based access
- **Dark Mode Support** - System preference detection and manual toggle
- **Advanced Filtering** - Filter by category, priority, status, and due date
- **Smart Subtasks** - Break down complex tasks with progress tracking
- **Bulk Actions** - Select multiple tasks for batch operations
- **Statistics Dashboard** - Track completion rates and productivity metrics

### AI-Powered Features
- **Natural Language Parsing** - Type tasks naturally like "Finish the marketing report by Friday"
- **Smart Priority Suggestions** - AI recommends priority based on task content
- **Auto-Categorization** - Automatic task categorization based on content
- **Task Decomposition** - AI breaks down complex tasks into actionable subtasks

### Real-Time Collaboration
- **Shared Todo Lists** - Create collaborative lists with team members
- **Live Presence** - See who's online in real-time
- **Real-Time Sync** - Changes sync instantly across all connected users
- **Role-Based Access** - Owner, editor, and viewer roles with permissions
- **Email Invitations** - Invite team members by email

### Analytics & Insights
- **Productivity Dashboard** - Comprehensive analytics with interactive charts
- **Daily Activity Trends** - Track tasks created vs completed over time
- **Category Breakdown** - Visual distribution of tasks by category
- **90-Day Heatmap** - GitHub-style productivity visualization
- **Streak Tracking** - Current and longest completion streaks
- **Achievement System** - Unlock badges for productivity milestones

### Focus & Time Management
- **Pomodoro Timer** - Built-in 25-minute focus sessions
- **Focus Mode** - Distraction-free task interface with keyboard shortcuts
- **Auto-Break Tracking** - Automatic short and long break management
- **Session Statistics** - Track completed pomodoros and total focus time

### Enhanced UI/UX
- **Drag & Drop** - Reorder tasks with smooth animations
- **Multiple View Modes** - List, grid, and compact views
- **Advanced Search** - Real-time search across all task fields
- **Smooth Animations** - Framer Motion powered transitions
- **Data Export** - Export to PDF, CSV, or JSON formats

## Tech Stack

### Frontend
- React 19 + Vite
- Tailwind CSS
- React Router v7
- Axios for API calls
- Socket.io Client for real-time features
- Recharts for data visualization
- Framer Motion for animations
- @dnd-kit for drag & drop

### Backend
- Node.js + Express 5
- MongoDB + Mongoose
- JWT authentication
- Socket.io for WebSocket connections
- Winston for structured logging
- Joi for input validation
- bcryptjs for password hashing

### AI Integration
- OpenAI GPT-4 for natural language processing
- Smart task parsing and categorization

### DevOps
- Docker & Docker Compose
- GitHub Actions CI/CD
- Trivy security scanning
- CodeQL analysis
- Automated testing with Jest

## Quick Start

### Prerequisites
- Node.js 18.x or 20.x
- MongoDB 7.0+
- (Optional) Docker & Docker Compose
- (Optional) OpenAI API key for AI features

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/smart-todo-app.git
   cd smart-todo-app
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install

   # Create .env file
   cat > .env <<EOF
   MONGODB_URI=mongodb://localhost:27017/smart-todo-app
   JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long
   PORT=5000
   OPENAI_API_KEY=your-openai-api-key-optional
   NODE_ENV=development
   EOF

   # Start backend
   npm run dev
   ```

3. **Set up Frontend**
   ```bash
   cd ../frontend
   npm install

   # Start frontend
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - API Health Check: http://localhost:5000/health

### Docker Development

The easiest way to run the entire stack:

```bash
# Start all services (MongoDB, backend, frontend)
docker-compose up

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:5000
# - MongoDB: localhost:27017
```

For more Docker options, see [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) or [DOCKER.md](./DOCKER.md).

## Development

### Backend Commands
```bash
cd backend

npm run dev          # Start with nodemon (auto-reload)
npm start           # Production mode
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint        # Run ESLint
```

### Frontend Commands
```bash
cd frontend

npm run dev         # Start Vite dev server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# With coverage
npm run test:coverage

# Integration tests require MongoDB
MONGODB_URI=mongodb://localhost:27017/test npm test
```

## Project Structure

```
smart-todo-app/
├── backend/
│   ├── config/           # Configuration (logger, env validation)
│   ├── middleware/       # Express middleware (auth, validation, error handling)
│   ├── models/          # Mongoose schemas (User, Todo, SharedList)
│   ├── routes/          # API routes
│   ├── __tests__/       # Test suites
│   ├── logs/            # Application logs
│   ├── Dockerfile       # Backend container
│   └── server.js        # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # React Context providers
│   │   ├── hooks/       # Custom React hooks
│   │   └── App.jsx      # Main app component
│   ├── Dockerfile       # Frontend container
│   └── nginx.conf       # Production nginx config
│
├── .github/
│   └── workflows/       # GitHub Actions CI/CD
│
├── docker-compose.yml          # Development Docker setup
├── docker-compose.prod.yml     # Production Docker setup
├── DOCKER.md                   # Docker documentation
├── DOCKER_QUICKSTART.md        # Docker quick start guide
└── CLAUDE.md                   # Claude Code project instructions
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Todos
- `GET /api/todos` - Get all todos (supports filtering)
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `GET /api/todos/stats` - Get todo statistics

### AI Features
- `POST /api/ai/parse-task` - Parse natural language task
- `POST /api/ai/suggest-priority` - Get AI priority suggestion
- `POST /api/ai/decompose-task` - Break down task into subtasks
- `POST /api/ai/categorize-task` - Auto-categorize task

### Shared Lists
- `GET /api/shared-lists` - Get all shared lists
- `POST /api/shared-lists` - Create new shared list
- `GET /api/shared-lists/:id` - Get specific list
- `DELETE /api/shared-lists/:id` - Delete list
- `POST /api/shared-lists/:id/invite` - Invite user by email
- `DELETE /api/shared-lists/:id/members/:userId` - Remove member
- `GET /api/shared-lists/:id/todos` - Get todos for shared list

### Analytics
- `GET /api/analytics` - Get productivity analytics (supports `?days=` parameter)

## Environment Variables

### Backend (.env)
```env
# Required
MONGODB_URI=mongodb://localhost:27017/smart-todo-app
JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long
PORT=5000

# Optional
OPENAI_API_KEY=sk-...
NODE_ENV=development
```

### Frontend
The frontend expects the backend API at `http://localhost:5000/api` by default. For production, set `VITE_API_URL` during build.

## Security Features

- **Input Validation** - Joi schemas validate all user input
- **Strong Password Policy** - Min 8 chars, uppercase, lowercase, number, special character
- **JWT Authentication** - Secure token-based auth with HTTP-only cookies
- **NoSQL Injection Prevention** - Input sanitization and validation
- **Structured Logging** - Winston logger with file rotation
- **Error Sanitization** - Production errors don't leak sensitive info
- **Environment Validation** - Required env vars validated on startup
- **Database Indexes** - Optimized queries with proper indexes
- **Security Scanning** - Trivy and CodeQL in CI/CD pipeline
- **Dependency Auditing** - Automated npm audit in CI

## Deployment

### Docker Production

```bash
# 1. Copy environment template
cp .env.docker.example .env.docker

# 2. Edit with your production values
nano .env.docker

# 3. Start production stack
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d
```

### CI/CD Pipeline

The project includes comprehensive GitHub Actions workflows:

- **Test Suite** - Runs on every push/PR
  - Backend tests on Node 18.x and 20.x
  - Frontend build and tests
  - Integration tests with MongoDB
  - Security audit (npm audit, TruffleHog)
  - Code coverage reporting

- **Docker Build** - Builds and scans images
  - Multi-arch Docker builds
  - Push to GitHub Container Registry
  - Trivy vulnerability scanning
  - Docker Compose validation

- **Code Quality** - Linting and security
  - ESLint for backend and frontend
  - CodeQL security analysis
  - Dependency review
  - Bundle size checking

- **Deploy** - Automated deployment
  - Staging deployment on `develop` branch
  - Production deployment on version tags
  - Database migrations
  - Health checks
  - Rollback on failure
  - Deployment notifications

For detailed CI/CD documentation, see [CICD.md](./CICD.md).

### Manual Deployment

See [DOCKER.md](./DOCKER.md) for detailed deployment instructions including:
- Cloud provider setup (AWS, DigitalOcean, GCP)
- Database backup strategies
- SSL/TLS configuration
- Production best practices

## Testing

The project includes comprehensive test coverage:

- **Unit Tests** - Models and middleware
- **Integration Tests** - API routes with MongoDB
- **Validation Tests** - All Joi schemas
- **Authentication Tests** - Registration, login, token verification

Current coverage: **124 tests** across all components.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

1. All PRs run automated tests
2. Code quality checks must pass
3. Docker builds must succeed
4. Security scans must pass
5. At least one approval required

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for GPT-4 API
- MongoDB for the database
- The React and Node.js communities
- All contributors and testers

## Support

- **Documentation**: See the `/docs` directory
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/smart-todo-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/smart-todo-app/discussions)

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Email notifications for due dates
- [ ] Calendar integration
- [ ] Advanced recurring tasks
- [ ] Team workspaces
- [ ] API rate limiting
- [ ] Internationalization (i18n)
- [ ] Voice input for tasks
- [ ] Integration with third-party tools (Slack, Trello, etc.)

---

Built with ❤️ using React, Node.js, and MongoDB
