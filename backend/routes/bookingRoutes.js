const express = require('express');
const { protect } = require('../middleware/auth');
const { getMyBookings, updateBookingStatus } = require('../controllers/bookingController');

const router = express.Router();

router.get('/mine', protect, getMyBookings);
router.patch('/:id/status', protect, updateBookingStatus);

module.exports = router;
