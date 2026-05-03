const User = require('../models/User');
const Order = require('../models/Order');

/**
 * Find available providers near a location
 * @param {[number, number]} coordinates - [lng, lat]
 * @param {number} maxDistance - in meters
 */
const findNearbyProviders = async (coordinates, maxDistance = 5000) => {
  try {
    return await User.find({
      isAvailable: true,
      role: 'student',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates },
          $maxDistance: maxDistance,
        },
      },
    })
      .select('+fcmToken')
      .limit(20);
  } catch (error) {
    console.error('findNearbyProviders error:', error.message);
    return [];
  }
};

/**
 * Suggest a smart price for an order based on category and past data
 * @param {string} category
 * @param {string} description
 */
const suggestPrice = async (category, description) => {
  try {
    const recentOrders = await Order.find({
      category,
      status: 'COMPLETED',
      finalPrice: { $exists: true, $gt: 0 },
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .select('finalPrice')
      .limit(50);

    if (!recentOrders.length) {
      const defaults = { food: 60, print: 20, notes: 30, ride: 40, others: 50 };
      return defaults[category] || 50;
    }

    const prices = recentOrders.map((o) => o.finalPrice);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return Math.round(avg);
  } catch (error) {
    return 50;
  }
};

/**
 * Calculate reliability score change based on order outcome
 */
const updateReliabilityScore = async (userId, orderCompleted) => {
  try {
    const delta = orderCompleted ? 1 : -5;
    const user = await User.findById(userId);
    if (!user) return;
    user.reliabilityScore = Math.max(0, Math.min(100, user.reliabilityScore + delta));
    await user.save();
  } catch (error) {
    console.error('updateReliabilityScore error:', error.message);
  }
};

module.exports = { findNearbyProviders, suggestPrice, updateReliabilityScore };
