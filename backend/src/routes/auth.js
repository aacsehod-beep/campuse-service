const express = require('express');
const router = express.Router();
const { register, login, getMe, updateFcmToken, refreshToken } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);
router.get('/me', protect, getMe);
router.post('/fcm-token', protect, updateFcmToken);

module.exports = router;
