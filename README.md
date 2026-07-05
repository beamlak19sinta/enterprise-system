# 🚀 ERP System — Enterprise Resource Planning

A full-stack, production-ready Enterprise Resource Planning system built with Next.js, Express.js, and MongoDB.

## ✨ Features

- **Authentication** — JWT, refresh tokens, email verification, password reset
- **Role-Based Access Control** — 6 roles with granular permissions
- **Dashboard** — Real-time KPIs, revenue charts, sales stats, inventory charts
- **Employee Management** — Full CRUD, profiles, documents, departments
- **HR** — Attendance tracking, leave requests, payroll processing
- **Sales** — Orders, invoices, customer management
- **Inventory** — Products, categories, warehouses, low-stock alerts
- **Purchasing** — Purchase orders, supplier management, goods receiving
- **Finance** — Transactions, accounts, budgets, P&L statements
- **Reports** — Export PDF & Excel for all modules
- **Real-Time Notifications** — Socket.IO powered
- **Dark Mode** — Full dark/light theme support
- **Responsive** — Mobile-first design

## 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@erpsystem.com | Admin@123456 |
| HR Manager | hr@erpsystem.com | Hr@123456 |
| Finance Manager | finance@erpsystem.com | Finance@123456 |
| Inventory Manager | inventory@erpsystem.com | Inventory@123456 |
| Sales Manager | sales@erpsystem.com | Sales@123456 |
| Employee | emp1@erpsystem.com | Employee@123456 |

## ⚠️ MongoDB Atlas Setup (Required Before Running)

The app is configured to use MongoDB Atlas. Before running:

1. Go to [mongodb.com/atlas](https://cloud.mongodb.com)
2. Sign in and navigate to your **Cluster0** cluster
3. Go to **Database Access** → find user `beamlaksintayheu6_db_user`
4. Click **Edit** and confirm/reset the password to `muna1921`
5. Go to **Network Access** → Add `0.0.0.0/0` to allow all IPs (for development)
6. The connection string in `backend/.env` is already configured

If you get `bad auth` errors, the password in Atlas doesn't match. Reset it in the Atlas dashboard.



**Frontend:** Next.js 14, React 18, Tailwind CSS, Zustand, Recharts, Framer Motion, Lucide Icons

**Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.IO, bcryptjs

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/erp-system.git
cd erp-system
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### 3. Seed the database
```bash
cd backend
npm run seed
```

### 4. Setup Frontend
```bash
cd frontend
npm install --legacy-peer-deps
cp .env.local.example .env.local
npm run dev
```

### 5. Access the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

## 🐳 Docker Setup

```bash
# Start all services
docker compose up -d

# Seed database
docker exec erp-backend node dist/utils/seed.js

# Stop services
docker compose down
```

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/forgot-password | Request reset |
| PATCH | /api/auth/reset-password/:token | Reset password |
| GET | /api/auth/me | Get current user |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | List employees |
| POST | /api/employees | Create employee |
| GET | /api/employees/:id | Get employee |
| PATCH | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Terminate employee |

*(All modules follow REST conventions)*

## 📁 Project Structure

```
erp-system/
├── backend/
│   ├── src/
│   │   ├── config/        # DB, logger, email
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Auth, error handling
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   └── utils/         # Helpers, seed
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # UI & layout components
│   │   ├── lib/           # API client, utils
│   │   └── store/         # Zustand state
│   ├── .env.local
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🚀 Deployment

### Netlify (Frontend)
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables

### Render / Railway (Backend)
1. Connect repo
2. Set start command: `node dist/server.js`
3. Add all environment variables

### MongoDB Atlas
1. Create free cluster at mongodb.com
2. Get connection string
3. Update `MONGODB_URI` in backend `.env`

## 📄 License

MIT License — free to use for personal and commercial projects.
