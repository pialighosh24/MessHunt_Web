const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'messhunt_dev_jwt_secret_change_in_env';

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const verifyToken = (token) => jwt.verify(token, getJwtSecret());

module.exports = { signToken, verifyToken, getJwtSecret };
