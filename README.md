# Paytm Payment Gateway API

A robust Node.js backend service for integrating Paytm payment gateway with any frontend application.

## 🚀 Live API Base URL
```
https://airuter-backend.onrender.com
```

## 📋 API Endpoints

### 1. Health Check
**GET** `/api/health`

Check if the server is running.

**Response:**
```json
{
  "success": true,
  "message": "Paytm Payment Gateway Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "config": {
    "MID": "Mobish80382601607975",
    "WEBSITE": "DEFAULT",
    "ENVIRONMENT": "production",
    "PAYTM_URL": "https://securegw-stage.paytm.in/theia/processTransaction"
  }
}
```

### 2. Initiate Payment
**POST** `/api/paytm/initiate`

Initialize a payment transaction.

**Request Body:**
```json
{
  "amount": 100.00,
  "customerEmail": "customer@example.com",
  "customerPhone": "9876543210",
  "customerName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initiated successfully",
  "data": {
    "orderId": "ORDER_1642234567890_abc123def",
    "paytmParams": {
      "MID": "Mobish80382601607975",
      "WEBSITE": "DEFAULT",
      "CHANNEL_ID": "WEB",
      "INDUSTRY_TYPE_ID": "Retail109",
      "ORDER_ID": "ORDER_1642234567890_abc123def",
      "CUST_ID": "customer@example.com",
      "TXN_AMOUNT": "100.00",
      "CALLBACK_URL": "https://airuter-backend.onrender.com/api/paytm/callback",
      "EMAIL": "customer@example.com",
      "MOBILE_NO": "9876543210",
      "CHECKSUMHASH": "generated_checksum_hash"
    },
    "paytmUrl": "https://securegw-stage.paytm.in/theia/processTransaction"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Check Payment Status
**GET** `/api/paytm/status/:orderId`

Check the status of a payment transaction.

**Response:**
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "orderId": "ORDER_1642234567890_abc123def",
    "amount": 100,
    "status": "SUCCESS",
    "transactionId": "TXN123456789",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "paymentMode": "CARD",
    "bankName": "HDFC Bank",
    "responseCode": "01",
    "responseMsg": "Txn Success",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  },
  "timestamp": "2024-01-15T10:36:00.000Z"
}
```

### 4. Get All Payments (Admin)
**GET** `/api/paytm/payments`

Get paginated list of all payments.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)
- `status` (optional): Filter by status (PENDING, SUCCESS, FAILED, CANCELLED)

**Response:**
```json
{
  "success": true,
  "message": "Payments retrieved successfully",
  "data": {
    "payments": [
      {
        "orderId": "ORDER_1642234567890_abc123def",
        "amount": 100,
        "status": "SUCCESS",
        "customerEmail": "customer@example.com",
        "customerName": "John Doe",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 50,
      "limit": 10
    }
  },
  "timestamp": "2024-01-15T10:36:00.000Z"
}
```

### 5. Transaction Status Inquiry
**POST** `/api/paytm/transaction-status`

Query Paytm directly for transaction status.

**Request Body:**
```json
{
  "orderId": "ORDER_1642234567890_abc123def"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction status retrieved successfully",
  "data": {
    "STATUS": "TXN_SUCCESS",
    "ORDERID": "ORDER_1642234567890_abc123def",
    "TXNID": "TXN123456789",
    "TXNAMOUNT": "100.00",
    "CURRENCY": "INR",
    "RESPCODE": "01",
    "RESPMSG": "Txn Success"
  },
  "timestamp": "2024-01-15T10:36:00.000Z"
}
```

## 🔧 Frontend Integration Examples

### JavaScript/React Example

```javascript
// Initialize Payment
const initiatePayment = async (paymentData) => {
  try {
    const response = await fetch('https://airuter-backend.onrender.com/api/paytm/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Create form and redirect to Paytm
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = result.data.paytmUrl;
      
      // Add all paytm parameters as hidden inputs
      Object.keys(result.data.paytmParams).forEach(key => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = result.data.paytmParams[key];
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
    }
  } catch (error) {
    console.error('Payment initiation failed:', error);
  }
};

// Check Payment Status
const checkPaymentStatus = async (orderId) => {
  try {
    const response = await fetch(`https://airuter-backend.onrender.com/api/paytm/status/${orderId}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('Payment Status:', result.data.status);
      return result.data;
    }
  } catch (error) {
    console.error('Status check failed:', error);
  }
};

// Usage
const paymentData = {
  amount: 100.00,
  customerEmail: 'customer@example.com',
  customerPhone: '9876543210',
  customerName: 'John Doe'
};

initiatePayment(paymentData);
```

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const initiatePayment = async (paymentData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://airuter-backend.onrender.com/api/paytm/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to Paytm
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.data.paytmUrl;
        
        Object.keys(result.data.paytmParams).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = result.data.paytmParams[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (orderId) => {
    try {
      const response = await fetch(`https://airuter-backend.onrender.com/api/paytm/status/${orderId}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Status check failed:', err);
      return null;
    }
  };

  return { initiatePayment, checkStatus, loading, error };
};

export default usePayment;
```

### Vue.js Example

```javascript
// In your Vue component
export default {
  data() {
    return {
      loading: false,
      error: null
    }
  },
  methods: {
    async initiatePayment(paymentData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetch('https://airuter-backend.onrender.com/api/paytm/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Create form and redirect
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = result.data.paytmUrl;
          
          Object.keys(result.data.paytmParams).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = result.data.paytmParams[key];
            form.appendChild(input);
          });
          
          document.body.appendChild(form);
          form.submit();
        } else {
          this.error = result.message;
        }
      } catch (err) {
        this.error = 'Payment initiation failed';
      } finally {
        this.loading = false;
      }
    },
    
    async checkPaymentStatus(orderId) {
      try {
        const response = await fetch(`https://airuter-backend.onrender.com/api/paytm/status/${orderId}`);
        const result = await response.json();
        return result.success ? result.data : null;
      } catch (err) {
        console.error('Status check failed:', err);
        return null;
      }
    }
  }
}
```

## 🎯 Payment Flow

1. **Initialize Payment**: Call `/api/paytm/initiate` with customer details
2. **Redirect to Paytm**: Use returned `paytmParams` and `paytmUrl` to redirect user
3. **Payment Processing**: User completes payment on Paytm
4. **Callback Handling**: Paytm redirects back to the callback URL (handled by backend)
5. **Status Check**: Use `/api/paytm/status/:orderId` to check payment status
6. **Transaction Inquiry**: Use `/api/paytm/transaction-status` for direct Paytm inquiry

## 📝 Important Notes

### Payment Status Values
- `PENDING`: Payment initiated but not completed
- `SUCCESS`: Payment completed successfully
- `FAILED`: Payment failed
- `CANCELLED`: Payment cancelled by user

### Error Handling
All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### CORS Configuration
The API is configured to accept requests from any origin, making it suitable for multiple frontend applications.

## 🔐 Security Considerations

1. **Checksum Validation**: All transactions are validated using Paytm's checksum mechanism
2. **Database Storage**: All payment records are stored securely in MongoDB
3. **Environment Variables**: Sensitive configuration is handled via environment variables
4. **Input Validation**: All API endpoints validate required fields

## 🛠️ Testing

### Test Payment Data
For testing in staging environment, you can use:
- **Amount**: Any amount (e.g., 1.00, 100.00)
- **Email**: Any valid email format
- **Phone**: Any 10-digit number
- **Name**: Any name

### Test Flow
1. Call the initiate endpoint with test data
2. You'll be redirected to Paytm's staging environment
3. Use Paytm's test credentials to complete payment
4. Check the payment status using the status endpoint

## 📱 Mobile App Integration

### React Native Example
```javascript
import { Linking } from 'react-native';

const initiatePayment = async (paymentData) => {
  try {
    const response = await fetch('https://airuter-backend.onrender.com/api/paytm/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Create form data for POST request
      const formData = new FormData();
      Object.keys(result.data.paytmParams).forEach(key => {
        formData.append(key, result.data.paytmParams[key]);
      });
      
      // For React Native, you might need to use WebView or deep linking
      const paymentUrl = `${result.data.paytmUrl}?${new URLSearchParams(result.data.paytmParams).toString()}`;
      
      // Open in WebView or external browser
      Linking.openURL(paymentUrl);
    }
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

### Flutter Example
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> initiatePayment(Map<String, dynamic> paymentData) async {
  try {
    final response = await http.post(
      Uri.parse('https://airuter-backend.onrender.com/api/paytm/initiate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(paymentData),
    );
    
    if (response.statusCode == 200) {
      final result = jsonDecode(response.body);
      if (result['success']) {
        // Handle Paytm redirection
        final paytmUrl = result['data']['paytmUrl'];
        final paytmParams = result['data']['paytmParams'];
        
        // Use webview_flutter or url_launcher to handle payment
      }
    }
  } catch (error) {
    print('Payment initiation failed: $error');
  }
}
```

## 🔄 Webhook Alternative
If you need real-time payment updates in your frontend application, consider implementing a webhook system or WebSocket connection to receive payment status updates immediately after the callback is processed.

## 🚀 Quick Start Examples

### HTML/JavaScript (Vanilla)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Paytm Payment Integration</title>
</head>
<body>
    <button onclick="startPayment()">Pay ₹100</button>
    <div id="status"></div>

    <script>
        async function startPayment() {
            const paymentData = {
                amount: 100.00,
                customerEmail: 'test@example.com',
                customerPhone: '9876543210',
                customerName: 'Test User'
            };
            
            try {
                const response = await fetch('https://airuter-backend.onrender.com/api/paytm/initiate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(paymentData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = result.data.paytmUrl;
                    
                    Object.keys(result.data.paytmParams).forEach(key => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = result.data.paytmParams[key];
                        form.appendChild(input);
                    });
                    
                    document.body.appendChild(form);
                    form.submit();
                } else {
                    document.getElementById('status').innerHTML = 'Payment failed: ' + result.message;
                }
            } catch (error) {
                document.getElementById('status').innerHTML = 'Error: ' + error.message;
            }
        }
        
        // Check payment status on page load (if returning from Paytm)
        window.onload = function() {
            const urlParams = new URLSearchParams(window.location.search);
            const orderId = urlParams.get('orderId');
            
            if (orderId) {
                checkPaymentStatus(orderId);
            }
        };
        
        async function checkPaymentStatus(orderId) {
            try {
                const response = await fetch(`https://airuter-backend.onrender.com/api/paytm/status/${orderId}`);
                const result = await response.json();
                
                if (result.success) {
                    const status = result.data.status;
                    document.getElementById('status').innerHTML = `Payment Status: ${status}`;
                    
                    if (status === 'SUCCESS') {
                        document.getElementById('status').style.color = 'green';
                    } else if (status === 'FAILED') {
                        document.getElementById('status').style.color = 'red';
                    }
                }
            } catch (error) {
                console.error('Status check failed:', error);
            }
        }
    </script>
</body>
</html>
```

### Node.js Backend Integration
```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Your backend route to handle payment initiation
app.post('/initiate-payment', async (req, res) => {
    try {
        const { amount, userEmail, userPhone, userName } = req.body;
        
        const paymentData = {
            amount: amount,
            customerEmail: userEmail,
            customerPhone: userPhone,
            customerName: userName
        };
        
        const response = await axios.post('https://airuter-backend.onrender.com/api/paytm/initiate', paymentData);
        
        if (response.data.success) {
            res.json({
                success: true,
                orderId: response.data.data.orderId,
                paytmParams: response.data.data.paytmParams,
                paytmUrl: response.data.data.paytmUrl
            });
        } else {
            res.status(400).json({ success: false, message: response.data.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Payment initiation failed' });
    }
});

// Check payment status
app.get('/payment-status/:orderId', async (req, res) => {
    try {
        const response = await axios.get(`https://airuter-backend.onrender.com/api/paytm/status/${req.params.orderId}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Status check failed' });
    }
});
```

## 🎨 Frontend Implementation Tips

### 1. Loading States
Always show loading indicators during payment initiation:
```javascript
const [loading, setLoading] = useState(false);

const handlePayment = async () => {
    setLoading(true);
    try {
        // Payment initiation code
    } finally {
        setLoading(false);
    }
};
```

### 2. Error Handling
Implement proper error handling:
```javascript
const [error, setError] = useState('');

// In your payment function
if (!result.success) {
    setError(result.message);
    return;
}
```

### 3. Payment Status Polling
For real-time status updates:
```javascript
const pollPaymentStatus = async (orderId) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    const checkStatus = async () => {
        try {
            const response = await fetch(`https://airuter-backend.onrender.com/api/paytm/status/${orderId}`);
            const result = await response.json();
            
            if (result.success && result.data.status !== 'PENDING') {
                return result.data;
            }
            
            if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkStatus, 2000); // Check every 2 seconds
            }
        } catch (error) {
            console.error('Status polling failed:', error);
        }
    };
    
    checkStatus();
};
```

## 🔧 API Rate Limits
- No specific rate limits are enforced
- However, avoid making excessive requests to prevent server overload
- Implement proper retry logic with exponential backoff

## 📞 Support
For technical issues or questions about the API integration:
- Review the error responses for detailed error messages
- Check the console logs for debugging information
- Ensure all required fields are provided in requests

## 🔄 Version History
- **v1.0.0**: Initial release with basic payment functionality
- Supports all major payment methods available through Paytm
- Compatible with staging and production environments