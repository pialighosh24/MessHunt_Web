const express = require('express');
const { protect } = require('../middleware/auth');
const { getMyBookings, updateBookingStatus, deleteBooking } = require('../controllers/bookingController');

const router = express.Router();

router.get('/mine', protect, getMyBookings);
router.patch('/:id/status', protect, updateBookingStatus);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
