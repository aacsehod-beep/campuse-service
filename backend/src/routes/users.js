const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  toggleAvailability,
  updateLocation,
  getNearbyProviders,
  getAllUsers,
  getMyStats,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/providers/nearby', protect, getNearbyProviders);
router.get('/me/stats', protect, getMyStats);
router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id', protect, getUserProfile);
router.patch('/me', protect, updateProfile);
router.patch('/me/availability', protect, toggleAvailability);
router.patch('/me/location', protect, updateLocation);

module.exports = router;
