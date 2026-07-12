const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { submitContactForm, getContactForms, getContactFormById, updateContactFormStatus } = require('../controllers/contactController');
const { getMeetingAvailability } = require('../controllers/meetingAvailabilityController');
const verifyTurnstile = require('../middleware/turnstile');
const requireAdminApiKey = require('../middleware/requireAdminApiKey');

// Rate limiter: 3 submissions per IP per hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many contact form submissions from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

const availabilityLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 120,
  message: 'Too many availability requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/contact-form', contactLimiter, verifyTurnstile, submitContactForm);

router.get('/meeting-availability', availabilityLimiter, getMeetingAvailability);

router.get('/contact-forms', requireAdminApiKey, getContactForms);

router.get('/contact-forms/:id', requireAdminApiKey, getContactFormById);

router.patch('/contact-forms/:id/status', requireAdminApiKey, updateContactFormStatus);

module.exports = router;
