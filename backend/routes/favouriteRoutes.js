const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { getMyFavourites } = require('../controllers/favouriteController');

const router = express.Router();

router.get('/mine', protect, authorize('student'), getMyFavourites);

module.exports = router;
