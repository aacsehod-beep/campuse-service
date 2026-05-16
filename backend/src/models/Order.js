const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['food', 'print', 'notes', 'ride', 'assessment', 'project', 'coaching', 'design', 'event', 'marketplace', 'others'],
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    budget: {
      type: Number,
      min: 0,
    },
    mode: {
      type: String,
      enum: ['fixed', 'bidding'],
      required: [true, 'Mode is required'],
    },
    status: {
      type: String,
      enum: [
        'CREATED',
        'BROADCASTED',
        'ACCEPTED',
        'BID_SELECTED',
        'IN_PROGRESS',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'CREATED',
    },
    urgency: {
      type: String,
      enum: ['normal', 'asap'],
      default: 'normal',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: {
        type: String,
        trim: true,
      },
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    finalPrice: {
      type: Number,
      min: 0,
    },
    isPriorityBoosted: {
      type: Boolean,
      default: false,
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    completedAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
    },
    isReviewedByCustomer: {
      type: Boolean,
      default: false,
    },
    isReviewedByProvider: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ location: '2dsphere' });
orderSchema.index({ status: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ assignedTo: 1 });
orderSchema.index({ category: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for bids
orderSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'orderId',
});

orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
