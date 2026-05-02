const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
