const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getOwnerDashboard, getOwnerBookings, getOwnerReviews, uploadMessImages } = require('../controllers/ownerController');

const router = express.Router();

router.get('/dashboard', protect, authorize('owner'), getOwnerDashboard);
router.get('/bookings', protect, authorize('owner'), getOwnerBookings);
router.get('/reviews', protect, authorize('owner'), getOwnerReviews);
router.post('/upload-image', protect, authorize('owner', 'admin'), uploadMessImages);

module.exports = router;
