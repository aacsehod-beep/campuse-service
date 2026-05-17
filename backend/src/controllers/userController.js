const User = require('../models/User');
const Order = require('../models/Order');
const Service = require('../models/Service');

// @route   GET /api/users/:id
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -fcmToken -isBanned');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// @route   PATCH /api/users/me
exports.updateProfile = async (req, res) => {
  try {
    const { name, hostel, phone, avatar } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (hostel !== undefined) updates.hostel = hostel.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -fcmToken');

    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// @route   PATCH /api/users/me/availability
exports.toggleAvailability = async (req, res) => {
  try {
    const { isAvailable, location } = req.body;

    const updates = { isAvailable };
    if (location?.coordinates) {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])],
      };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -fcmToken');

    const io = req.app.get('io');
    io.emit('provider_availability_change', {
      userId: req.user._id,
      isAvailable,
    });

    res.json({ success: true, message: `You are now ${isAvailable ? 'available' : 'unavailable'}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update availability' });
  }
};

// @route   PATCH /api/users/me/location
exports.updateLocation = async (req, res) => {
  try {
    const { lng, lat } = req.body;
    if (!lng || !lat) {
      return res.status(400).json({ success: false, message: 'Coordinates required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
    });

    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update location' });
  }
};

// @route   GET /api/users/providers/nearby
exports.getNearbyProviders = async (req, res) => {
  try {
    const { lat, lng, radius = 3000, category } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const providers = await User.find({
      isAvailable: true,
      role: 'student',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      },
    })
      .select('name avatar rating completedOrders hostel isAvailable location')
      .limit(20);

    res.json({ success: true, providers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch providers' });
  }
};

// @route   GET /api/users  (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 30, search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password -fcmToken')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// @route   GET /api/users/me/stats
exports.getMyStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [asCustomer, asProvider] = await Promise.all([
      Order.countDocuments({ userId, status: 'COMPLETED' }),
      Order.countDocuments({ assignedTo: userId, status: 'COMPLETED' }),
    ]);

    const earnings = await Order.aggregate([
      { $match: { assignedTo: userId, status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$finalPrice' } } },
    ]);

    res.json({
      success: true,
      stats: {
        ordersAsCustomer: asCustomer,
        ordersAsProvider: asProvider,
        totalEarnings: earnings[0]?.total || 0,
        rating: req.user.rating,
        reliabilityScore: req.user.reliabilityScore,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// @route   POST /api/users/:id/block
exports.blockUser = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot block yourself' });
    }
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedUsers: targetId },
    });
    res.json({ success: true, message: `${target.name} has been blocked` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to block user' });
  }
};

// @route   DELETE /api/users/:id/block
exports.unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedUsers: req.params.id },
    });
    res.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unblock user' });
  }
};

// @route   GET /api/users/:id/public — public profile with services
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name avatar rating totalRatings completedOrders hostel isAvailable createdAt'
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const services = await Service.find({ userId: req.params.id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, user, services });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch public profile' });
  }
};

// @route   GET /api/users/me/blocked
exports.getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('blockedUsers')
      .populate('blockedUsers', 'name avatar hostel');
    res.json({ success: true, blockedUsers: user?.blockedUsers || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch blocked users' });
  }
};
