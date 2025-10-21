# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart ToDo App is a full-stack todo application with JWT authentication and productivity tracking. The application uses a monorepo structure with separate frontend and backend directories.

**Tech Stack:**
- Frontend: React 19 + Vite, Tailwind CSS, React Router, Axios
- Backend: Node.js + Express 5, MongoDB + Mongoose, JWT auth, bcryptjs

## Development Commands

### Backend (from `/backend` directory)
```bash
npm run dev     # Start backend with nodemon (auto-reload)
npm start       # Start backend in production mode
```

### Frontend (from `/frontend` directory)
```bash
npm run dev     # Start Vite dev server (http://localhost:5173)
npm run build   # Build for production
npm run lint    # Run ESLint
npm run preview # Preview production build
```

### Running the Full Application
1. Start MongoDB (locally or use MongoDB Atlas connection string)
2. Configure backend: Set `MONGODB_URI`, `JWT_SECRET`, and `PORT` in environment variables or create `.env` file in `/backend`
3. Start backend: `cd backend && npm run dev`
4. Start frontend: `cd frontend && npm run dev`

## Architecture

### Authentication Flow
- JWT-based authentication with tokens stored in localStorage
- AuthContext (`frontend/src/context/AuthContext.jsx`) manages auth state using useReducer
- Auth token automatically added to all axios requests via interceptor
- Protected routes use `ProtectedRoute` component in `App.jsx`
- Backend auth middleware (`backend/middleware/authMiddleware.js`) validates JWT on protected routes

### State Management
Two React Context providers wrap the entire app:
- **AuthContext**: Manages user authentication, login/register/logout, token persistence
- **TodoContext**: Manages todo CRUD operations, filtering, and statistics

Both contexts use useReducer pattern for state management and provide custom hooks (`useAuth`, `useTodos`).

### API Communication
- Axios configured with base URL `http://localhost:5000/api` in AuthContext
- Authorization header automatically set when token exists
- All todo routes (`/api/todos/*`) require authentication
- Auth routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`

### Data Model
Todo schema (`backend/models/Todo.js`):
- User reference (required)
- Title (max 200 chars), description (max 1000 chars)
- Category: `work | personal | health | learning | urgent | general`
- Priority: `low | medium | high | urgent`
- Boolean `completed` flag with auto-tracking of `completedAt` timestamp
- Optional `dueDate`

### Routing Structure
Frontend routes (React Router v7):
- `/` → redirects to `/dashboard`
- `/login`, `/register` → public routes (redirect to dashboard if authenticated)
- `/dashboard` → protected route, main todo interface

Backend routes:
- `/api/auth/*` → register, login, get current user
- `/api/todos` → GET (with query filters), POST
- `/api/todos/:id` → PUT, DELETE
- `/api/todos/stats` → GET todo statistics (total, completed, pending, overdue, by category)

### Todo Filtering
Backend supports query parameters:
- `category`: filter by category (or 'all')
- `completed`: boolean filter
- `priority`: filter by priority (or 'all')

TodoContext's `fetchTodos()` constructs URLSearchParams from filter object.

## Database
- MongoDB connection string defaults to `mongodb://localhost/smart-todo-app`
- Connection managed in `backend/server.js`
- Uses Mongoose for schema and validation
- User model includes username, email, password (hashed with bcryptjs)

## Environment Variables
Backend requires:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for signing JWT tokens
- `PORT`: Backend port (defaults to 5000)

Frontend hardcodes backend URL as `http://localhost:5000/api` in AuthContext.
