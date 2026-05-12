const express = require('express');
const rateLimit = require('express-rate-limit');
const verifyTurnstile = require('../middleware/turnstile');
const { createCheckoutSession, requestManageLink } = require('../controllers/billingController');

const router = express.Router();

const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many billing requests. Please try again shortly.',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/create-checkout-session', billingLimiter, createCheckoutSession);
router.post('/request-manage-link', billingLimiter, verifyTurnstile, requestManageLink);

module.exports = router;
