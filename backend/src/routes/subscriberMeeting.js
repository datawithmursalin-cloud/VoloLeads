const express = require('express');
const rateLimit = require('express-rate-limit');
const verifyTurnstile = require('../middleware/turnstile');
const { requireSubscriberBooking } = require('../middleware/requireSubscriberBooking');
const {
  verifySubscriberAccess,
  scheduleSubscriberMeeting
} = require('../controllers/subscriberMeetingController');

const router = express.Router();

const subscriberMeetingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many subscriber meeting requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/verify-subscriber-access', subscriberMeetingLimiter, verifySubscriberAccess);
router.post(
  '/subscriber/schedule-meeting',
  subscriberMeetingLimiter,
  verifyTurnstile,
  requireSubscriberBooking,
  scheduleSubscriberMeeting
);

module.exports = router;
