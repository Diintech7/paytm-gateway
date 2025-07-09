const mongoose = require('mongoose');

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

module.exports = mongoose.model('Payment', paymentSchema);