const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/jwt');

const sanitizeUser = (user) => {
  if (!user) return null;
  if (typeof user.toSafeObject === 'function') return user.toSafeObject();
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, address } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  let normalizedRole = (role || 'student').toLowerCase();
  if (!['student', 'owner', 'admin'].includes(normalizedRole)) {
    return res.status(400).json({ success: false, message: 'Invalid role.' });
  }
  if (normalizedRole === 'admin') {
    const setupKey = req.body.adminSetupKey || req.headers['x-admin-setup-key'];
    const expected = process.env.ADMIN_SETUP_KEY;
    if (!expected || !setupKey || String(setupKey) !== String(expected)) {
      return res.status(403).json({ success: false, message: 'Admin registration is restricted.' });
    }
  } else if (!['student', 'owner'].includes(normalizedRole)) {
    return res.status(400).json({ success: false, message: 'Public registration is allowed only for student or owner accounts.' });
  }

  const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists. Please log in.' });
  }

  const user = await User.create({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password),
    phone: phone ? String(phone).trim() : '',
    address: address ? String(address).trim() : '',
    role: normalizedRole,
  });

  const token = signToken(user);
  res.status(201).json({
    success: true,
    message: 'Registration successful.',
    token,
    user: sanitizeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }
  if (user.isActive === false) {
    return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
  }

  const isMatch = await user.comparePassword(String(password));
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  // Safe migration: upgrade legacy plain-text password to bcrypt on successful login
  const stored = user.password || '';
  if (!(stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$'))) {
    user.password = String(password);
    await user.save();
  }

  const token = signToken(user);
  res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: sanitizeUser(user),
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

const logout = asyncHandler(async (req, res) => {
  // JWT is stateless; client should discard token.
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = { register, login, me, logout, sanitizeUser };
