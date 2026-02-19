# Student Payment Backend Requirements

## Overview
The frontend is calling student payment endpoints that need to be implemented on the backend. The admin has already set the payment amount (₦10,000), but students cannot see it because the backend endpoints are missing.

## Required Backend Endpoints

### 1. GET `/api/student/payment/amount`
**Purpose:** Get the current payment amount set by the admin

**Authentication:** Required (Student JWT token)

**Response Format:**
```json
{
  "success": true,
  "amount": 10000
}
```

**Implementation Notes:**
- Should fetch the payment amount from the database (set by admin via `/admin/payment/set-amount`)
- There should be a single payment amount stored globally (e.g., in a `Settings` or `PaymentConfig` collection)
- Return the same amount for all students

**Example Backend Code (Node.js/Express):**
```javascript
router.get('/student/payment/amount', authenticateStudent, async (req, res) => {
  try {
    // Get payment amount from settings/config collection
    const paymentConfig = await PaymentConfig.findOne();
    
    if (!paymentConfig || !paymentConfig.amount) {
      return res.status(200).json({
        success: true,
        amount: 50000 // Default fallback
      });
    }
    
    res.status(200).json({
      success: true,
      amount: paymentConfig.amount
    });
  } catch (error) {
    console.error('Error fetching payment amount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment amount'
    });
  }
});
```

---

### 2. GET `/api/student/payment/status`
**Purpose:** Check if the current student has paid or not

**Authentication:** Required (Student JWT token)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "amount": 10000,
    "status": "paid",
    "reference": "PAY-123456789",
    "paidAt": "2025-11-27T10:30:00.000Z"
  }
}
```

**For unpaid students:**
```json
{
  "success": true,
  "data": {
    "amount": 10000,
    "status": "pending"
  }
}
```

**Implementation Notes:**
- Get the student ID from the JWT token
- Check the `Payment` collection for a payment record with this student ID
- Return payment status: `paid`, `pending`, `failed`
- Include payment reference and date if paid

**Example Backend Code:**
```javascript
router.get('/student/payment/status', authenticateStudent, async (req, res) => {
  try {
    const studentId = req.user._id; // From JWT token
    
    // Get payment config for amount
    const paymentConfig = await PaymentConfig.findOne();
    const amount = paymentConfig?.amount || 50000;
    
    // Check if student has a payment record
    const payment = await Payment.findOne({ student: studentId })
      .sort({ createdAt: -1 }) // Get most recent payment
      .lean();
    
    if (!payment) {
      return res.status(200).json({
        success: true,
        data: {
          amount: amount,
          status: 'pending'
        }
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        amount: payment.amount,
        status: payment.status, // 'paid', 'pending', 'failed'
        reference: payment.reference,
        paidAt: payment.paymentDate || payment.createdAt
      }
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status'
    });
  }
});
```

---

### 3. POST `/api/student/payment/initialize`
**Purpose:** Initialize a payment (generate payment reference for Paystack)

**Authentication:** Required (Student JWT token)

**Request Body:**
```json
{
  "amount": 10000
}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "reference": "PAY-1732795200123",
    "authorizationUrl": "https://checkout.paystack.com/...",
    "accessCode": "abc123xyz"
  }
}
```

**Implementation Notes:**
- Validate the amount matches the configured payment amount
- Initialize payment with Paystack API
- Create a pending payment record in the database
- Return the Paystack checkout URL

---

### 4. GET `/api/student/payment/verify/:reference`
**Purpose:** Verify payment after student returns from Paystack

**Authentication:** Required (Student JWT token)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "status": "paid",
    "amount": 10000,
    "reference": "PAY-1732795200123",
    "paidAt": "2025-11-27T10:35:00.000Z"
  }
}
```

**Implementation Notes:**
- Verify payment with Paystack API using the reference
- Update payment record in database to `paid` status
- Set `paymentDate` to current timestamp

---

## Database Schema Updates

### PaymentConfig Collection (New)
```javascript
const PaymentConfigSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    default: 50000
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure only one config document exists
PaymentConfigSchema.index({}, { unique: true });
```

### Update Admin Payment Endpoints

**Ensure these endpoints save to PaymentConfig:**

#### POST `/api/admin/payment/set-amount`
```javascript
router.post('/admin/payment/set-amount', authenticateAdmin, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Update or create payment config
    const config = await PaymentConfig.findOneAndUpdate(
      {}, // Find any config
      { 
        amount: amount,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { 
        new: true, 
        upsert: true // Create if doesn't exist
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Payment amount updated successfully',
      data: { amount: config.amount }
    });
  } catch (error) {
    console.error('Error setting payment amount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment amount'
    });
  }
});
```

#### GET `/api/admin/payment/amount`
```javascript
router.get('/admin/payment/amount', authenticateAdmin, async (req, res) => {
  try {
    const config = await PaymentConfig.findOne();
    
    res.status(200).json({
      success: true,
      data: {
        amount: config?.amount || 50000
      }
    });
  } catch (error) {
    console.error('Error fetching payment amount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment amount'
    });
  }
});
```

---

## Testing Checklist

### Admin Side
- [ ] Admin can set payment amount (₦10,000)
- [ ] Admin can view current payment amount
- [ ] Payment amount is saved to database

### Student Side
- [ ] Student can see payment amount (₦10,000) on payment page
- [ ] Student can see payment status (pending/paid)
- [ ] Student can initialize payment
- [ ] Student can complete payment via Paystack
- [ ] After payment, status updates to "paid"

---

## Frontend-Backend Integration

### Current Frontend Calls:
1. **Page Load:**
   - `GET /api/student/payment/amount` → Show amount (₦10,000)
   - `GET /api/student/payment/status` → Show if paid or pending

2. **Pay Now Button:**
   - `POST /api/student/payment/initialize` → Get Paystack URL
   - Redirect to Paystack
   - User pays
   - Redirect back to frontend

3. **Payment Verification:**
   - `GET /api/student/payment/verify/:reference` → Confirm payment
   - Update UI to show "Paid" status

### Expected Data Flow:
```
1. Admin sets amount (₦10,000) → Saves to PaymentConfig
2. Student opens payment page → Fetches amount from PaymentConfig
3. Student sees ₦10,000 and "Pay Now" button
4. Student clicks Pay Now → Initialize payment → Paystack
5. Student completes payment → Verify → Update Payment record
6. Student sees "Payment Successful" status
```

---

## Quick Fix Summary

**The issue:** Backend is missing student payment endpoints

**The solution:** 
1. Create `PaymentConfig` model to store the global payment amount
2. Update admin endpoints to save to `PaymentConfig`
3. Create student endpoints to read from `PaymentConfig`
4. Implement payment initialization and verification

**Priority:** HIGH - Students cannot pay until these endpoints exist
