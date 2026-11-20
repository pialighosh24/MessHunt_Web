const Mess = require('../models/Mess');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

const getOwnerDashboard = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const myMesses = await Mess.find({ owner: ownerId }).select('_id');
  const messIds = myMesses.map(m => m._id);

  const [total, approved, pending, rejected, suspended, available, unavailable, bookings, pendingBookings, reviews] = await Promise.all([
    Mess.countDocuments({ owner: ownerId }),
    Mess.countDocuments({ owner: ownerId, approvalStatus: 'approved' }),
    Mess.countDocuments({ owner: ownerId, approvalStatus: 'pending' }),
    Mess.countDocuments({ owner: ownerId, approvalStatus: 'rejected' }),
    Mess.countDocuments({ owner: ownerId, approvalStatus: 'suspended' }),
    Mess.countDocuments({ owner: ownerId, availabilityStatus: 'available' }),
    Mess.countDocuments({ owner: ownerId, availabilityStatus: 'unavailable' }),
    Booking.countDocuments({ owner: ownerId }),
    Booking.countDocuments({ owner: ownerId, status: 'pending' }),
    Review.countDocuments({ mess: { $in: messIds } }),
  ]);

  res.json({
    success: true,
    data: {
      listings: { total, approved, pending, rejected, suspended, available, unavailable },
      bookings: { total: bookings, pending: pendingBookings },
      reviews: { total: reviews },
    }
  });
});

const getOwnerReviews = asyncHandler(async (req, res) => {
  const myMesses = await Mess.find({ owner: req.user._id }).select('_id name');
  const messIds = myMesses.map(m => m._id);
  const reviews = await Review.find({ mess: { $in: messIds } }).populate('user', 'name').populate('mess', 'name').sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

module.exports = { getOwnerDashboard, getOwnerReviews };
