const express = require('express');
const {
  getUsers,
  createUser,
  toggleUserStatus,
  getDashboardStats,
  getStaffList,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/staff', getStaffList);
router.route('/users').get(getUsers).post(createUser);
router.put('/users/:id/toggle', toggleUserStatus);

module.exports = router;
