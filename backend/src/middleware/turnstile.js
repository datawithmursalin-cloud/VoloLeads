const axios = require('axios');
const { getClientIP } = require('../utils/helpers');
const logger = require('../utils/logger');

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

async function verifyTurnstile(req, res, next) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const token = req.body && req.body['cf-turnstile-response'];

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('TURNSTILE_SECRET_KEY is missing in production');
      return res.status(500).json({
        success: false,
        message: 'Security verification is not configured. Please contact support.'
      });
    }

    logger.warn('Skipping Turnstile verification because TURNSTILE_SECRET_KEY is not set');
    return next();
  }

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Please complete the security check and try again.'
    });
  }

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
      remoteip: getClientIP(req)
    });

    const response = await axios.post(TURNSTILE_VERIFY_URL, params, {
      timeout: 8000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.data || !response.data.success) {
      logger.warn(`Turnstile verification failed: ${JSON.stringify(response.data)}`);
      return res.status(400).json({
        success: false,
        message: 'Security verification failed. Please try again.'
      });
    }

    return next();
  } catch (error) {
    logger.error(`Turnstile verification error: ${error.message}`);
    return res.status(503).json({
      success: false,
      message: 'Security verification is temporarily unavailable. Please try again.'
    });
  }
}

module.exports = verifyTurnstile;
