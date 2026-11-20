/* =========================================================
   MESSHUNT - BACKEND SERVER
   Express + MongoDB (Mongoose) API
   Reuses existing MONGO_URI/PORT from backend/.env
   ========================================================= */

const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messRoutes = require('./routes/messRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const favouriteRoutes = require('./routes/favouriteRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const ownerRoutes = require('./routes/ownerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Connect DB (existing configuration)
connectDB();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'Server is running', service: 'MessHunt API' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messes', messRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Serve frontend static files (project root) for convenience
app.use(express.static(path.join(__dirname, '..')));

// 404 and error handlers for API
app.use('/api', notFound);
app.use(errorHandler);

// Fallback for non-API routes (serve frontend files / index)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`MessHunt server running on http://localhost:${PORT}`);
});
