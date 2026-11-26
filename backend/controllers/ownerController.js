const fs = require('fs');
const path = require('path');
const Mess = require('../models/Mess');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

const getOwnerDashboard = asyncHandler(async (req, res) => {
  const ownerFilter = req.user.role === 'admin' ? {} : { owner: req.user._id };
  const myMesses = await Mess.find(ownerFilter).select('_id');
  const messIds = myMesses.map(m => m._id);

  const [total, approved, pending, rejected, suspended, available, unavailable, bookings, pendingBookings, reviews] = await Promise.all([
    Mess.countDocuments(ownerFilter),
    Mess.countDocuments({ ...ownerFilter, approvalStatus: 'approved' }),
    Mess.countDocuments({ ...ownerFilter, approvalStatus: 'pending' }),
    Mess.countDocuments({ ...ownerFilter, approvalStatus: 'rejected' }),
    Mess.countDocuments({ ...ownerFilter, approvalStatus: 'suspended' }),
    Mess.countDocuments({ ...ownerFilter, availabilityStatus: 'available' }),
    Mess.countDocuments({ ...ownerFilter, availabilityStatus: 'unavailable' }),
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
  const ownerFilter = req.user.role === 'admin' ? {} : { owner: req.user._id };
  const myMesses = await Mess.find(ownerFilter).select('_id');
  const messIds = myMesses.map(m => m._id);
  const bookings = await Booking.find({ mess: { $in: messIds } })
    .populate('mess', 'name address area city price images contactPhone')
    .populate('student', 'name email phone')
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});

const getOwnerReviews = asyncHandler(async (req, res) => {
  const ownerFilter = req.user.role === 'admin' ? {} : { owner: req.user._id };
  const myMesses = await Mess.find(ownerFilter).select('_id name');
  const messIds = myMesses.map(m => m._id);
  const reviews = await Review.find({ mess: { $in: messIds }, isHidden: { $ne: true } })
    .populate('user', 'name email phone role')
    .populate('mess', 'name area city price')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

const uploadMessImages = asyncHandler(async (req, res) => {
  const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'messes');
  fs.mkdirSync(uploadDir, { recursive: true });
  const savedUrls = [];

  // 1. Handle JSON base64 payload: { files: [{ name, dataUrl }] }
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
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
    savedUrls.push(`/uploads/messes/${filename}`);
  }

  // 2. Handle multipart/form-data raw binary upload (if called via FormData to /api/uploads/images)
  const contentType = String(req.headers['content-type'] || '');
  if (!savedUrls.length && contentType.includes('multipart/form-data')) {
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    const boundary = boundaryMatch ? (boundaryMatch[1] || boundaryMatch[2]) : null;
    if (boundary) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBuf = Buffer.concat(chunks);
      const boundaryBuf = Buffer.from(`--${boundary}`);
      let pos = 0;
      let fileIdx = 0;
      while (pos < rawBuf.length) {
        const start = rawBuf.indexOf(boundaryBuf, pos);
        if (start === -1) break;
        const next = rawBuf.indexOf(boundaryBuf, start + boundaryBuf.length);
        if (next === -1) break;
        const part = rawBuf.subarray(start + boundaryBuf.length + 2, next - 2);
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd !== -1) {
          const headerStr = part.subarray(0, headerEnd).toString('utf8');
          const bodyBuf = part.subarray(headerEnd + 4);
          const fnMatch = headerStr.match(/filename="([^"]+)"/i);
          if (fnMatch && bodyBuf.length > 0) {
            fileIdx++;
            const origName = fnMatch[1];
            const extMatch = origName.match(/\.(png|jpe?g|webp|gif)$/i);
            const ext = extMatch ? extMatch[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
            const safeBase = origName.replace(/\.[^/.]+$/, '').replace(/[^a-z0-9_-]/gi, '-').slice(0, 32) || 'mess';
            const filename = `${safeBase}-${Date.now()}-${fileIdx}.${ext}`;
            fs.writeFileSync(path.join(uploadDir, filename), bodyBuf);
            savedUrls.push(`/uploads/messes/${filename}`);
          }
        }
        pos = next;
      }
    }
  }

  if (!savedUrls.length) {
    return res.status(400).json({ success: false, message: 'Invalid image format. Please upload JPG, PNG, or WEBP photos.' });
  }

  res.json({
    success: true,
    message: `${savedUrls.length} photo(s) uploaded.`,
    urls: savedUrls,
    data: savedUrls.map(u => ({ url: u }))
  });
});

module.exports = { getOwnerDashboard, getOwnerBookings, getOwnerReviews, uploadMessImages };
