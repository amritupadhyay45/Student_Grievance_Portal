/*Demo Credentials

Admin: admin@grievanceportal.com / admin123
Staff: staff@grievanceportal.com / staff123
Student: student@grievanceportal.com / student123*/

user=student_portal


# Student Grievance Portal

A full-stack web application for managing student complaints, requests, and grievances. Built with React.js, Node.js, Express.js, and MongoDB.

---

## Project Structure

```
student-grievance-portal/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Login, register, profile
│   │   ├── complaintController.js # CRUD + assign + analytics
│   │   ├── requestController.js   # CRUD + assign
│   │   ├── adminController.js     # Users + stats
│   │   └── notificationController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + RBAC
│   │   └── upload.js              # Multer config
│   ├── models/
│   │   ├── User.js
│   │   ├── Complaint.js
│   │   ├── Request.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── complaints.js
│   │   ├── requests.js
│   │   ├── admin.js
│   │   └── notifications.js
│   ├── utils/
│   │   ├── email.js               # Nodemailer + templates
│   │   └── generateToken.js
│   ├── uploads/                   # Uploaded files
│   ├── seed.js                    # Create default users
│   ├── server.js                  # Express app entry
│   ├── .env                       # Environment variables
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── DashboardLayout.js
    │   │   │   ├── Sidebar.js
    │   │   │   └── Navbar.js
    │   │   └── shared/
    │   │       ├── ProtectedRoute.js
    │   │       ├── StatusBadge.js
    │   │       └── StatCard.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── Login.js
    │   │   │   └── Register.js
    │   │   ├── dashboard/
    │   │   │   ├── Dashboard.js         # Role router
    │   │   │   ├── StudentDashboard.js
    │   │   │   ├── AdminDashboard.js
    │   │   │   ├── StaffDashboard.js
    │   │   │   └── ParentDashboard.js
    │   │   ├── complaints/
    │   │   │   ├── ComplaintsList.js
    │   │   │   ├── SubmitComplaint.js
    │   │   │   └── ComplaintDetail.js
    │   │   ├── requests/
    │   │   │   ├── RequestsList.js
    │   │   │   ├── SubmitRequest.js
    │   │   │   └── RequestDetail.js
    │   │   ├── admin/
    │   │   │   ├── UsersManagement.js
    │   │   │   └── Analytics.js
    │   │   └── Profile.js
    │   ├── services/
    │   │   ├── api.js              # Axios instance + interceptors
    │   │   └── endpoints.js        # All API calls
    │   ├── App.js
    │   ├── index.js
    │   ├── styles.css
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone / Open the project

```bash
cd /path/to/student-grievance-portal
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Copy and configure environment variables:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/grievance_portal
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Optional: Email (leave blank to skip)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=Grievance Portal <your@gmail.com>

CLIENT_URL=http://localhost:3000
```

Seed the database with default users:
```bash
node seed.js
```

Start the backend:
```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Backend runs at: `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

### 4. Default Login Credentials (after seeding)

| Role    | Email                            | Password   |
|---------|----------------------------------|------------|
| Admin   | admin@grievanceportal.com        | admin123   |
| Staff   | staff@grievanceportal.com        | staff123   |
| Student | student@grievanceportal.com      | student123 |

---

## User Roles & Access

| Feature                    | Student | Admin | Staff | Parent |
|----------------------------|---------|-------|-------|--------|
| Submit Complaint            | ✅      | ❌    | ❌    | ❌     |
| Submit Request              | ✅      | ❌    | ❌    | ❌     |
| View Own Complaints         | ✅      | ✅    | ✅*   | ✅**  |
| Assign Complaint to Staff   | ❌      | ✅    | ❌    | ❌     |
| Update Complaint Status     | ❌      | ✅    | ✅    | ❌     |
| Manage Users                | ❌      | ✅    | ❌    | ❌     |
| View Analytics              | ❌      | ✅    | ❌    | ❌     |
| Add Comments                | ✅      | ✅    | ✅    | ✅     |

*Staff see only assigned complaints  
**Parent sees linked student's complaints

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

All protected routes require: `Authorization: Bearer <token>`

---

### Authentication

#### Register
```
POST /auth/register
Body: { name, email, password, role?, phone?, department?, rollNumber?, linkedStudentEmail? }
```

#### Login
```
POST /auth/login
Body: { email, password }
Response: { success, data: { _id, name, email, role, token } }
```

#### Get Profile
```
GET /auth/me          [Protected]
```

#### Update Profile
```
PUT /auth/profile     [Protected]
Body: { name?, phone?, department? }
```

---

### Complaints

#### Get All
```
GET /complaints       [Protected]
Query: page, limit, status, category, search
```

#### Create
```
POST /complaints      [Student only, multipart/form-data]
Body: category, subject, description, priority?, attachments[]
```

#### Get One
```
GET /complaints/:id   [Protected]
```

#### Update Status
```
PUT /complaints/:id/status  [Admin, Staff]
Body: { status, note? }
```

#### Assign to Staff
```
PUT /complaints/:id/assign  [Admin only]
Body: { staffId }
```

#### Add Comment
```
POST /complaints/:id/comments  [Protected]
Body: { text }
```

#### Analytics
```
GET /complaints/analytics  [Admin only]
Response: statusStats, categoryStats, monthlyStats, totalComplaints
```

---

### Requests

#### Get All
```
GET /requests         [Protected]
Query: page, limit, status, type, search
```

#### Create
```
POST /requests        [Student only, multipart/form-data]
Body: type, subject, description, documentType?, location?, bookingDetails?, attachments[]
```

#### Get One
```
GET /requests/:id     [Protected]
```

#### Update Status
```
PUT /requests/:id/status  [Admin, Staff]
Body: { status, note? }
```

#### Assign
```
PUT /requests/:id/assign  [Admin only]
Body: { staffId }
```

---

### Admin

#### Dashboard Stats
```
GET /admin/stats      [Admin only]
```

#### Get Users
```
GET /admin/users      [Admin only]
Query: role, search, page, limit
```

#### Create User
```
POST /admin/users     [Admin only]
Body: { name, email, password, role, department? }
```

#### Toggle User Status
```
PUT /admin/users/:id/toggle  [Admin only]
```

#### Get Staff List
```
GET /admin/staff      [Admin only]
```

---

### Notifications

#### Get All
```
GET /notifications    [Protected]
```

#### Mark as Read
```
PUT /notifications/:id/read  [Protected]
```

#### Mark All Read
```
PUT /notifications/read-all  [Protected]
```

---

## Database Schema

### User
```js
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'student' | 'admin' | 'staff' | 'parent',
  phone: String,
  department: String,
  rollNumber: String,
  linkedStudent: ObjectId (ref: User),
  isActive: Boolean,
  timestamps: true
}
```

### Complaint
```js
{
  student: ObjectId (ref: User),
  category: 'mess' | 'classroom' | 'hostel' | 'campus' | 'ground' | 'medical_aid_centre',
  subject: String,
  description: String,
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  assignedTo: ObjectId (ref: User),
  attachments: [{ filename, path }],
  resolution: { note, resolvedAt, resolvedBy },
  comments: [{ user, text, createdAt }],
  timestamps: true
}
```

### Request
```js
{
  student: ObjectId (ref: User),
  type: 'general_feedback' | 'document_request' | 'guest_house_booking' | 'maintenance_request',
  subject: String,
  description: String,
  documentType: String,
  bookingDetails: { guestName, checkIn, checkOut, purpose },
  location: String,
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected',
  assignedTo: ObjectId (ref: User),
  attachments: [{ filename, path }],
  response: { note, respondedAt, respondedBy, document },
  timestamps: true
}
```

### Notification
```js
{
  user: ObjectId (ref: User),
  title: String,
  message: String,
  type: 'complaint' | 'request' | 'system' | 'assignment',
  relatedId: ObjectId,
  isRead: Boolean,
  timestamps: true
}
```

---

## Features Summary

- **JWT Authentication** with role-based access control (RBAC)
- **4 User Roles**: Student, Admin, Staff, Parent
- **Complaint Management** with 6 categories: Mess, Classroom, Hostel, Campus, Ground, Medical Aid Centre
- **Request Management**: Feedback, Document Requests, Guest House Bookings, Maintenance
- **File Uploads** via Multer (images, PDFs, Word docs, max 5MB each)
- **Email Notifications** via Nodemailer (status updates, submission confirmations)
- **In-app Notifications** with unread badge
- **Analytics Dashboard** with Pie and Bar charts (Chart.js)
- **Search & Filter** on all lists
- **Pagination** on all list pages
- **Comments** on complaints for back-and-forth communication
- **Responsive UI** with mobile sidebar
- **Status Tracking**: Pending → In Progress → Resolved / Rejected

---

## Production Deployment Notes

1. Set `NODE_ENV=production` in `.env`
2. Use a strong, random `JWT_SECRET` (min 32 chars)
3. Use MongoDB Atlas for the database
4. Configure a real email provider (Gmail App Password or SendGrid)
5. Run `npm run build` in the frontend and serve via nginx or a CDN
6. Use `pm2` to manage the backend process
