const mongoose = require('mongoose');
const Review = require('../models/Review');
const Mess = require('../models/Mess');
const asyncHandler = require('../utils/asyncHandler');

const recalcMessRating = async (messId) => {
  const objId = new mongoose.Types.ObjectId(String(messId));
  const stats = await Review.aggregate([
    { $match: { mess: objId, isHidden: { $ne: true } } },
    { $group: { _id: '$mess', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  const avg = stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const count = stats[0] ? stats[0].count : 0;
  await Mess.findByIdAndUpdate(objId, { averageRating: avg, reviewCount: count });
};

const getMessReviews = asyncHandler(async (req, res) => {
  const { messId } = req.params;
  const query = { mess: messId };
  // hide hidden reviews from public; admin can see all via admin route if needed
  if (!req.user || req.user.role !== 'admin') query.isHidden = { $ne: true };
  const reviews = await Review.find(query).populate('user', 'name role').sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

const createReview = asyncHandler(async (req, res) => {
  const { messId } = req.params;
  const { rating, comment } = req.body || {};
  if (!rating || !comment) return res.status(400).json({ success: false, message: 'Rating and comment are required.' });
  const mess = await Mess.findById(messId);
  if (!mess) return res.status(404).json({ success: false, message: 'Mess listing not found.' });
  if (mess.approvalStatus !== 'approved') return res.status(400).json({ success: false, message: 'Reviews can be added only for approved listings.' });

  let review = await Review.findOne({ mess: messId, user: req.user._id });
  if (review) {
    review.rating = Number(rating);
    review.comment = String(comment).trim();
    await review.save();
    await recalcMessRating(mess._id);
    const populated = await Review.findById(review._id).populate('user', 'name email role');
    return res.status(200).json({ success: true, message: 'Review updated successfully.', data: populated });
  }

  review = await Review.create({ mess: messId, user: req.user._id, rating: Number(rating), comment: String(comment).trim() });
  await recalcMessRating(mess._id);
  const populated = await Review.findById(review._id).populate('user', 'name email role');
  res.status(201).json({ success: true, message: 'Review submitted successfully.', data: populated });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  if (String(review.user) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'You can only edit your own review.' });
  }
  if (req.body.rating !== undefined) review.rating = Number(req.body.rating);
  if (req.body.comment !== undefined) review.comment = String(req.body.comment).trim();
  await review.save();
  await recalcMessRating(review.mess);
  const populated = await Review.findById(review._id).populate('user', 'name email role');
  res.json({ success: true, message: 'Review updated successfully.', data: populated });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
  const isAuthor = String(review.user) === String(req.user._id);
  const isOwnerRole = req.user.role === 'owner';
  const isAdmin = req.user.role === 'admin';
  if (!isAuthor && !isOwnerRole && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
  }
  const messId = review.mess;
  await review.deleteOne();
  await recalcMessRating(messId);
  res.json({ success: true, message: 'Review deleted successfully.' });
});

module.exports = { getMessReviews, createReview, updateReview, deleteReview, recalcMessRating };
