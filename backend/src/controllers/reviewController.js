const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');

// @route   POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { toUser, orderId, rating, comment } = req.body;

    if (!toUser || !orderId || !rating) {
      return res.status(400).json({ success: false, message: 'toUser, orderId, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const order = await Order.findById(orderId);
    if (!order || order.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Can only review completed orders' });
    }

    // Verify reviewer is part of the order
    const isCustomer = order.userId.toString() === req.user._id.toString();
    const isProvider = order.assignedTo?.toString() === req.user._id.toString();
    if (!isCustomer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Not authorized to review this order' });
    }

    if (req.user._id.toString() === toUser) {
      return res.status(400).json({ success: false, message: 'Cannot review yourself' });
    }

    const review = await Review.create({
      fromUser: req.user._id,
      toUser,
      orderId,
      rating: parseInt(rating),
      comment: comment?.trim(),
    });

    // Update user rating
    const targetUser = await User.findById(toUser);
    if (targetUser) {
      targetUser.updateRating(parseInt(rating));
      await targetUser.save();
    }

    // Mark reviewed
    if (isCustomer) order.isReviewedByCustomer = true;
    if (isProvider) order.isReviewedByProvider = true;
    await order.save();

    await review.populate('fromUser', 'name avatar rating');

    res.status(201).json({ success: true, message: 'Review submitted', review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this order' });
    }
    console.error('Review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};

// @route   GET /api/reviews/:userId
exports.getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reviews = await Review.find({ toUser: req.params.userId })
      .populate('fromUser', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ toUser: req.params.userId });

    res.json({ success: true, reviews, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};
