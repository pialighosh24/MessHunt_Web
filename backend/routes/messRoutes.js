const express = require('express');
const { optionalAuth, protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getPublicMesses, getPublicMessById, getFeaturedMesses, getRecentMesses,
  createMess, getMyMesses, updateMyMess, deleteMyMess, syncLiveLocation
} = require('../controllers/messController');
const { getMessReviews, createReview } = require('../controllers/reviewController');
const { createBooking } = require('../controllers/bookingController');
const { addFavourite, removeFavourite, toggleFavourite } = require('../controllers/favouriteController');

const router = express.Router();

// Public / discovery
router.get('/', optionalAuth, getPublicMesses);
router.get('/featured', getFeaturedMesses);
router.get('/recent', getRecentMesses);

// Owner-specific (must be before /:id)
router.post('/', protect, authorize('owner'), createMess);
router.get('/owner/mine', protect, authorize('owner'), getMyMesses);

// Public details and nested resources
router.get('/:id', optionalAuth, getPublicMessById);
router.post('/:id/live-location', optionalAuth, syncLiveLocation);
router.get('/:messId/reviews', optionalAuth, getMessReviews);

// Student/User actions
router.post('/:messId/reviews', protect, authorize('student', 'owner', 'admin'), createReview);
router.post('/:messId/bookings', protect, authorize('student'), createBooking);
router.post('/:messId/favourite', protect, authorize('student'), addFavourite);
router.delete('/:messId/favourite', protect, authorize('student'), removeFavourite);
router.post('/:messId/favourite/toggle', protect, authorize('student'), toggleFavourite);

// Owner/Admin listing management
router.put('/:id', protect, authorize('owner'), updateMyMess);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteMyMess);

module.exports = router;
