# 🎓 StudentsConnect — Campus Skill Marketplace

> A peer-to-peer platform for college students to post tasks, find freelance work, and collaborate — all within their own campus community.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [How to Run](#how-to-run)
- [API Endpoints](#api-endpoints)
- [Features](#features)
- [User Flow](#user-flow)
- [College-Based Isolation](#college-based-isolation)
- [Order Lifecycle](#order-lifecycle)
- [Database Models](#database-models)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Overview

StudentsConnect is a full-stack web application where students can:
- **Post jobs** (assignments, coding tasks, notes, design work, etc.)
- **Apply for jobs** posted by fellow students
- **Get assigned** directly if available or through applications
- **Chat** in real-time with the other party
- **Complete orders** and confirm payments (QR / in-person meeting)
- Everything is **college-isolated** — JNTUA students only interact with JNTUA students

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **UI Components** | shadcn/ui, Radix UI, Framer Motion |
| **Routing** | React Router DOM v6 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Auth** | JWT (JSON Web Tokens) |
| **File Uploads** | Multer (base64 in MongoDB) |
| **Scheduled Jobs** | node-cron (auto-cleanup after 3 days) |

---

## Project Structure

```
campus-connect-hub/
│
├── src/                        # Frontend (React + TypeScript)
│   ├── pages/
│   │   ├── Index.tsx           # Landing page (dynamic, DB-powered)
│   │   ├── Login.tsx           # Login page
│   │   ├── Signup.tsx          # Signup page
│   │   ├── Dashboard.tsx       # Home dashboard after login
│   │   ├── FindWork.tsx        # Browse & apply for jobs
│   │   ├── PostWork.tsx        # Post a new job / edit existing
│   │   ├── Profile.tsx         # View & edit your profile
│   │   ├── Orders.tsx          # View your orders (client & worker)
│   │   ├── OrderDetail.tsx     # Detailed order view with chat
│   │   ├── Settings.tsx        # App settings (theme, college, delete account)
│   │   └── Notifications.tsx   # All notifications
│   │
│   ├── components/
│   │   ├── AppSidebar.tsx      # Side navigation (with logout pinned at bottom)
│   │   ├── Navbar.tsx          # Public landing page navbar
│   │   └── ...                 # Other UI components
│   │
│   ├── layouts/
│   │   └── DashboardLayout.tsx # Dashboard shell (header, sidebar, notification popup)
│   │
│   └── lib/
│       └── api.ts              # apiFetch utility + authHeader helper
│
├── backend/                    # Backend (Node.js + Express)
│   ├── server.js               # Express app entry point
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT protect middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Work.js
│   │   ├── Application.js
│   │   ├── Order.js
│   │   ├── Chat.js
│   │   ├── Message.js
│   │   └── Notification.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── workController.js
│   │   ├── applicationController.js
│   │   ├── orderController.js
│   │   ├── profileController.js
│   │   ├── chatController.js
│   │   └── notificationController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── workRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── chatRoutes.js
│   │   └── notificationRoutes.js
│   └── .env                    # Environment variables (DO NOT commit)
│
├── package.json                # Frontend dependencies
└── README.md                   # This file
```

---

## Prerequisites

Make sure you have these installed:

- **Node.js** v18+ → https://nodejs.org
- **npm** v9+ (comes with Node.js)
- **MongoDB Atlas** account → https://cloud.mongodb.com (or local MongoDB)
- A modern browser (Chrome, Edge, Firefox)

---

## Environment Setup

Create a `.env` file inside the `backend/` folder:

```
backend/.env
```

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/students_connect?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here
```

> ⚠️ Replace `<username>`, `<password>`, and the cluster URL with your actual MongoDB Atlas credentials.

---

## How to Run

You need **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — Start the Backend

```bash
cd campus-connect-hub/backend
npm install
npm start
```

Backend will run at: **http://localhost:5000**

You should see:
```
Server running on port 5000
MongoDB Connected: cluster0.xxxxx.mongodb.net
```

---

### Terminal 2 — Start the Frontend

```bash
cd campus-connect-hub
npm install
npm run dev
```

Frontend will run at: **http://localhost:8080**

Open your browser and go to: **http://localhost:8080**

---

### Quick Start (Both at once on Windows)

Open two PowerShell windows and run:

**Window 1:**
```powershell
cd "y:\LATEST_SS\campus-connect-hub\backend"
npm start
```

**Window 2:**
```powershell
cd "y:\LATEST_SS\campus-connect-hub"
npm run dev
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login & get JWT |
| POST | `/api/auth/change-password` | Private | Change password |
| DELETE | `/api/auth/delete-account` | Private | Permanently delete account |

### Work (Jobs)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/work` | Public* | Get all open jobs (*college-filtered if logged in) |
| POST | `/api/work` | Private | Post a new job |
| PUT | `/api/work/:id` | Private | Edit your job |
| DELETE | `/api/work/:id` | Private | Delete your job |
| GET | `/api/work/my` | Private | Get your posted jobs |

### Applications
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/application` | Private | Apply for a job |
| GET | `/api/application/work/:workId` | Private | Get applicants for a job |
| PATCH | `/api/application/assign/:applicationId` | Private | Assign applicant |
| PATCH | `/api/application/assign-interested/:userId` | Private | Directly assign available user |

### Orders
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/orders/my` | Private | Get your orders |
| GET | `/api/orders/work/:workId` | Private | Get order for a work post |
| PATCH | `/api/orders/:id/status` | Private | Update order status |
| POST | `/api/orders/:id/payment-method` | Private | Set payment method |
| POST | `/api/orders/:id/confirm-payment` | Private | Confirm payment |

### Profile
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/profile/me` | Private | Get my profile |
| PATCH | `/api/profile/me` | Private | Update profile |
| GET | `/api/profile/available` | Private | Get available workers (same college) |
| GET | `/api/profile/:userId` | Public | Get any user's profile |

### Notifications
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/notifications/my` | Private | Get all my notifications |
| GET | `/api/notifications/unread-count` | Private | Get unread count |
| PATCH | `/api/notifications/:id/read` | Private | Mark as read |

### Chat & Messages
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/chat` | Private | Create chat for order |
| GET | `/api/chat/:orderId` | Private | Get chat for order |
| POST | `/api/messages` | Private | Send a message |
| GET | `/api/messages/:chatId` | Private | Get all messages in chat |

### Stats (Landing Page)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/stats` | Public | Get platform stats (users, jobs, orders) |

---

## Features

### For Clients (Job Posters)
- ✅ Post jobs with title, description, category, budget (min ₹39), deadline
- ✅ View applicants and their profiles
- ✅ Assign work to an applicant or directly to an available student
- ✅ Chat with the assigned worker in real-time
- ✅ Mark order as complete
- ✅ Pay via QR code or in-person meeting
- ✅ Cancel order with a reason
- ✅ Reassign if worker cancels or job is reopened

### For Workers (Job Takers)
- ✅ Toggle "Available for Work" to get discovered by clients
- ✅ Browse and apply for open jobs from your college
- ✅ Receive direct work requests from clients
- ✅ Chat with the client
- ✅ Upload completed work
- ✅ Mark task as done and await payment confirmation

### General
- ✅ College-based isolation (only see your college's jobs & students)
- ✅ Real-time notification popups
- ✅ Dark / Light mode toggle
- ✅ Fully responsive for all screen sizes
- ✅ Auto-cleanup: completed + paid orders deleted after 3 days
- ✅ Delete account with full cascade removal of all data

---

## User Flow

```
1. Register → Enter Roll Number + Password
2. Complete Profile → Name, Email, Phone, Branch, Year, College
3. As CLIENT:
   Post Work → View Applicants → Assign Worker → Chat → Confirm Payment
4. As WORKER:
   Toggle "Available for Work" → Browse Jobs → Apply → Get Assigned → Complete → Get Paid
```

---

## College-Based Isolation

- When you **register**, set your college in **Settings → Account → Your College**
- You will **only see jobs** posted by students from the same college
- You will **only see available workers** from the same college
- The landing page shows all colleges for preview (unauthenticated users)

---

## Order Lifecycle

```
open → active → completed → paid
         ↓
      cancelled → open (job reopens for reassignment)
```

| Status | Meaning |
|--------|---------|
| `open` | Job posted, awaiting assignment |
| `active` | Worker assigned, work in progress |
| `completed` | Worker marked task done, awaiting payment |
| `paid` | Payment confirmed by client |
| `cancelled` | Order cancelled, job reopens |

**Payment methods:**
- `qr` — Client scans worker's QR code from their profile
- `meeting` — In-person cash/UPI payment

After **3 days** from payment confirmation, all order data (chat, messages, notifications) is automatically deleted by a background cleanup job.

---

## Database Models

| Model | Key Fields |
|-------|-----------|
| `User` | rollNumber, password, fullName, email, college, branch, year, availableForWork, qrCodeUrl, profilePhotoUrl |
| `Work` | title, description, category, budget, deadline, status, postedBy |
| `Application` | workId, applicantId, status (pending/accepted/rejected) |
| `Order` | workId, clientId, workerId, status, paymentMethod, paymentStatus, paidAt |
| `Chat` | orderId, clientId, workerId |
| `Message` | chatId, senderId, content, timestamp |
| `Notification` | userId, message, type, read |

---

## Common Issues & Troubleshooting

### ❌ Backend not starting
```
Error: Cannot connect to MongoDB
```
**Fix:** Check your `backend/.env` — make sure `MONGO_URI` is correct and your MongoDB Atlas IP whitelist includes `0.0.0.0/0`.

---

### ❌ Frontend "Failed to fetch" errors
**Fix:** Make sure the backend is running on port 5000 before starting the frontend.

---

### ❌ JWT errors / "Not authorized"
**Fix:** Log out and log back in. The token may have expired (30 day expiry).

---

### ❌ Image/QR not showing
**Fix:** QR codes and profile photos are stored as base64 in MongoDB. If the image is too large (>50MB), the backend will reject it. Use smaller images.

---

### ❌ Port already in use
```bash
# Kill the process using port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

---

### ❌ `npm install` errors
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install
```

---

## 📝 Notes

- All passwords are **bcrypt hashed** before storage
- JWT tokens expire after **30 days**
- File uploads are stored as **base64 inside MongoDB** (no external storage needed)
- The cron job runs at **2:00 AM daily** to clean up old paid orders
- The `backend/.env` file should **never be committed** to version control

---

*Built with ❤️ for campus students @JNTUA — StudentsConnect © 2026*
