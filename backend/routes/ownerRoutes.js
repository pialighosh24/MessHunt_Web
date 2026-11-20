const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getOwnerDashboard, getOwnerReviews } = require('../controllers/ownerController');

const router = express.Router();

router.get('/dashboard', protect, authorize('owner'), getOwnerDashboard);
router.get('/reviews', protect, authorize('owner'), getOwnerReviews);

module.exports = router;
