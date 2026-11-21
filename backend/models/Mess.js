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
  securityDeposit: {
    type: Number,
    default: null,
    min: 0,
  },
  // Legacy/compatibility field
  roomType: {
    type: String,
    trim: true,
    default: 'Shared',
  },
  roomSharing: {
    type: String,
    trim: true,
    default: 'Not specified', // Single, Double, Triple, Multiple sharing, Not specified
  },
  furnishing: {
    type: String,
    trim: true,
    default: 'Not specified', // Furnished, Unfurnished, Not specified
  },
  bathroomType: {
    type: String,
    trim: true,
    default: 'Not specified', // Attached bathroom, Common bathroom, Not specified
  },
  // Legacy/compatibility
  gender: {
    type: String,
    enum: ['Boys', 'Girls', 'Co-ed', 'Any', 'Unisex'],
    default: 'Any',
  },
  accommodationType: {
    type: String,
    trim: true,
    default: 'Unisex', // Boys, Girls, Unisex
  },
  // Legacy/compatibility
  foodType: {
    type: String,
    trim: true,
    default: '',
  },
  foodAvailable: {
    type: Boolean,
    default: true,
  },
  foodIncluded: {
    type: String,
    trim: true,
    default: 'Not specified', // Included in rent, Charged separately, Not available, Not specified
  },
  foodPreference: {
    type: String,
    trim: true,
    default: 'Not specified', // Veg, Non-veg, Both, Not specified
  },
  breakfast: { type: String, trim: true, default: 'Not specified' },
  lunch: { type: String, trim: true, default: 'Not specified' },
  dinner: { type: String, trim: true, default: 'Not specified' },
  selfCooking: {
    type: String,
    trim: true,
    default: 'Not specified', // Available, Not available, Not specified
  },
  kitchenAccess: {
    type: String,
    trim: true,
    default: 'Not specified', // Private, Shared, Not available, Not specified
  },
  cookingGas: {
    type: String,
    trim: true,
    default: 'Not specified', // Available, Not available, Not specified
  },
  inductionCooking: {
    type: String,
    trim: true,
    default: 'Not specified', // Available, Not available, Not specified
  },
  electricityCharges: {
    type: String,
    trim: true,
    default: 'Not specified', // Included, Extra, Not specified
  },
  waterSupply: {
    type: String,
    trim: true,
    default: 'Not specified', // Available, Not available, Not specified
  },
  facilities: {
    type: [String],
    default: [],
  },
  nearby: {
    college: { type: String, trim: true, default: '' },
    busStand: { type: String, trim: true, default: '' },
    railwayStation: { type: String, trim: true, default: '' },
  },
  rules: {
    type: [String],
    default: [],
  },
  ownerName: {
    type: String,
    trim: true,
    default: '',
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
