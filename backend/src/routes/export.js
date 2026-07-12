const express = require('express');
const router = express.Router();
const requireSyncApiKey = require('../middleware/requireSyncApiKey');
const {
  exportContactForms,
  exportSubscriptions
} = require('../controllers/exportController');

router.get('/export/contact-forms', requireSyncApiKey, exportContactForms);
router.get('/export/subscriptions', requireSyncApiKey, exportSubscriptions);

module.exports = router;
