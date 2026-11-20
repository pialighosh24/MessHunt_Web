const Report = require('../models/Report');
const Review = require('../models/Review');
const Mess = require('../models/Mess');
const User = require('../models/user');
const asyncHandler = require('../utils/asyncHandler');

const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, details } = req.body || {};
  if (!['review', 'mess', 'user'].includes(targetType)) {
    return res.status(400).json({ success: false, message: 'Invalid report target type.' });
  }
  if (!targetId || !reason) {
    return res.status(400).json({ success: false, message: 'Target and reason are required.' });
  }

  // Basic target existence check
  let exists = null;
  if (targetType === 'review') exists = await Review.findById(targetId);
  if (targetType === 'mess') exists = await Mess.findById(targetId);
  if (targetType === 'user') exists = await User.findById(targetId);
  if (!exists) return res.status(404).json({ success: false, message: 'Reported item not found.' });

  const report = await Report.create({
    reporter: req.user._id,
    targetType,
    targetId,
    reason: String(reason).trim(),
    details: (details || '').trim(),
  });
  res.status(201).json({ success: true, message: 'Report submitted successfully. Admin will review it.', data: report });
});

const getMyReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ reporter: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: reports });
});

module.exports = { createReport, getMyReports };
