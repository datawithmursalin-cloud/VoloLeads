# Stripe Webhook Setup - Payment Confirmation Emails

This guide sets up Stripe webhooks to send confirmation emails to both customer and admin after successful payments.

---

## 1. Install Required Package

```bash
cd backend
npm install stripe
```

---

## 2. Create Payment Model

Create `src/models/Payment.js`:

```javascript
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    stripePaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    stripeCustomerId: String,
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'usd'
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending'
    },
    customerName: String,
    customerEmail: {
      type: String,
      required: true,
      index: true
    },
    customerPhone: String,
    service: String,
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    receiptUrl: String,
    failureReason: String
  },
  { timestamps: true, collection: 'payments' }
);

module.exports = mongoose.model('Payment', paymentSchema);
```

---

## 3. Create Webhook Controller

Create `src/controllers/webhookController.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const logger = require('../utils/logger');
const { sendPaymentConfirmationEmail } = require('../utils/emailService');

exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    logger.error(`Webhook signature verification failed: ${error.message}`);
    return res.status(400).json({ 
      success: false, 
      message: 'Webhook signature verification failed' 
    });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Webhook processing failed' 
    });
  }
};

const handlePaymentSucceeded = async (paymentIntent) => {
  try {
    // Extract payment information
    const {
      id: stripePaymentId,
      amount,
      currency,
      customer: stripeCustomerId,
      metadata,
      receipt_email: receiptEmail
    } = paymentIntent;

    const customerEmail = receiptEmail || metadata?.customerEmail;

    // Check if payment already exists
    let payment = await Payment.findOne({ stripePaymentId });

    if (payment) {
      // Update existing payment
      payment.status = 'succeeded';
      payment.receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url;
      await payment.save();
    } else {
      // Create new payment record
      payment = new Payment({
        stripePaymentId,
        stripeCustomerId,
        amount: amount / 100, // Convert cents to dollars
        currency,
        status: 'succeeded',
        customerName: metadata?.customerName || 'Valued Customer',
        customerEmail,
        customerPhone: metadata?.customerPhone,
        service: metadata?.service,
        description: metadata?.description || 'Service Payment',
        metadata,
        receiptUrl: paymentIntent.charges?.data?.[0]?.receipt_url
      });
      await payment.save();
    }

    logger.info(`Payment succeeded: ${stripePaymentId}`);

    // Send confirmation emails
    await sendPaymentConfirmationEmail({
      toCustomer: customerEmail,
      toAdmin: process.env.ADMIN_EMAIL,
      payment: {
        id: payment._id,
        stripeId: stripePaymentId,
        amount: payment.amount,
        currency: payment.currency,
        customerName: payment.customerName,
        customerEmail: payment.customerEmail,
        service: payment.service,
        description: payment.description,
        receiptUrl: payment.receiptUrl
      }
    });

  } catch (error) {
    logger.error(`Error handling payment success: ${error.message}`);
    throw error;
  }
};

const handlePaymentFailed = async (paymentIntent) => {
  try {
    const { id: stripePaymentId, metadata } = paymentIntent;

    let payment = await Payment.findOne({ stripePaymentId });

    if (!payment) {
      payment = new Payment({
        stripePaymentId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'failed',
        customerName: metadata?.customerName,
        customerEmail: metadata?.customerEmail,
        service: metadata?.service,
        failureReason: paymentIntent.last_payment_error?.message
      });
    } else {
      payment.status = 'failed';
      payment.failureReason = paymentIntent.last_payment_error?.message;
    }

    await payment.save();

    logger.warn(`Payment failed: ${stripePaymentId} - ${paymentIntent.last_payment_error?.message}`);

    // Optional: Send failure notification email
    // await sendPaymentFailureEmail({ ... });

  } catch (error) {
    logger.error(`Error handling payment failure: ${error.message}`);
    throw error;
  }
};

const handleChargeRefunded = async (charge) => {
  try {
    const payment = await Payment.findOne({ stripePaymentId: charge.payment_intent });

    if (payment) {
      payment.status = 'refunded';
      await payment.save();
      logger.info(`Payment refunded: ${charge.id}`);
    }
  } catch (error) {
    logger.error(`Error handling refund: ${error.message}`);
    throw error;
  }
};
```

---

## 4. Create Email Service

Create `src/utils/emailService.js`:

```javascript
const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendPaymentConfirmationEmail = async ({ toCustomer, toAdmin, payment }) => {
  try {
    const customerEmailHtml = `
      <h2>Payment Confirmation</h2>
      <p>Dear ${payment.customerName},</p>
      <p>Thank you for your payment!</p>
      
      <h3>Payment Details</h3>
      <ul>
        <li><strong>Amount:</strong> $${payment.amount.toFixed(2)} ${payment.currency.toUpperCase()}</li>
        <li><strong>Service:</strong> ${payment.service || payment.description}</li>
        <li><strong>Transaction ID:</strong> ${payment.stripeId}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>

      <p>
        ${payment.receiptUrl ? `<a href="${payment.receiptUrl}">Download Receipt</a>` : ''}
      </p>

      <p>If you have any questions, please contact our support team.</p>
      <p>Best regards,<br>VoloLeads Team</p>
    `;

    const adminEmailHtml = `
      <h2>New Payment Received</h2>
      
      <h3>Customer Information</h3>
      <ul>
        <li><strong>Name:</strong> ${payment.customerName}</li>
        <li><strong>Email:</strong> ${payment.customerEmail}</li>
        <li><strong>Phone:</strong> ${payment.customerPhone || 'N/A'}</li>
      </ul>

      <h3>Payment Details</h3>
      <ul>
        <li><strong>Amount:</strong> $${payment.amount.toFixed(2)} ${payment.currency.toUpperCase()}</li>
        <li><strong>Service:</strong> ${payment.service || payment.description}</li>
        <li><strong>Stripe ID:</strong> ${payment.stripeId}</li>
        <li><strong>Payment ID:</strong> ${payment.id}</li>
        <li><strong>Status:</strong> Succeeded</li>
        <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>

      <p><strong>Dashboard Link:</strong> <a href="${process.env.ADMIN_DASHBOARD_URL}/payments/${payment.id}">View Payment</a></p>
    `;

    // Send customer confirmation
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toCustomer,
      subject: 'Payment Confirmation - VoloLeads',
      html: customerEmailHtml
    });

    logger.info(`Customer confirmation email sent to: ${toCustomer}`);

    // Send admin notification
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: toAdmin,
      subject: `New Payment Received - $${payment.amount.toFixed(2)}`,
      html: adminEmailHtml
    });

    logger.info(`Admin notification email sent to: ${toAdmin}`);

  } catch (error) {
    logger.error(`Failed to send confirmation emails: ${error.message}`);
    throw error;
  }
};
```

---

## 5. Create Webhook Route

Create `src/routes/webhook.js`:

```javascript
const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/webhookController');

// Important: This route should NOT have express.json() middleware
// Stripe requires raw body for signature verification
router.post('/stripe', handleStripeWebhook);

module.exports = router;
```

---

## 6. Update Server Configuration

Update `src/server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();

app.use(helmet());

// Configure CORS
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(morgan('combined'));

// IMPORTANT: Webhook route MUST come before express.json()
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), require('./routes/webhook'));

// Apply JSON middleware AFTER webhook route
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

// Error handler
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] ${status} - ${message}`);

  res.status(status).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/contact'));
app.use('/api', require('./routes/visitors'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    message: 'Route not found'
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

module.exports = app;
```

---

## 7. Update .env.example

Add these variables:

```env
# Stripe Configuration
STRIPE_PUBLIC_KEY=pk_test_your_public_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@vololeads.com
ADMIN_DASHBOARD_URL=http://localhost:3000/admin

# Existing variables...
```

---

## 8. Setup Stripe Webhook Endpoint

### In Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/webhook/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`

### For Local Testing:

```bash
# Install Stripe CLI
# Mac: brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/webhook/stripe

# Copy the signing secret shown and add to .env
```

---

## 9. Update Package.json

Add these dependencies if not already present:

```json
{
  "dependencies": {
    "stripe": "^12.0.0",
    "nodemailer": "^6.9.3"
  }
}
```

---

## 10. Test Webhook Locally

```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Forward Stripe events
stripe listen --forward-to localhost:5000/api/webhook/stripe

# Terminal 3: Test payment succeeded event
stripe trigger payment_intent.succeeded

# Check logs and verify emails are sent
```

---

## 11. Frontend: Create Payment Intent

On your frontend, create a Stripe Payment Intent:

```javascript
// When user clicks "Pay"
const response = await fetch('http://localhost:5000/api/payment/create-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 9999, // in cents
    customerName: formData.name,
    customerEmail: formData.email,
    service: formData.service
  })
});

const { clientSecret } = await response.json();

// Use clientSecret with Stripe.js to confirm payment
const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: { name: formData.name }
  }
});

if (result.paymentIntent.status === 'succeeded') {
  console.log('Payment successful!');
  // Webhook will handle email confirmation
}
```

---

## 12. Create Payment Intent Endpoint

Create `src/routes/payment.js`:

```javascript
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

router.post('/payment/create-intent', async (req, res) => {
  try {
    const { amount, customerName, customerEmail, service } = req.body;

    if (!amount || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Amount and email required'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'usd',
      metadata: {
        customerName,
        customerEmail,
        service
      }
    });

    logger.info(`Payment intent created: ${paymentIntent.id}`);

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    logger.error(`Payment intent creation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    });
  }
});

module.exports = router;
```

---

## Key Points

✅ **Webhook Security:**
- Verify Stripe signature
- Never trust client data
- Log all events

✅ **Email Confirmations:**
- Customer gets receipt
- Admin gets notification
- Both include payment details

✅ **Data Persistence:**
- Save all payments to database
- Track payment status
- Maintain audit trail

✅ **Error Handling:**
- Gracefully handle failures
- Log all errors
- Retry mechanism for emails

---

## Troubleshooting

**Emails not sending:**
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Enable "Less secure app access" for Gmail
- Or use app-specific password

**Webhook not triggering:**
- Verify endpoint URL is public/accessible
- Check webhook secret in Stripe dashboard
- Use `stripe listen` for local testing

**Payment not saving:**
- Check MongoDB connection
- Verify Payment model is imported
- Check logs for database errors

---

This setup ensures customers get instant confirmation emails after payment! 🎉
