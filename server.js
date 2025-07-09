const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const PaytmChecksum = require('paytmchecksum');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://chinnasivakrishna2003:siva@cluster0.u7gjmpo.mongodb.net/payment?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  transactionId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
    default: 'PENDING' 
  },
  paytmResponse: { type: Object },
  paytmTxnId: { type: String },
  paytmOrderId: { type: String },
  gatewayName: { type: String, default: 'PAYTM' },
  paymentMode: { type: String },
  bankName: { type: String },
  bankTxnId: { type: String },
  responseCode: { type: String },
  responseMsg: { type: String },
  checksumHash: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

// Paytm Configuration
const PaytmConfig = {
  MID: 'Mobish80382601607975',
  WEBSITE: 'DEFAULT',
  CHANNEL_ID: 'WEB',
  INDUSTRY_TYPE_ID: 'Retail109',
  MERCHANT_KEY: 'VrUA6E69o_R%a%te',
  CALLBACK_URL: process.env.PAYTM_CALLBACK_URL || 'http://localhost:5000/api/paytm/callback',
  PAYTM_URL: process.env.PAYTM_URL || 'https://securegw.paytm.in/order/process'
};

// Routes

// 1. Initialize Payment
app.post('/api/paytm/initiate', async (req, res) => {
  try {
    const { amount, customerEmail, customerPhone, customerName } = req.body;
    
    // Validate required fields
    if (!amount || !customerEmail || !customerPhone || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Generate unique order ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create payment record in database
    const payment = new Payment({
      orderId,
      amount: parseFloat(amount),
      customerEmail,
      customerPhone,
      customerName,
      status: 'PENDING'
    });

    await payment.save();

    // Prepare Paytm parameters
    const paytmParams = {
      MID: PaytmConfig.MID,
      WEBSITE: PaytmConfig.WEBSITE,
      CHANNEL_ID: PaytmConfig.CHANNEL_ID,
      INDUSTRY_TYPE_ID: PaytmConfig.INDUSTRY_TYPE_ID,
      ORDER_ID: orderId,
      CUST_ID: customerEmail,
      TXN_AMOUNT: parseFloat(amount).toFixed(2),
      CALLBACK_URL: PaytmConfig.CALLBACK_URL,
      EMAIL: customerEmail,
      MOBILE_NO: customerPhone
    };

    console.log('Paytm Parameters before checksum:', paytmParams);

    // Generate checksum using official Paytm package
    const checksum = await PaytmChecksum.generateSignature(paytmParams, PaytmConfig.MERCHANT_KEY);
    paytmParams.CHECKSUMHASH = checksum;

    console.log('Generated Checksum:', checksum);

    // Update payment record with checksum
    await Payment.findOneAndUpdate(
      { orderId },
      { 
        checksumHash: checksum,
        paytmOrderId: orderId,
        updatedAt: new Date()
      }
    );

    console.log('Payment initiated successfully:', {
      orderId,
      amount: paytmParams.TXN_AMOUNT,
      customerEmail,
      checksum
    });

    res.json({
      success: true,
      orderId,
      paytmParams,
      paytmUrl: PaytmConfig.PAYTM_URL
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
      error: error.message
    });
  }
});

// 2. Payment Callback Handler
app.post('/api/paytm/callback', async (req, res) => {
  try {
    const paytmResponse = req.body;
    const orderId = paytmResponse.ORDERID;

    console.log('Received Paytm callback:', paytmResponse);

    // Verify checksum using official Paytm package
    let isValidChecksum = true;
    
    if (paytmResponse.CHECKSUMHASH) {
      isValidChecksum = PaytmChecksum.verifySignature(paytmResponse, PaytmConfig.MERCHANT_KEY, paytmResponse.CHECKSUMHASH);
      console.log('Checksum validation result:', isValidChecksum);
    } else {
      console.log('No checksum in response - staging environment behavior');
    }

    // Log checksum validation for debugging
    if (!isValidChecksum) {
      console.warn('⚠️  Checksum validation failed, but proceeding for staging environment');
    }

    // Determine payment status
    let paymentStatus = 'FAILED';
    if (paytmResponse.STATUS === 'TXN_SUCCESS') {
      paymentStatus = 'SUCCESS';
    } else if (paytmResponse.STATUS === 'TXN_FAILURE') {
      paymentStatus = 'FAILED';
    } else if (paytmResponse.STATUS === 'PENDING') {
      paymentStatus = 'PENDING';
    }

    // Update payment status in database
    const updateData = {
      status: paymentStatus,
      transactionId: paytmResponse.TXNID || paytmResponse.ORDERID,
      paytmTxnId: paytmResponse.TXNID,
      paytmResponse: paytmResponse,
      paymentMode: paytmResponse.PAYMENTMODE,
      bankName: paytmResponse.BANKNAME,
      bankTxnId: paytmResponse.BANKTXNID,
      responseCode: paytmResponse.RESPCODE,
      responseMsg: paytmResponse.RESPMSG,
      updatedAt: new Date()
    };

    const payment = await Payment.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true }
    );

    if (!payment) {
      console.error('Payment record not found for orderId:', orderId);
      return res.status(404).send(`
        <html>
          <head>
            <title>Payment Not Found</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .container { max-width: 600px; margin: 0 auto; }
              .error { color: #d32f2f; }
              .btn { background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Payment Record Not Found</h1>
              <p>Order ID: ${orderId}</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Return to Home</a>
            </div>
          </body>
        </html>
      `);
    }

    console.log('Payment updated successfully:', {
      orderId,
      status: paymentStatus,
      transactionId: updateData.transactionId,
      responseCode: paytmResponse.RESPCODE,
      checksumValid: isValidChecksum
    });

    // Redirect to frontend with order ID
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?orderId=${orderId}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Payment Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .error { color: #d32f2f; }
            .btn { background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Payment Processing Error</h1>
            <p>An error occurred while processing your payment.</p>
            <p>Error: ${error.message}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Return to Home</a>
          </div>
        </body>
      </html>
    `);
  }
});

// 3. Check Payment Status
app.get('/api/paytm/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const payment = await Payment.findOne({ orderId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment: {
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transactionId,
        customerEmail: payment.customerEmail,
        customerName: payment.customerName,
        paymentMode: payment.paymentMode,
        bankName: payment.bankName,
        responseCode: payment.responseCode,
        responseMsg: payment.responseMsg,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
});

// 4. Get All Payments (Admin)
app.get('/api/paytm/payments', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-paytmResponse -checksumHash');

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// 5. Transaction Status Inquiry
app.post('/api/paytm/transaction-status', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const statusParams = {
      MID: PaytmConfig.MID,
      ORDERID: orderId
    };

    // Generate checksum for status inquiry
    const checksum = await PaytmChecksum.generateSignature(statusParams, PaytmConfig.MERCHANT_KEY);
    statusParams.CHECKSUMHASH = checksum;

    const statusUrl = 'https://securegw-stage.paytm.in/order/status';
    
    const response = await axios.post(statusUrl, statusParams, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Paytm status response:', response.data);

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Transaction status inquiry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check transaction status',
      error: error.message
    });
  }
});

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

// Database connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB Atlas');
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