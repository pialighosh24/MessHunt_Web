const User = require('../models/user');
const Mess = require('../models/Mess');
const Review = require('../models/Review');
const Report = require('../models/Report');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const { recalcMessRating } = require('./reviewController');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalStudents, totalOwners, totalAdmins, totalListings,
    pendingListings, approvedListings, rejectedListings, suspendedListings,
    totalReviews, hiddenReviews, totalReports, openReports, totalBookings
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'owner' }),
    User.countDocuments({ role: 'admin' }),
    Mess.countDocuments({}),
    Mess.countDocuments({ approvalStatus: 'pending' }),
    Mess.countDocuments({ approvalStatus: 'approved' }),
    Mess.countDocuments({ approvalStatus: 'rejected' }),
    Mess.countDocuments({ approvalStatus: 'suspended' }),
    Review.countDocuments({}),
    Review.countDocuments({ isHidden: true }),
    Report.countDocuments({}),
    Report.countDocuments({ status: 'open' }),
    Booking.countDocuments({}),
  ]);

  res.json({
    success: true,
    data: {
      users: { totalStudents, totalOwners, totalAdmins },
      listings: { total: totalListings, pending: pendingListings, approved: approvedListings, rejected: rejectedListings, suspended: suspendedListings },
      reviews: { total: totalReviews, hidden: hiddenReviews },
      reports: { total: totalReports, open: openReports },
      bookings: { total: totalBookings },
    }
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) {
    const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  const users = await User.find(query).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (String(user._id) === String(req.user._id)) {
    return res.status(400).json({ success: false, message: 'You cannot modify your own admin account status here.' });
  }
  if (req.body.isActive !== undefined) user.isActive = !!req.body.isActive;
  if (req.body.ownerVerified !== undefined && user.role === 'owner') user.ownerVerified = !!req.body.ownerVerified;
  await user.save();
  const safe = user.toObject();
  delete safe.password;
  res.json({ success: true, message: 'User updated successfully.', data: safe });
});

const getAllMesses = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const query = {};
  if (status) query.approvalStatus = status;
  if (search) {
    const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: regex }, { area: regex }, { address: regex }, { city: regex }];
  }
  const messes = await Mess.find(query).populate('owner', 'name email phone role ownerVerified').sort({ createdAt: -1 });
  res.json({ success: true, data: messes });
});

const updateMessApproval = asyncHandler(async (req, res) => {
  const mess = await Mess.findById(req.params.id);
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  const { approvalStatus, rejectionReason } = req.body || {};
  const allowed = ['pending', 'approved', 'rejected', 'suspended'];
  if (!allowed.includes(approvalStatus)) return res.status(400).json({ success: false, message: 'Invalid approval status.' });
  mess.approvalStatus = approvalStatus;
  mess.rejectionReason = (approvalStatus === 'rejected' || approvalStatus === 'suspended') ? String(rejectionReason || '').trim() : '';
  await mess.save();
  res.json({ success: true, message: `Listing ${approvalStatus} successfully.`, data: mess });
});

const getReports = asyncHandler(async (req, res) => {
  const { status, targetType } = req.query;
  const query = {};
  if (status) query.status = status;
  if (targetType) query.targetType = targetType;
  const reports = await Report.find(query).populate('reporter', 'name email role').sort({ createdAt: -1 });
  res.json({ success: true, data: reports });
});

const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
  const { status, adminNote, actionTaken, hideReview, deleteReview } = req.body || {};
  if (status) report.status = status;
  if (adminNote !== undefined) report.adminNote = String(adminNote).trim();
  if (actionTaken !== undefined) report.actionTaken = String(actionTaken).trim();

  // Optional moderation actions for reported reviews
  if (report.targetType === 'review' && (hideReview || deleteReview)) {
    const review = await Review.findById(report.targetId);
    if (review) {
      if (deleteReview) {
        const messId = review.mess;
        await review.deleteOne();
        await recalcMessRating(messId);
        report.actionTaken = report.actionTaken || 'Reported review deleted by admin.';
      } else if (hideReview) {
        review.isHidden = true;
        await review.save();
        await recalcMessRating(review.mess);
        report.actionTaken = report.actionTaken || 'Reported review hidden by admin.';
      }
    }
  }

  await report.save();
  res.json({ success: true, message: 'Report updated.', data: report });
});

const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({}).populate('user', 'name email').populate('mess', 'name').sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

const moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  if (req.body.isHidden !== undefined) review.isHidden = !!req.body.isHidden;
  await review.save();
  await recalcMessRating(review.mess);
  res.json({ success: true, message: 'Review moderation updated.', data: review });
});

module.exports = {
  getDashboardStats, getUsers, updateUserStatus,
  getAllMesses, updateMessApproval,
  getReports, updateReport,
  getAllReviews, moderateReview
};
