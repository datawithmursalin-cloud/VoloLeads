require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const { validateProductionSecrets } = require('./config/secrets');
const { handleStripeWebhook } = require('./controllers/billingController');

validateProductionSecrets();

connectDB().catch(error => {
  console.error(`Database startup error: ${error.message}`);
  process.exit(1);
});

const app = express();
app.set('trust proxy', 1);

const defaultCorsOrigins = [
  'http://localhost:3000',
  'https://vololeads.com',
  'https://www.vololeads.com'
];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ['\'self\'', 'https://challenges.cloudflare.com'],
      frameSrc: ['\'self\'', 'https://challenges.cloudflare.com'],
      connectSrc: ['\'self\'', 'https://challenges.cloudflare.com']
    }
  }
}));

// Configure CORS for multiple origins
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : defaultCorsOrigins;

app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Sync-Api-Key'],
  credentials: true
}));

app.use(morgan('combined'));
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

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

// Mount routes
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/billing'));
app.use('/api', require('./routes/subscriberMeeting'));
app.use('/api', require('./routes/contact'));
app.use('/api', require('./routes/visitors'));
app.use('/api', require('./routes/export'));

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
