# ⚡ TaskFlow – Team Task Manager

A full-stack MERN application for collaborative project and task management. Teams can create projects, assign tasks, track progress with a Kanban board, and view analytics on a dashboard.

---

## 🚀 Live Demo
> Replace with your deployed URL after deployment to Railway

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, date-fns |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Deployment | Railway (backend + frontend) |

---

## ✨ Features

### Authentication
- Secure signup with name, email, password (bcrypt hashed)
- JWT-based login (7-day tokens)
- Protected routes on both frontend and backend

### Project Management
- Create projects (auto-assigned as Admin)
- Add/remove members by email
- Assign Member or Admin roles
- Delete projects (cascades to tasks)

### Task Management
- Kanban board (To Do / In Progress / Done)
- Task fields: Title, Description, Due Date, Priority (Low/Medium/High), Assignee
- Admins: full CRUD on all tasks
- Members: update status on their assigned tasks
- Overdue indicator for past-due tasks

### Dashboard
- Total tasks, projects, my tasks, overdue count
- Visual bar charts: tasks by status and per user
- Recent tasks feed

### Role-Based Access
- **Admin**: create/edit/delete tasks, manage members, delete project
- **Member**: view all tasks, update status on assigned tasks only

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema + password hashing
│   │   ├── Project.js       # Project schema with embedded members
│   │   └── Task.js          # Task schema with indexes
│   ├── routes/
│   │   ├── auth.js          # Signup, login, /me
│   │   ├── projects.js      # CRUD + member management
│   │   ├── tasks.js         # CRUD with role-based access
│   │   └── dashboard.js     # Aggregated stats
│   ├── middleware/
│   │   └── auth.js          # JWT protect middleware
│   ├── server.js            # Express app entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Layout.js    # Sidebar + nav
    │   ├── context/
    │   │   └── AuthContext.js  # Global auth state
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Signup.js
    │   │   ├── Dashboard.js
    │   │   ├── Projects.js
    │   │   └── ProjectDetail.js  # Kanban + members
    │   ├── utils/
    │   │   └── api.js       # Axios instance with interceptors
    │   ├── App.js           # Routes
    │   ├── index.js
    │   └── index.css        # Design system
    └── package.json
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local) or MongoDB Atlas URI

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/team-task-manager.git
cd team-task-manager
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev   # starts on port 5000
```

**Backend `.env`:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_super_secret_key_change_this
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env
npm start     # starts on port 3000
```

**Frontend `.env`:**
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🚂 Deployment to Railway

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

### Step 2: Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo → select the `backend` folder as root directory
3. Railway will auto-detect Node.js
4. Add environment variables in Railway dashboard:
   - `MONGO_URI` – your MongoDB Atlas connection string
   - `JWT_SECRET` – a long random string
   - `CLIENT_URL` – your frontend Railway URL (add after deploying frontend)
   - `NODE_ENV` – `production`
5. Deploy and copy the backend URL (e.g., `https://taskflow-backend.railway.app`)

### Step 3: Deploy Frontend on Railway
1. New Service → Deploy from GitHub (same repo, `frontend` folder)
2. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-backend-url.railway.app/api`
3. Set build command: `npm run build`
4. Set start command: `npx serve -s build -l $PORT`
5. Or add a `Procfile` in frontend: `web: npx serve -s build -l $PORT`
6. Deploy and copy the frontend URL

### Step 4: Update CORS
Go back to the backend Railway service and update `CLIENT_URL` to your frontend Railway URL.

### MongoDB Atlas Setup
1. Create free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create database user and whitelist all IPs (`0.0.0.0/0`)
3. Copy the connection string and set as `MONGO_URI`

---

## 🔌 API Endpoints

### Auth
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/signup` | Register | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Current user | Yes |

### Projects
| Method | Route | Description | Role |
|--------|-------|-------------|------|
| GET | `/api/projects` | My projects | Any |
| POST | `/api/projects` | Create project | Any |
| GET | `/api/projects/:id` | Get project | Member |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project | Admin |
| POST | `/api/projects/:id/members` | Add member | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Admin |

### Tasks
| Method | Route | Description | Role |
|--------|-------|-------------|------|
| GET | `/api/tasks/project/:id` | Project tasks | Member |
| POST | `/api/tasks` | Create task | Admin |
| PUT | `/api/tasks/:id` | Update task | Admin (all) / Member (status only) |
| DELETE | `/api/tasks/:id` | Delete task | Admin |

### Dashboard
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/dashboard` | Stats | Yes |

---

## 📝 Design Decisions

- **Embedded members in Project** – Avoids extra collection join for member lookups
- **Role stored per project** – Same user can be Admin in one project and Member in another
- **JWT in localStorage** – Simple for SPA; for production consider httpOnly cookies
- **Cascade delete** – Deleting a project removes all its tasks automatically
- **Axios interceptors** – Auto-attach token, auto-redirect on 401

---

## 🤝 Author
Built as a full-stack coding assignment demonstrating MERN development skills.
