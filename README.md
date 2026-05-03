# TaskFlow - Team Task Manager

TaskFlow is a MERN stack task management app for small teams. It lets users create projects, invite teammates, assign work, move tasks across a Kanban-style workflow, and view project activity from a dashboard.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React, React Router, Axios, Vite |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcryptjs |
| Deployment | Vercel |

## Main Features

- User signup and login with hashed passwords
- JWT-protected backend routes
- Project creation and member management
- Admin and member roles inside each project
- Task creation, assignment, status updates, priority, and due dates
- Kanban columns for To Do, In Progress, and Done
- Dashboard summary for projects, tasks, overdue work, and recent activity

## Folder Structure

```txt
team-task-manager/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── vercel.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   └── utils/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── vercel.json
```

## Local Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Vercel Deployment

Deploy the backend and frontend as two separate Vercel projects from the same repository.

### Backend

Use `backend` as the root directory.

Required environment variables:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
```

### Frontend

Use `frontend` as the root directory.

Required environment variable:

```env
VITE_API_URL=https://your-backend-domain.vercel.app/api
```

After changing Vercel environment variables, redeploy the affected project.

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Create a new user |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get the logged-in user |
| GET | `/api/projects` | List user projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project |
| POST | `/api/projects/:id/members` | Add a project member |
| DELETE | `/api/projects/:id/members/:userId` | Remove a project member |
| GET | `/api/tasks/project/:projectId` | List project tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/dashboard` | Get dashboard data |

## Notes

- Keep `.env` files out of Git.
- Use MongoDB Atlas for deployment.
- Set the frontend URL in the backend `CLIENT_URL` variable to avoid CORS errors.
- Set the backend API URL in the frontend `VITE_API_URL` variable before building.
