const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

const MESSAGES = {
  SUCCESS: 'Operation successful',
  USER_CREATED: 'User created successfully',
  LOGIN_SUCCESS: 'Login successful',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_EXISTS: 'User already exists',
  USER_NOT_FOUND: 'User not found',
  TOKEN_REQUIRED: 'Access token required',
  INVALID_TOKEN: 'Invalid or expired token',
  ROUTE_NOT_FOUND: 'Route not found',
  INTERNAL_ERROR: 'Internal server error'
};

const ERRORS = {
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Internal server error'
};

const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

const TOKEN_EXPIRY = {
  SHORT: '1h',
  MEDIUM: '7d',
  LONG: '30d'
};

module.exports = {
  HTTP_STATUS,
  MESSAGES,
  ERRORS,
  ROLES,
  TOKEN_EXPIRY
};
