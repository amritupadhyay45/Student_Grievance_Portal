# Student Grievance Portal

A full-stack web application for managing student complaints, requests, and grievances at a college. Built with **React.js**, **Node.js**, **Express.js**, and **MongoDB Atlas**.

> **Live (Render):** `https://student-grievance-portal-frontend.onrender.com`  
> **Backend:** `http://localhost:5000` | **Frontend:** `http://localhost:3000`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Chart.js, Axios, React Toastify, react-icons |
| Backend | Node.js, Express.js, Mongoose, express-validator |
| Database | MongoDB Atlas |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| AI Assistant | Google Gemini (`@google/generative-ai`) with keyword-based rule fallback |
| File Uploads | Multer (images / PDF / Word, max 5 MB each) |
| Email | Nodemailer (Gmail/SMTP) |
| Dev | Nodemon, dotenv |

---

## Project Structure

```
student-grievance-portal/
├── backend/
│   ├── config/
│   │   └── db.js                     # MongoDB connection (Mongoose)
│   ├── controllers/
│   │   ├── authController.js         # Register, login, profile
│   │   ├── complaintController.js    # CRUD, assign, status, comments, evidence, rating
│   │   ├── requestController.js      # CRUD, assign, status update
│   │   ├── adminController.js        # Stats, user management, staff list
│   │   ├── notificationController.js # Get, mark read, mark all read
│   │   └── aiController.js           # Gemini AI: analyze complaint + chat assistant
│   ├── middleware/
│   │   ├── auth.js                   # JWT protect + RBAC authorize()
│   │   └── upload.js                 # Multer config
│   ├── models/
│   │   ├── User.js                   # 11 roles, hostelBlock, linkedStudent
│   │   ├── Complaint.js              # SLA deadline, isAnonymous, evidence, rating, isOverdue virtual
│   │   ├── Request.js                # Booking details, documentType, location
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── complaints.js
│   │   ├── requests.js
│   │   ├── admin.js
│   │   ├── notifications.js
│   │   └── ai.js                     # POST /analyze  POST /chat
│   ├── utils/
│   │   ├── aiService.js              # Gemini + keyword-based fallback (category, priority, sentiment)
│   │   ├── email.js                  # Nodemailer templates
│   │   ├── generateToken.js          # JWT signing
│   │   ├── seedAdmin.js              # Auto-seeds admin user on server start
│   │   └── sla.js                    # SLA days per category + deadline calculator
│   ├── uploads/                      # Uploaded files (gitignored in production)
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── public/index.html
    └── src/
        ├── assets/
        │   └── agent-bot.svg          # AI assistant avatar
        ├── components/
        │   ├── layout/
        │   │   ├── DashboardLayout.js # Sidebar + Navbar wrapper, mounts ChatBot
        │   │   ├── Sidebar.js         # Role-aware navigation links
        │   │   └── Navbar.js          # Top bar: notifications bell + profile menu
        │   └── shared/
        │       ├── ChatBot.js         # Floating draggable AI chatbot (React Portal)
        │       ├── ProtectedRoute.js  # Auth + role guard
        │       ├── StatCard.js        # Dashboard stat tile
        │       └── StatusBadge.js     # Colored pill for status values
        ├── context/
        │   └── AuthContext.js         # Auth state, login/logout, token persistence
        ├── pages/
        │   ├── auth/
        │   │   ├── Login.js
        │   │   └── Register.js
        │   ├── dashboard/
        │   │   ├── Dashboard.js           # Role-router -> correct dashboard
        │   │   ├── StudentDashboard.js
        │   │   ├── AdminDashboard.js
        │   │   ├── StaffDashboard.js
        │   │   └── ParentDashboard.js
        │   ├── complaints/
        │   │   ├── ComplaintsList.js      # Paginated, filtered, searchable
        │   │   ├── SubmitComplaint.js     # AI auto-suggest + anonymous toggle
        │   │   └── ComplaintDetail.js     # Comments, evidence, rating, SLA badge
        │   ├── requests/
        │   │   ├── RequestsList.js
        │   │   ├── SubmitRequest.js
        │   │   └── RequestDetail.js
        │   ├── admin/
        │   │   ├── UsersManagement.js     # Create/toggle users, filter by role
        │   │   └── Analytics.js           # Chart.js: status, category, monthly
        │   └── Profile.js
        ├── services/
        │   ├── api.js                     # Axios instance + JWT interceptor
        │   └── endpoints.js              # Typed API call functions
        ├── utils/
        │   └── sla.js                    # SLA time-remaining / overdue display
        ├── App.js
        ├── index.js
        └── styles.css
```

---

## Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas (or local MongoDB)
- npm

### 1. Backend

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>

JWT_SECRET=your_super_secret_min_32_chars
JWT_EXPIRE=7d

# Admin auto-seeded on first start
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@grievanceportal.com
ADMIN_PASSWORD=admin123

# Email (optional — leave blank to disable)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=Grievance Portal <your@gmail.com>

CLIENT_URL=http://localhost:3000

# Optional — AI uses rule-based fallback if absent
GEMINI_API_KEY=your_gemini_api_key
```

```bash
npm run dev   # development (nodemon)
npm start     # production
```

The admin account is **created automatically on first start** — no manual seed script needed.

### 2. Frontend

```bash
cd frontend
npm install
npm start     # http://localhost:3000
```

### 3. Default Login

| Role | Email | Password |
|---|---|---|
| Admin | admin@grievanceportal.com | admin123 |

Create other users from **Admin → Users Management** or the Register page.

---

## Features

### Complaint Management
- Submit with **category**, **priority**, **subject**, **description**, and optional file attachments
- **Anonymous submission** — hides student identity from staff
- **AI auto-suggest**: Gemini (or keyword engine) recommends category + priority while typing
- **SLA deadlines** auto-assigned at creation:

| Category | SLA |
|---|---|
| Mess, Medical Aid Centre, Security | 1 day |
| Classroom, Campus, Department | 2 days |
| Hostel, Ground, Others | 3 days |

- **Overdue badge** shown when SLA deadline passes
- **Evidence upload** — staff can attach photos/documents when resolving
- **Student rating** — 1–5 stars + feedback after resolution
- **Comments** — threaded back-and-forth between all parties

### Request Management
- Types: General Feedback, Document Request, Guest House Booking, Maintenance Request
- Guest house bookings: guest name, check-in/out dates, purpose
- Document requests: document type field

### AI Chatbot
- **Floating + draggable** widget rendered via React Portal (unaffected by layout clipping)
- **Agent bot avatar** (SVG) on FAB button and every bot message
- Powered by **Google Gemini** with rule-based fallback when no API key is configured
- **Role-aware** welcome message and quick-prompt suggestions per role
- **Typewriter animation** on bot replies with contextual follow-up suggestion chips
- Handles greetings/thanks client-side (no API round-trip)
- Drag by the header; stays within viewport bounds; touch-friendly

### Dashboards
- **Student**: Recent complaints, SLA timers, request summary
- **Admin**: Portal-wide stats, pending queue, quick-assign actions
- **Staff**: Assigned complaint workload
- **Parent**: Linked student's complaint overview

### Analytics (Admin only)
- Complaint status distribution — pie chart
- Category breakdown — bar chart
- Monthly submission trend — line chart
- Summary counters: total, resolved, in-progress, overdue

### User Management (Admin only)
- Create users of any role; set hostel block for wardens/caretakers; link parents to students
- Toggle active/inactive
- Search and filter by role

### Notifications
- In-app bell with unread count badge
- Triggered on complaint assignment, status change, and new comments
- Optional email notifications via Nodemailer

---

## API Reference

**Base URL:** `http://localhost:5000/api`  
**Auth header:** `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register |
| POST | `/auth/login` | Public | Login → JWT |
| GET | `/auth/me` | Required | Own profile |
| PUT | `/auth/profile` | Required | Update profile |

### Complaints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/complaints` | Required | List (page, limit, status, category, search) |
| POST | `/complaints` | Student | Create — multipart/form-data |
| GET | `/complaints/:id` | Required | Detail |
| PUT | `/complaints/:id/status` | Admin/Staff | Update status + note |
| PUT | `/complaints/:id/assign` | Admin | Assign to staff |
| POST | `/complaints/:id/comments` | Required | Add comment |
| POST | `/complaints/:id/evidence` | Staff | Upload evidence file |
| POST | `/complaints/:id/rating` | Student | Rate (1–5) resolved complaint |
| GET | `/complaints/analytics` | Admin | Chart data |

### Requests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/requests` | Required | List |
| POST | `/requests` | Student | Create — multipart/form-data |
| GET | `/requests/:id` | Required | Detail |
| PUT | `/requests/:id/status` | Admin/Staff | Update status |
| PUT | `/requests/:id/assign` | Admin | Assign |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin | Portal-wide counts |
| GET | `/admin/users` | Admin | List users |
| POST | `/admin/users` | Admin | Create user |
| PUT | `/admin/users/:id/toggle` | Admin | Enable / disable |
| GET | `/admin/staff` | Admin | Assignable staff list |

### Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | Required | Get all |
| PUT | `/notifications/:id/read` | Required | Mark one read |
| PUT | `/notifications/read-all` | Required | Mark all read |

### AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/ai/analyze` | Required | Suggest category, priority, sentiment |
| POST | `/ai/chat` | Required | Conversational assistant |

**`POST /ai/analyze`** body:
```json
{ "text": "The lights in my hostel room have been broken for 3 days." }
```
Response: `{ category, priority, sentiment, confidence }`

**`POST /ai/chat`** body:
```json
{ "message": "How do I submit anonymously?", "history": [] }
```

---

## Database Schemas

### User
```js
{
  name, email, password (bcrypt),
  role: 'student'|'admin'|'staff'|'parent'|'warden'|'caretaker'|'hod'|'bsa'|'bca'|'security'|'others',
  phone, department, rollNumber,
  linkedStudent: ObjectId,   // parent -> student
  hostelBlock: String,       // warden / caretaker
  isActive: Boolean
}
```

### Complaint
```js
{
  student: ObjectId,
  category: 'department'|'mess'|'classroom'|'hostel'|'campus'|'ground'|'medical_aid_centre'|'others',
  subject, description,
  status: 'pending'|'in_progress'|'resolved'|'rejected',
  priority: 'low'|'medium'|'high'|'urgent',
  isAnonymous: Boolean,
  assignedTo: ObjectId,
  slaDeadline: Date,
  // virtual -> isOverdue: Boolean
  attachments: [{ filename, path, uploadedAt }],
  evidence:    { filename, path, text, uploadedAt, uploadedBy },
  resolution:  { note, resolvedAt, resolvedBy },
  rating:      { score (1-5), feedback, ratedAt },
  comments:    [{ user, text, createdAt }]
}
```

### Request
```js
{
  student: ObjectId,
  type: 'general_feedback'|'document_request'|'guest_house_booking'|'maintenance_request',
  subject, description, documentType, location,
  bookingDetails: { guestName, checkIn, checkOut, purpose },
  status: 'pending'|'in_progress'|'resolved'|'rejected',
  assignedTo: ObjectId,
  attachments: [{ filename, path }],
  response: { note, respondedAt, respondedBy }
}
```

### Notification
```js
{
  user: ObjectId,
  title, message,
  type: 'complaint'|'request'|'system'|'assignment',
  relatedId: ObjectId,
  isRead: Boolean
}
```

---

## Role Access Matrix

| Feature | Student | Admin | Staff | Warden | Caretaker | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Submit complaint | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Submit request | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Anonymous complaint | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View complaints | own | all | assigned | assigned | assigned | child's |
| Assign complaint | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update status | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Upload evidence | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Rate resolution | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Add comments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage users | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Analytics | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| AI chatbot | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Production Deployment

1. Set `NODE_ENV=production` and a strong `JWT_SECRET` (32+ chars)
2. Point `MONGO_URI` to MongoDB Atlas
3. Configure SMTP credentials for email notifications
4. Add `GEMINI_API_KEY` for live AI features
5. Build frontend: `cd frontend && npm run build`
6. Serve `frontend/build/` via nginx or a static CDN
7. Run backend with pm2: `pm2 start server.js --name grievance-backend`
8. Set `CLIENT_URL` to your production frontend domain
