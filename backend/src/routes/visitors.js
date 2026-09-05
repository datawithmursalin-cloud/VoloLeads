const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { trackVisitorEvent, getVisitorEvents, getVisitorAnalytics, deleteVisitorData } = require('../controllers/visitorController');
const requireAdminApiKey = require('../middleware/requireAdminApiKey');

// Rate limiter: 100 events per IP per hour
const visitorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many visitor events from this IP.',
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/visitors', visitorLimiter, trackVisitorEvent);

router.get('/visitors', requireAdminApiKey, getVisitorEvents);

router.get('/analytics', requireAdminApiKey, getVisitorAnalytics);

router.delete('/visitors/:visitorHash', requireAdminApiKey, deleteVisitorData);

module.exports = router;
