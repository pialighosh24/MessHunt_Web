const { verifyToken } = require('../utils/jwt');
const User = require('../models/user');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    let token = null;

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found or no longer available.' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated. Please contact support/admin.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.slice(7).trim();
    if (!token) return next();
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.isActive !== false) req.user = user;
  } catch (_) {
    // ignore invalid optional token
  }
  next();
};

module.exports = { protect, optionalAuth };
