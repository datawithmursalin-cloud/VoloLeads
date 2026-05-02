const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    req.user = user;
    next();
  });
};

router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'User profile retrieved',
    user: req.user
  });
});

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Users endpoint',
    users: []
  });
});

module.exports = router;
