const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mess: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mess',
    required: true,
    index: true,
  },
}, { timestamps: true });

favouriteSchema.index({ user: 1, mess: 1 }, { unique: true });

module.exports = mongoose.model('Favourite', favouriteSchema);
