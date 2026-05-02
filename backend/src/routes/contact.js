const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { submitContactForm, getContactForms, getContactFormById, updateContactFormStatus } = require('../controllers/contactController');

// Rate limiter: 3 submissions per IP per hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many contact form submissions from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.headers.authorization !== undefined;
  }
});

router.post('/contact-form', contactLimiter, submitContactForm);

router.get('/contact-forms', getContactForms);

router.get('/contact-forms/:id', getContactFormById);

router.patch('/contact-forms/:id/status', updateContactFormStatus);

module.exports = router;
