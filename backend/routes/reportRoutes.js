const express = require('express');
const { protect } = require('../middleware/auth');
const { createReport, getMyReports } = require('../controllers/reportController');

const router = express.Router();

router.post('/', protect, createReport);
router.get('/mine', protect, getMyReports);

module.exports = router;
