const mongoose = require('mongoose');

const messSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Mess name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  area: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: 'Midnapore',
  },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    mapUrl: { type: String, trim: true, default: '' },
  },
  price: {
    type: Number,
    required: [true, 'Monthly price is required'],
    min: 0,
  },
  roomType: {
    type: String,
    trim: true,
    default: 'Shared',
  },
  gender: {
    type: String,
    enum: ['Boys', 'Girls', 'Co-ed', 'Any'],
    default: 'Any',
  },
  foodType: {
    type: String,
    trim: true,
    default: '',
  },
  foodAvailable: {
    type: Boolean,
    default: true,
  },
  facilities: {
    type: [String],
    default: [],
  },
  rules: {
    type: [String],
    default: [],
  },
  contactPhone: {
    type: String,
    trim: true,
    default: '',
  },
  contactEmail: {
    type: String,
    trim: true,
    default: '',
  },
  whatsapp: {
    type: String,
    trim: true,
    default: '',
  },
  images: {
    type: [String],
    default: [],
  },
  availabilityStatus: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
    index: true,
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: '',
  },
  averageRating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

messSchema.index({ name: 'text', area: 'text', address: 'text', description: 'text', city: 'text' });

module.exports = mongoose.model('Mess', messSchema);
