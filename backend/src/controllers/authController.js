const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/helpers');
const { HTTP_STATUS, MESSAGES } = require('../constants');

const authController = {
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        createdAt: new Date()
      };

      const token = generateToken(
        { id: user.id, email: user.email },
        '7d'
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: MESSAGES.USER_CREATED,
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const token = generateToken(
        { id: 'user-id', email },
        '7d'
      );

      res.json({
        success: true,
        message: MESSAGES.LOGIN_SUCCESS,
        user: { id: 'user-id', email },
        token
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
