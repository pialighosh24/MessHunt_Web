const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['student', 'owner', 'admin'],
    default: 'student',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  profileImage: {
    type: String,
    trim: true,
    default: '',
  },
  bio: {
    type: String,
    trim: true,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  ownerVerified: {
    type: Boolean,
    default: false,
  },
  // Legacy fields preserved for compatibility with existing records/data (not used by new flows)
  subscriptionActive: { type: Boolean, default: false },
  subscriptionDate: { type: Date, default: null },
  subscriptionExpiry: { type: Date, default: null },
  isPaid: { type: Boolean, default: false },
  isSubscribed: { type: Boolean, default: false },
}, {
  timestamps: true,
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const pwd = this.password || '';
  // Avoid double-hashing if already a bcrypt hash
  if (pwd.startsWith('$2a$') || pwd.startsWith('$2b$') || pwd.startsWith('$2y$')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(pwd, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  const stored = this.password || '';
  if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
    return bcrypt.compare(candidatePassword, stored);
  }
  // Legacy plain-text compatibility for existing accounts
  return candidatePassword === stored;
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject({ versionKey: false });
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
