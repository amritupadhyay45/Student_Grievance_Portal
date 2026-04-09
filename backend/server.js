const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');

// Connect to MongoDB, then seed admin if needed
(async () => {
  await connectDB();
  await seedAdmin();
})();

const app = express();

// Middleware
<<<<<<< HEAD
app.use(cors({ origin: process.env.CLIENT_URL || 'https://student-grievance-portal-frontend.onrender.com', credentials: true }));
=======
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
>>>>>>> 391f2f4 (added AI features, updated backend & frontend)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);

  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }

  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
