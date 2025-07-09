// server.js
const express = require('express');
const mongoose = require('mongoose');
const corsMiddleware = require('./middleware/cors');
const paytmRoutes = require('./routes/paytm');
const PaytmConfig = require('./config/paytm');
require('dotenv').config();

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/paytm', paytmRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Paytm Payment Gateway Server is running',
    timestamp: new Date().toISOString(),
    config: {
      MID: PaytmConfig.MID,
      WEBSITE: PaytmConfig.WEBSITE,
      ENVIRONMENT: process.env.NODE_ENV || 'development',
      PAYTM_URL: PaytmConfig.PAYTM_URL
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Paytm Payment Gateway API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      initiate: 'POST /api/paytm/initiate',
      callback: 'POST /api/paytm/callback',
      status: 'GET /api/paytm/status/:orderId',
      payments: 'GET /api/paytm/payments',
      transactionStatus: 'POST /api/paytm/transaction-status'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedPath: req.originalUrl
  });
});

// Database connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log('💳 Paytm Configuration:', {
    MID: PaytmConfig.MID,
    WEBSITE: PaytmConfig.WEBSITE,
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    CALLBACK_URL: PaytmConfig.CALLBACK_URL
  });
});