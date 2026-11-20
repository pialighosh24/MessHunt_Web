const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
  getDashboardStats, getUsers, updateUserStatus,
  getAllMesses, updateMessApproval,
  getReports, updateReport,
  getAllReviews, moderateReview
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:id', updateUserStatus);
router.get('/messes', getAllMesses);
router.patch('/messes/:id/approval', updateMessApproval);
router.get('/reports', getReports);
router.patch('/reports/:id', updateReport);
router.get('/reviews', getAllReviews);
router.patch('/reviews/:id/moderate', moderateReview);

module.exports = router;
