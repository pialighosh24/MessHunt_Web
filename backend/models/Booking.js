const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  mess: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mess',
    required: true,
    index: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  studentName: { type: String, trim: true, default: '' },
  studentPhone: { type: String, trim: true, default: '' },
  studentEmail: { type: String, trim: true, default: '' },
  visitDate: { type: String, trim: true, default: '' },
  visitTime: { type: String, trim: true, default: '' },
  message: { type: String, trim: true, default: '', maxlength: 500 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending',
    index: true,
  },
  ownerNote: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
