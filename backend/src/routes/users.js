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
  getPublicProfile,
  blockUser,
  unblockUser,
  getBlockedUsers,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/providers/nearby', protect, getNearbyProviders);
router.get('/me/stats', protect, getMyStats);
router.get('/me/blocked', protect, getBlockedUsers);
router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id/public', protect, getPublicProfile);
router.get('/:id', protect, getUserProfile);
router.patch('/me', protect, updateProfile);
router.patch('/me/availability', protect, toggleAvailability);
router.patch('/me/location', protect, updateLocation);
router.post('/:id/block', protect, blockUser);
router.delete('/:id/block', protect, unblockUser);

module.exports = router;
