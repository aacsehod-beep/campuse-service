const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/:orderId', protect, getMessages);
router.post('/:orderId', protect, sendMessage);

module.exports = router;
