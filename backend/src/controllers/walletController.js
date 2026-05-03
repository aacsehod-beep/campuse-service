const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');

// @route   GET /api/wallet
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');
    const transactions = await WalletTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      wallet: {
        balance: user.walletBalance,
        transactions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wallet' });
  }
};

// @route   POST /api/wallet/add
exports.addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum top-up amount is ₹10' });
    }

    const user = await User.findById(req.user._id);
    user.walletBalance += parseFloat(amount);
    await user.save();

    const transaction = await WalletTransaction.create({
      userId: req.user._id,
      type: 'credit',
      amount: parseFloat(amount),
      description: 'Wallet top-up',
      balanceAfter: user.walletBalance,
    });

    res.json({
      success: true,
      message: `₹${amount} added to wallet`,
      balance: user.walletBalance,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add funds' });
  }
};

// @route   GET /api/wallet/earnings
exports.getEarnings = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    const earnings = await WalletTransaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          type: 'credit',
          createdAt: { $gte: daysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalEarnings = await WalletTransaction.aggregate([
      { $match: { userId: req.user._id, type: 'credit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      earnings,
      totalEarnings: totalEarnings[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch earnings' });
  }
};
