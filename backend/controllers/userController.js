const bcrypt = require('bcryptjs');
const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeUser } = require('./authController');

const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'profileImage', 'bio'];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
      req.user[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
    }
  }
  if (!req.user.name) {
    return res.status(400).json({ success: false, message: 'Name is required.' });
  }
  await req.user.save();
  res.json({ success: true, message: 'Profile updated successfully.', user: sanitizeUser(req.user) });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  const user = await User.findById(req.user._id);
  const ok = await user.comparePassword(String(currentPassword));
  if (!ok) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }
  user.password = String(newPassword); // pre-save hook hashes
  await user.save();
  res.json({ success: true, message: 'Password updated successfully.' });
});

module.exports = { getProfile, updateProfile, changePassword };
