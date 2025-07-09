# Paytm Payment Gateway Backend API

A common backend service for Paytm payment integration that can be used across multiple frontend projects.

**Backend URL:** `https://paytm-gateway-n0py.onrender.com`

## Quick Start

### 1. Initiate Payment

**Endpoint:** `POST /api/paytm/initiate`

**Request Body:**
```json
{
  "amount": 100.00,
  "customerEmail": "customer@example.com",
  "customerPhone": "9876543210",
  "customerName": "John Doe",
  "projectId": "your-project-id" // Optional: helps track payments by project
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "ORDER_1234567890_abc123",
  "paytmParams": {
    "MID": "Mobish80382601607975",
    "WEBSITE": "WEBSTAGING",
    "CHANNEL_ID": "WEB",
    "INDUSTRY_TYPE_ID": "Retail109",
    "ORDER_ID": "ORDER_1234567890_abc123",
    "CUST_ID": "customer@example.com",
    "TXN_AMOUNT": "100.00",
    "CALLBACK_URL": "https://paytm-gateway-n0py.onrender.com/api/paytm/callback",
    "EMAIL": "customer@example.com",
    "MOBILE_NO": "9876543210",
    "CHECKSUMHASH": "generated_checksum_hash"
  },
  "paytmUrl": "https://securegw-stage.paytm.in/order/process"
}
```

### 2. Frontend Implementation

#### HTML/JavaScript Example:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Payment Integration</title>
</head>
<body>
    <button onclick="initiatePayment()">Pay Now</button>
    
    <script>
        async function initiatePayment() {
            try {
                const response = await fetch('https://paytm-gateway-n0py.onrender.com/api/paytm/initiate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: 100.00,
                        customerEmail: 'customer@example.com',
                        customerPhone: '9876543210',
                        customerName: 'John Doe',
                        projectId: 'my-ecommerce-app'
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Create form and submit to Paytm
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = data.paytmUrl;
                    
                    Object.keys(data.paytmParams).forEach(key => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = key;
                        input.value = data.paytmParams[key];
                        form.appendChild(input);
                    });
                    
                    document.body.appendChild(form);
                    form.submit();
                } else {
                    alert('Payment initiation failed: ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Payment initiation failed');
            }
        }
    </script>
</body>
</html>
```

#### React Example:
```jsx
import React, { useState } from 'react';

const PaymentComponent = () => {
    const [loading, setLoading] = useState(false);
    
    const initiatePayment = async () => {
        setLoading(true);
        try {
            const response = await fetch('https://paytm-gateway-n0py.onrender.com/api/paytm/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: 100.00,
                    customerEmail: 'customer@example.com',
                    customerPhone: '9876543210',
                    customerName: 'John Doe',
                    projectId: 'my-react-app'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Create form and submit to Paytm
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = data.paytmUrl;
                
                Object.keys(data.paytmParams).forEach(key => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = data.paytmParams[key];
                    form.appendChild(input);
                });
                
                document.body.appendChild(form);
                form.submit();
            } else {
                alert('Payment initiation failed: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Payment initiation failed');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <button onClick={initiatePayment} disabled={loading}>
            {loading ? 'Processing...' : 'Pay Now'}
        </button>
    );
};

export default PaymentComponent;
```

### 3. Check Payment Status

**Endpoint:** `GET /api/paytm/status/:orderId`

**Response:**
```json
{
  "success": true,
  "payment": {
    "orderId": "ORDER_1234567890_abc123",
    "amount": 100.00,
    "status": "SUCCESS", // SUCCESS, PENDING, FAILED, CANCELLED
    "transactionId": "TXN_1234567890",
    "customerEmail": "customer@example.com",
    "customerName": "John Doe",
    "customerPhone": "9876543210",
    "projectId": "my-project-id",
    "paymentMode": "CREDIT_CARD",
    "bankName": "HDFC Bank",
    "responseCode": "01",
    "responseMsg": "Txn Success",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:05:00.000Z"
  }
}
```

### 4. Handle Payment Callback

After payment completion, Paytm will send a callback to our backend. You can check the payment status using the order ID or handle it in your frontend:

```javascript
// Get order ID from URL parameters after payment
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('orderId');
const status = urlParams.get('status');

if (orderId) {
    // Check payment status
    fetch(`https://paytm-gateway-n0py.onrender.com/api/paytm/status/${orderId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const payment = data.payment;
                if (payment.status === 'SUCCESS') {
                    // Payment successful
                    showSuccessMessage(payment);
                } else if (payment.status === 'FAILED') {
                    // Payment failed
                    showFailureMessage(payment);
                } else {
                    // Payment pending
                    showPendingMessage(payment);
                }
            }
        })
        .catch(error => {
            console.error('Error checking payment status:', error);
        });
}
```

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/paytm/initiate` | Initiate a new payment |
| GET | `/api/paytm/status/:orderId` | Check payment status |
| POST | `/api/paytm/callback` | Payment callback (handled by Paytm) |
| POST | `/api/paytm/transaction-status` | Check transaction status with Paytm |

### Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/paytm/payments` | Get all payments (with filtering) |
| GET | `/api/paytm/summary/:projectId` | Get payment summary by project |
| GET | `/api/health` | Health check endpoint |

### Query Parameters for `/api/paytm/payments`

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Records per page (default: 10) |
| `status` | String | Filter by status (SUCCESS, PENDING, FAILED, CANCELLED) |
| `projectId` | String | Filter by project ID |

**Example:**
```
GET /api/paytm/payments?page=1&limit=20&status=SUCCESS&projectId=my-app
```

## Payment Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Payment is being processed |
| `SUCCESS` | Payment completed successfully |
| `FAILED` | Payment failed |
| `CANCELLED` | Payment was cancelled by user |

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Not Found (payment not found)
- `500` - Internal Server Error

## Frontend Integration Tips

### 1. Environment Variables
Store the backend URL in your frontend environment variables:

```javascript
// .env
REACT_APP_PAYMENT_API_URL=https://paytm-gateway-n0py.onrender.com

// Usage
const API_URL = process.env.REACT_APP_PAYMENT_API_URL;
```

### 2. Error Handling
Always handle errors gracefully:

```javascript
try {
    const response = await fetch(`${API_URL}/api/paytm/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Payment initiation failed');
    }
    
    // Handle success
} catch (error) {
    console.error('Payment error:', error);
    // Show user-friendly error message
}
```

### 3. Loading States
Show loading indicators during payment processing:

```javascript
const [isProcessing, setIsProcessing] = useState(false);

const handlePayment = async () => {
    setIsProcessing(true);
    try {
        // Payment initiation code
    } finally {
        setIsProcessing(false);
    }
};
```

### 4. Payment Verification
After payment completion, always verify the payment status:

```javascript
const verifyPayment = async (orderId) => {
    try {
        const response = await fetch(`${API_URL}/api/paytm/status/${orderId}`);
        const data = await response.json();
        
        if (data.success && data.payment.status === 'SUCCESS') {
            // Payment verified successfully
            return true;
        }
        return false;
    } catch (error) {
        console.error('Payment verification failed:', error);
        return false;
    }
};
```

## Testing

### Test Credentials
The backend is configured with Paytm staging credentials for testing:
- Use any valid email and phone number
- Use test card numbers provided by Paytm
- Test transactions won't charge real money

### Test Payment Flow
1. Call `/api/paytm/initiate` with test data
2. Use the returned `paytmParams` to submit to Paytm
3. Complete payment on Paytm's test page
4. Check payment status using `/api/paytm/status/:orderId`

## Project ID Usage

Include a `projectId` in your payment requests to:
- Track payments by different frontend applications
- Generate project-specific reports
- Separate payment data for different services

```javascript
// Example for different projects
const paymentData = {
    amount: 100.00,
    customerEmail: 'user@example.com',
    customerPhone: '9876543210',
    customerName: 'John Doe',
    projectId: 'ecommerce-app' // or 'booking-app', 'subscription-service', etc.
};
```

## Security Considerations

1. **Never expose sensitive data**: Don't store or log sensitive payment information in your frontend
2. **Use HTTPS**: Always use HTTPS in production
3. **Validate on backend**: All payment validation happens on the backend
4. **Check payment status**: Always verify payment status after completion

## CORS Configuration

The backend supports multiple origins. Common frontend URLs are already configured. If you need to add your domain, contact the backend administrator.

## Support

For integration issues or questions:
1. Check the payment status using the status endpoint
2. Review the browser console for error messages
3. Ensure all required fields are included in requests
4. Verify the backend URL is correct

## Example Integration Workflow

1. **User clicks "Pay Now"**
2. **Frontend calls** `/api/paytm/initiate`
3. **Backend responds** with Paytm parameters
4. **Frontend submits** form to Paytm
5. **User completes** payment on Paytm
6. **Paytm sends callback** to backend
7. **Backend updates** payment status
8. **User redirected** to frontend with order ID
9. **Frontend checks** payment status
10. **Show success/failure** message to user

This backend service handles all the complex Paytm integration logic, allowing you to focus on your frontend user experience.