const fs = require('fs');
const path = require('path');
const Mess = require('../models/Mess');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

const getOwnerDashboard = asyncHandler(async (req, res) => {
  const allMesses = await Mess.find({}).select('_id');
  const messIds = allMesses.map(m => m._id);

  const [total, approved, pending, rejected, suspended, available, unavailable, bookings, pendingBookings, reviews] = await Promise.all([
    Mess.countDocuments({}),
    Mess.countDocuments({ approvalStatus: 'approved' }),
    Mess.countDocuments({ approvalStatus: 'pending' }),
    Mess.countDocuments({ approvalStatus: 'rejected' }),
    Mess.countDocuments({ approvalStatus: 'suspended' }),
    Mess.countDocuments({ availabilityStatus: 'available' }),
    Mess.countDocuments({ availabilityStatus: 'unavailable' }),
    Booking.countDocuments({ mess: { $in: messIds } }),
    Booking.countDocuments({ mess: { $in: messIds }, status: 'pending' }),
    Review.countDocuments({ mess: { $in: messIds }, isHidden: { $ne: true } }),
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

const getOwnerBookings = asyncHandler(async (req, res) => {
  const allMesses = await Mess.find({}).select('_id');
  const messIds = allMesses.map(m => m._id);
  const bookings = await Booking.find({ mess: { $in: messIds } })
    .populate('mess', 'name address area city price images contactPhone')
    .populate('student', 'name email phone')
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});

const getOwnerReviews = asyncHandler(async (req, res) => {
  const allMesses = await Mess.find({}).select('_id name');
  const messIds = allMesses.map(m => m._id);
  const reviews = await Review.find({ mess: { $in: messIds }, isHidden: { $ne: true } })
    .populate('user', 'name email phone role')
    .populate('mess', 'name area city price')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

const uploadMessImages = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  if (!files.length) {
    return res.status(400).json({ success: false, message: 'No image files provided.' });
  }
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'messes');
  fs.mkdirSync(uploadDir, { recursive: true });

  const savedUrls = [];
  for (let i = 0; i < files.length; i++) {
    const item = files[i] || {};
    const dataUrl = String(item.dataUrl || '');
    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
    if (!match) continue;
    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    const safeBase = String(item.name || 'mess')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9_-]/gi, '-')
      .replace(/-+/g, '-')
      .slice(0, 32) || 'mess';
    const filename = `${safeBase}-${Date.now()}-${i + 1}.${ext}`;
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    savedUrls.push(`uploads/messes/${filename}`);
  }

  if (!savedUrls.length) {
    return res.status(400).json({ success: false, message: 'Invalid image format. Please upload JPG, PNG, or WEBP photos.' });
  }

  res.json({ success: true, message: `${savedUrls.length} photo(s) uploaded.`, urls: savedUrls });
});

module.exports = { getOwnerDashboard, getOwnerBookings, getOwnerReviews, uploadMessImages };
