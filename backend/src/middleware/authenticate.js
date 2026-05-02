const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Token expired'
        : 'Invalid token';
      return res.status(403).json({
        success: false,
        message
      });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticate };
module.exports.default = authenticate;
