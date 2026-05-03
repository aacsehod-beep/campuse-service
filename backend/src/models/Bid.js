const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Bid price is required'],
      min: [1, 'Bid price must be at least 1'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [300, 'Message cannot exceed 300 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    estimatedTime: {
      type: Number, // in minutes
      min: 1,
    },
  },
  { timestamps: true }
);

bidSchema.index({ orderId: 1 });
bidSchema.index({ userId: 1 });
bidSchema.index({ orderId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);
