function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  return 'dev-only-insecure-jwt-secret';
}

function validateProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const missing = [];

  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  }

  if (!process.env.ADMIN_API_KEY) {
    missing.push('ADMIN_API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}`);
  }
}

module.exports = {
  getJwtSecret,
  validateProductionSecrets
};
