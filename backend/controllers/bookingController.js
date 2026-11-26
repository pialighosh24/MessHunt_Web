const Booking = require('../models/Booking');
const Mess = require('../models/Mess');
const asyncHandler = require('../utils/asyncHandler');

const createBooking = asyncHandler(async (req, res) => {
  const { messId } = req.params;
  const mess = await Mess.findById(messId);
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  if (mess.approvalStatus !== 'approved') return res.status(400).json({ success: false, message: 'Booking requests can be made only for approved listings.' });

  const { studentName, studentPhone, studentEmail, visitDate, visitTime, message } = req.body || {};
  if (!visitDate) return res.status(400).json({ success: false, message: 'Preferred visit date is required.' });

  const booking = await Booking.create({
    mess: mess._id,
    student: req.user._id,
    owner: mess.owner,
    studentName: (studentName || req.user.name || '').trim(),
    studentPhone: (studentPhone || req.user.phone || '').trim(),
    studentEmail: (studentEmail || req.user.email || '').trim(),
    visitDate: String(visitDate).trim(),
    visitTime: (visitTime || '').trim(),
    message: (message || '').trim(),
  });

  const populated = await Booking.findById(booking._id).populate('mess', 'name address area').populate('student', 'name email phone');
  res.status(201).json({ success: true, message: 'Booking request submitted successfully.', data: populated });
});

const getMyBookings = asyncHandler(async (req, res) => {
  let query;
  if (req.user.role === 'admin') {
    query = {};
  } else if (req.user.role === 'owner') {
    const myMesses = await Mess.find({ owner: req.user._id }).select('_id');
    query = { mess: { $in: myMesses.map(m => m._id) } };
  } else {
    query = { student: req.user._id };
  }
  const bookings = await Booking.find(query)
    .populate('mess', 'name address area city price images contactPhone')
    .populate('student', 'name email phone')
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bookings });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  const { status, ownerNote } = req.body || {};
  const allowedStatuses = ['pending', 'accepted', 'rejected', 'cancelled'];
  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid booking status.' });
  }

  const isStudent = String(booking.student) === String(req.user._id);
  const isOwnerRole = req.user.role === 'owner';
  const isAdmin = req.user.role === 'admin';

  if (status === 'cancelled') {
    if (!isStudent && !isAdmin && !isOwnerRole) return res.status(403).json({ success: false, message: 'Only the student can cancel this booking request.' });
  } else {
    // accepted/rejected/pending updates by owner/admin
    if (!isOwnerRole && !isAdmin) return res.status(403).json({ success: false, message: 'Only a mess owner can update this booking status.' });
  }

  booking.status = status;
  if (ownerNote !== undefined) booking.ownerNote = String(ownerNote).trim();
  await booking.save();
  const populated = await Booking.findById(booking._id)
    .populate('mess', 'name address area city price images')
    .populate('student', 'name email phone')
    .populate('owner', 'name email phone');
  res.json({ success: true, message: 'Booking status updated.', data: populated });
});

const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  const isStudent = String(booking.student) === String(req.user._id);
  const isOwnerRole = req.user.role === 'owner';
  const isAdmin = req.user.role === 'admin';
  if (!isStudent && !isOwnerRole && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this booking request.' });
  }

  await booking.deleteOne();
  res.json({ success: true, message: 'Booking request deleted.' });
});

module.exports = { createBooking, getMyBookings, updateBookingStatus, deleteBooking };
