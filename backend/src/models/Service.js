const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: true,
      enum: ['food', 'print', 'notes', 'ride', 'assessment', 'project', 'coaching', 'design', 'event', 'marketplace', 'others'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceType: {
      type: String,
      enum: ['fixed', 'starting_from', 'per_hour', 'negotiable'],
      default: 'fixed',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{ type: String, trim: true }],
    deliveryTime: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ userId: 1, isActive: 1 });
serviceSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);
