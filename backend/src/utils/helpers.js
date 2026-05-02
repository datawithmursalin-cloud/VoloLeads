const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
};

const formatResponse = (success, message, data = null, statusCode = 200) => {
  return {
    success,
    status: statusCode,
    message,
    ...(data && { data })
  };
};

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const isStrongPassword = (password) => {
  return password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password);
};

const hashIP = (ipAddress) => {
  if (!ipAddress) return null;
  const salt = process.env.HASH_SALT || 'default-salt-change-in-prod';
  return crypto
    .createHmac('sha256', salt)
    .update(ipAddress)
    .digest('hex');
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.connection.remoteAddress ||
    'unknown'
  );
};

const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const truncateString = (str, length = 255) => {
  if (!str) return '';
  return str.substring(0, length);
};

const sanitizeContactForm = (data) => {
  return {
    name: data.name?.trim() || '',
    email: data.email?.trim().toLowerCase() || '',
    phone: data.phone?.trim() || '',
    company: data.company?.trim() || '',
    service: data.service || 'Standard',
    quantity: data.quantity?.trim() || '',
    preferredDate: data.preferred_date || data.preferredDate,
    preferredTime: data.preferred_time || data.preferredTime,
    preferredTimezone: data.preferred_timezone || data.preferredTimezone || 'UTC',
    referralSource: data.referral_source || data.referralSource,
    referralSourceOther: data.referral_source_other || data.referralSourceOther || '',
    message: data.message?.trim() || ''
  };
};

module.exports = {
  generateToken,
  verifyToken,
  formatResponse,
  generateId,
  isValidEmail,
  isStrongPassword,
  hashIP,
  validatePhone,
  getClientIP,
  isValidURL,
  truncateString,
  sanitizeContactForm
};
