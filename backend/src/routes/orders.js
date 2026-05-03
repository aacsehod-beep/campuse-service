const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  acceptOrder,
  getMyOrders,
} = require('../controllers/orderController');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getOrders);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.post('/', protect, createOrder);
router.patch('/:id/status', protect, updateOrderStatus);
router.post('/:id/accept', protect, acceptOrder);

// Chat routes (alias to messages)
router.get('/:id/chat', protect, (req, res, next) => {
  req.params.orderId = req.params.id;
  next();
}, getMessages);
router.post('/:id/chat', protect, (req, res, next) => {
  req.params.orderId = req.params.id;
  // map 'message' field to 'content' expected by sendMessage controller
  if (req.body.message && !req.body.content) req.body.content = req.body.message;
  next();
}, sendMessage);

module.exports = router;
