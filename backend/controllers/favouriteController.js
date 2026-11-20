const Favourite = require('../models/Favourite');
const Mess = require('../models/Mess');
const asyncHandler = require('../utils/asyncHandler');

const getMyFavourites = asyncHandler(async (req, res) => {
  const favs = await Favourite.find({ user: req.user._id })
    .populate({ path: 'mess', populate: { path: 'owner', select: 'name ownerVerified' } })
    .sort({ createdAt: -1 });
  // filter out deleted messes
  res.json({ success: true, data: favs.filter(f => f.mess) });
});

const addFavourite = asyncHandler(async (req, res) => {
  const { messId } = req.params;
  const mess = await Mess.findById(messId);
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  try {
    const fav = await Favourite.create({ user: req.user._id, mess: messId });
    res.status(201).json({ success: true, message: 'Added to favourites.', data: fav });
  } catch (e) {
    if (e.code === 11000) return res.status(200).json({ success: true, message: 'Already in favourites.' });
    throw e;
  }
});

const removeFavourite = asyncHandler(async (req, res) => {
  const { messId } = req.params;
  await Favourite.findOneAndDelete({ user: req.user._id, mess: messId });
  res.json({ success: true, message: 'Removed from favourites.' });
});

const toggleFavourite = asyncHandler(async (req, res) => {
  const { messId } = req.params;
  const mess = await Mess.findById(messId);
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  const existing = await Favourite.findOne({ user: req.user._id, mess: messId });
  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, message: 'Removed from favourites.', favourited: false });
  }
  await Favourite.create({ user: req.user._id, mess: messId });
  res.status(201).json({ success: true, message: 'Added to favourites.', favourited: true });
});

module.exports = { getMyFavourites, addFavourite, removeFavourite, toggleFavourite };
