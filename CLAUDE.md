# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart ToDo App is a full-stack todo application with JWT authentication and productivity tracking. The application uses a monorepo structure with separate frontend and backend directories.

**Tech Stack:**
- Frontend: React 19 + Vite, Tailwind CSS, React Router, Axios, Socket.io Client
- Backend: Node.js + Express 5, MongoDB + Mongoose, JWT auth, bcryptjs, Socket.io
- AI: OpenAI GPT-4 for natural language task parsing and smart features
- Real-time: Socket.io for live collaboration and presence tracking

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
Multiple React Context providers wrap the entire app:
- **AuthContext**: Manages user authentication, login/register/logout, token persistence
- **TodoContext**: Manages todo CRUD operations, filtering, statistics, and real-time sync
- **ThemeContext**: Manages dark mode with localStorage persistence
- **SocketContext**: Manages WebSocket connections, room management, presence tracking
- **ToastProvider**: Global toast notifications with auto-dismiss

All contexts use useReducer pattern and provide custom hooks (`useAuth`, `useTodos`, `useTheme`, `useSocket`, `useToast`).

### API Communication
- Axios configured with base URL `http://localhost:5000/api` in AuthContext
- Authorization header automatically set when token exists
- All todo routes (`/api/todos/*`) and AI routes (`/api/ai/*`) require authentication
- Auth routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- AI routes: `/api/ai/parse-task`, `/api/ai/suggest-priority`, `/api/ai/decompose-task`, `/api/ai/categorize-task`

### Data Model
Todo schema (`backend/models/Todo.js`):
- User reference (required)
- SharedList reference (optional) - links todo to a collaborative list
- Title (max 200 chars), description (max 1000 chars)
- Category: `work | personal | health | learning | urgent | general`
- Priority: `low | medium | high | urgent`
- Boolean `completed` flag with auto-tracking of `completedAt` timestamp
- Optional `dueDate`
- Subtasks array: `[{ text, completed, createdAt }]`

SharedList schema (`backend/models/SharedList.js`):
- Name (max 100 chars)
- Owner reference (required)
- Members array: `[{ user, addedAt, role }]` where role is `owner | editor | viewer`
- Pending invites array: `[{ email, invitedAt, invitedBy }]`
- Helper methods: `isMember()`, `getUserRole()`, `canEdit()`

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
- `/api/ai/parse-task` → POST natural language task parsing (requires OPENAI_API_KEY)
- `/api/ai/suggest-priority` → POST priority suggestion based on task content
- `/api/ai/decompose-task` → POST task decomposition into subtasks
- `/api/ai/categorize-task` → POST auto-categorization
- `/api/shared-lists` → GET all shared lists, POST create new list
- `/api/shared-lists/:id` → GET specific list, DELETE list
- `/api/shared-lists/:id/invite` → POST invite user by email
- `/api/shared-lists/:id/members/:userId` → DELETE remove member
- `/api/shared-lists/:id/todos` → GET todos for a shared list

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
Backend requires (create `/backend/.env` file):
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for signing JWT tokens
- `PORT`: Backend port (defaults to 5000)
- `OPENAI_API_KEY`: OpenAI API key for AI features (optional, but required for smart task parsing)

Frontend hardcodes backend URL as `http://localhost:5000/api` in AuthContext and useAI hook.

## AI Features
The Smart Add Todo Form includes AI-powered features:
- **Natural Language Parsing**: Type tasks like "Finish the marketing report by Friday" and AI extracts title, category, priority, and due date
- **Smart Subtask Generation**: AI automatically breaks down complex tasks into actionable subtasks
- **Auto-Categorization**: AI suggests the most appropriate category based on task content
- **Priority Suggestion**: AI recommends priority level based on keywords and urgency

AI features require a valid OpenAI API key in the backend `.env` file. The app gracefully falls back to manual mode if the API key is not configured.

## Key Features
- JWT authentication with protected routes
- Dark mode support with system preference detection
- Toast notifications for user feedback
- Subtasks with progress tracking
- Bulk actions (select multiple, complete/delete all)
- Advanced filtering and sorting (by priority, due date, category, title)
- Overdue task highlighting
- Statistics dashboard (total, completed, pending, completion rate)
- AI-powered task creation and management
- **Real-time Collaboration**:
  - Create shared todo lists
  - Invite team members by email
  - Live presence indicators (see who's online)
  - Real-time sync of todo changes across all connected users
  - Role-based access control (owner/editor/viewer)
  - WebSocket connection with JWT authentication
