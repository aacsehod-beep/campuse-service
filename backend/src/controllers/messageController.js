const Message = require('../models/Message');
const Order = require('../models/Order');

// @route   GET /api/messages/:orderId
exports.getMessages = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Chat is closed for completed or cancelled orders',
      });
    }

    const isParticipant =
      order.userId.toString() === req.user._id.toString() ||
      order.assignedTo?.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const messages = await Message.find({ orderId: req.params.orderId })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark messages as read
    await Message.updateMany(
      { orderId: req.params.orderId, senderId: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

// @route   POST /api/messages/:orderId
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isParticipant =
      order.userId.toString() === req.user._id.toString() ||
      order.assignedTo?.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const message = await Message.create({
      orderId: req.params.orderId,
      senderId: req.user._id,
      content: content.trim(),
      readBy: [req.user._id],
    });

    await message.populate('senderId', 'name avatar');

    const io = req.app.get('io');
    io.to(`order_${req.params.orderId}`).emit('new_message', { message, orderId: req.params.orderId });

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};
