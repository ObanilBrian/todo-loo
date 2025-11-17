# ToDo Loo! 📋

A full-stack Kanban-style task management application built with Next.js, React, MongoDB, and JWT authentication.

## Features

✅ **User Authentication**: Secure login/registration with JWT tokens and bcryptjs password hashing  
✅ **Kanban Board**: Organize tasks across 4 columns (Backlog, TODO, In Progress, Done)  
✅ **Drag & Drop**: Reorder tasks within columns or move between columns with visual indicators  
✅ **Task Management**: Create, read, update, and delete tasks with real-time persistence  
✅ **Database Persistence**: All tasks stored in MongoDB with user ownership validation  
✅ **Responsive UI**: Bootstrap-based responsive design with smooth animations  
✅ **Protected Routes**: Dashboard access restricted to authenticated users

## Tech Stack

**Frontend:**

- Next.js 16.0.3
- React 19.2.0
- Bootstrap 5.3.8
- HTML5 Drag & Drop API

**Backend:**

- Node.js API Routes (Next.js)

**Database & Authentication:**

- MongoDB (local: `mongodb://localhost:27017/todo-loo`)
- Mongoose 7.5.0 (ODM)
- JWT (jsonwebtoken 9.1.0)
- bcryptjs 2.4.3 (password hashing)

## Prerequisites

- Node.js 16+
- MongoDB running locally
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create `.env.local`:

```bash
cp .env.local.example .env.local
```

Configure:

```env
MONGODB_URI=mongodb://localhost:27017/todo-loo
JWT_SECRET=your-secret-key-change-in-production
```

### 3. Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## API Endpoints

All endpoints require JWT authentication (cookie or Authorization header).

### Authentication

**POST /api/register**

- Register new user
- Body: `{ username: string, password: string }`
- Response: `{ message, user: { id, username }, token }`

**POST /api/login**

- Login existing user
- Body: `{ username: string, password: string }`
- Response: `{ message, user: { id, username }, token }`

**POST /api/logout**

- Logout user and clear token
- Response: `{ message }`

### Tasks CRUD

**GET /api/tasks**

- Fetch all user tasks, sorted by column and position
- Response: `{ message, tasks: Task[] }`

**POST /api/tasks**

- Create new task
- Body: `{ title: string (required), description?: string, column?: "backlog"|"todo"|"inProgress"|"done" }`
- Response: `{ message, task: Task }`

**PUT /api/tasks**

- Update task or move to different column
- Body: `{ taskId: string (required), title: string (required), description?: string, column?: string, position?: number }`
- Response: `{ message, task: Task }`

**DELETE /api/tasks?taskId=<id>**

- Delete task
- Response: `{ message }`

### Task Object Schema

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "user_id",
  "title": "Design UI",
  "description": "Create mockups",
  "column": "backlog",
  "position": 0,
  "createdAt": "2025-11-17T10:00:00Z",
  "updatedAt": "2025-11-17T10:00:00Z"
}
```

### HTTP Status Codes

- **200**: Success (GET, PUT)
- **201**: Created (POST)
- **400**: Bad request (invalid input)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (user doesn't own task)
- **404**: Not found
- **500**: Server error

## Project Structure

```
src/
├── pages/
│   ├── _app.js              # App wrapper
│   ├── index.js             # Landing page
│   ├── login.js             # Login/Register page
│   ├── dashboard.js         # Main kanban board
│   └── api/
│       ├── register.js      # Registration endpoint
│       ├── login.js         # Login endpoint
│       ├── logout.js        # Logout endpoint
│       └── tasks.js         # Task CRUD endpoints
├── components/
│   ├── Column/              # Kanban column
│   ├── Card/                # Task card
│   ├── AddCardModal/        # Task creation/edit form
│   └── DeleteConfirmModal/  # Delete confirmation
├── hooks/
│   ├── useAuth.js           # Authentication logic
│   ├── useCardManagement.js # Task CRUD operations
│   └── useDragDrop.js       # Drag & drop logic
├── styles/
│   ├── globals.css          # Global styles
│   ├── auth.module.css      # Auth page styles
│   ├── dashboard.module.css # Dashboard styles
│   └── card.module.css      # Card styles
└── lib/
    ├── mongodb.js           # MongoDB connection
    ├── jwt.js               # JWT utilities
    ├── models/
    │   ├── User.js          # User schema
    │   └── Task.js          # Task schema
    └── handlers/tasks/      # Task operation handlers
        ├── getTasks.js
        ├── createTask.js
        ├── updateTask.js
        └── deleteTask.js
```

## Database Schemas

### User

- `_id`: ObjectId (MongoDB ID)
- `username`: String (unique, lowercase, 3-30 chars)
- `password`: String (hashed with bcryptjs)
- `createdAt`: Date

### Task

- `_id`: ObjectId (MongoDB ID)
- `userId`: ObjectId (reference to User)
- `title`: String (1-255 chars, required)
- `description`: String (0-2000 chars)
- `column`: String (enum: backlog|todo|inProgress|done)
- `position`: Number (order within column)
- `createdAt`: Date
- `updatedAt`: Date

## User Flow

1. **Register/Login** → Enter username & password
2. **Dashboard** → View kanban board with your tasks
3. **Create Task** → Click "+ Add Card" button
4. **Edit Task** → Click pencil icon to modify
5. **Delete Task** → Click trash icon with confirmation
6. **Move Task** → Drag & drop to different column or position
7. **Logout** → Click logout button to exit

## Key Features

### Drag & Drop

- Visual drop indicators show insertion point
- Move within column or across columns
- Position-aware (top, middle, bottom)
- Optimistic UI with database sync

### Authentication

- Password hashed with bcryptjs (10 rounds)
- JWT tokens with 7-day expiration
- HTTP-only cookies
- Token validation on all protected routes

### Task Persistence

- MongoDB storage
- User-scoped (each user sees only their tasks)
- Automatic timestamps
- Position tracking for ordering

## License

MIT
