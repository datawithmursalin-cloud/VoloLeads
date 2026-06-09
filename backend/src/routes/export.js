const express = require('express');
const router = express.Router();
const requireSyncApiKey = require('../middleware/requireSyncApiKey');
const {
  exportContactForms,
  exportSubscriptions
} = require('../controllers/exportController');

router.use(requireSyncApiKey);

router.get('/export/contact-forms', exportContactForms);
router.get('/export/subscriptions', exportSubscriptions);

module.exports = router;
