const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateRegisterInput = (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and name are required'
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Name must be between 2 and 100 characters'
    });
  }

  next();
};

const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateRegisterInput,
  validateLoginInput
};
