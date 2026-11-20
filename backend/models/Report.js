const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  targetType: {
    type: String,
    enum: ['review', 'mess', 'user'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  reason: {
    type: String,
    required: [true, 'Report reason is required'],
    trim: true,
  },
  details: {
    type: String,
    trim: true,
    default: '',
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['open', 'reviewed', 'resolved', 'dismissed'],
    default: 'open',
    index: true,
  },
  adminNote: {
    type: String,
    trim: true,
    default: '',
  },
  actionTaken: {
    type: String,
    trim: true,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
