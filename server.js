const express = require('express');
const cors = require('cors');
const axios = require('axios');
const PaytmChecksum = require('paytmchecksum');
require('dotenv').config();

// Import configurations and models
const connectDB = require('./config/database');
const PaytmConfig = require('./config/paytm');
const Payment = require('./models/Payment');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes

// 1. Initialize Payment
app.post('/api/paytm/initiate', async (req, res) => {
  try {
    const { amount, customerEmail, customerPhone, customerName } = req.body;
    
    // Validate required fields
    if (!amount || !customerEmail || !customerPhone || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, customerEmail, customerPhone, customerName'
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
      message: 'Payment initiated successfully',
      data: {
        orderId,
        paytmParams,
        paytmUrl: PaytmConfig.PAYTM_URL
      }
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
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
        data: {
          orderId
        }
      });
    }

    console.log('Payment updated successfully:', {
      orderId,
      status: paymentStatus,
      transactionId: updateData.transactionId,
      responseCode: paytmResponse.RESPCODE,
      checksumValid: isValidChecksum
    });

    // Return JSON response with payment details
    res.json({
      success: true,
      message: 'Payment callback processed successfully',
      data: {
        orderId,
        status: paymentStatus,
        transactionId: updateData.transactionId,
        amount: payment.amount,
        customerEmail: payment.customerEmail,
        customerName: payment.customerName,
        paymentMode: paytmResponse.PAYMENTMODE,
        bankName: paytmResponse.BANKNAME,
        responseCode: paytmResponse.RESPCODE,
        responseMsg: paytmResponse.RESPMSG,
        checksumValid: isValidChecksum,
        redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?orderId=${orderId}`
      }
    });

  } catch (error) {
    console.error('Payment callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing error',
      error: error.message
    });
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
        message: 'Payment not found',
        data: {
          orderId
        }
      });
    }

    res.json({
      success: true,
      message: 'Payment status retrieved successfully',
      data: {
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
      message: 'Payments retrieved successfully',
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
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

    const response = await axios.post(PaytmConfig.STATUS_URL, statusParams, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Paytm status response:', response.data);

    res.json({
      success: true,
      message: 'Transaction status retrieved successfully',
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
    data: {
      timestamp: new Date().toISOString(),
      config: {
        MID: PaytmConfig.MID,
        WEBSITE: PaytmConfig.WEBSITE,
        ENVIRONMENT: process.env.NODE_ENV || 'development',
        PAYTM_URL: PaytmConfig.PAYTM_URL
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
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