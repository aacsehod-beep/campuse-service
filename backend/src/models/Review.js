const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

reviewSchema.index({ toUser: 1 });
reviewSchema.index({ fromUser: 1 });
reviewSchema.index({ orderId: 1 });
// Prevent duplicate reviews per order per user
reviewSchema.index({ fromUser: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
