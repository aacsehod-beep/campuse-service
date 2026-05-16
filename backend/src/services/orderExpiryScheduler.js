const cron = require('node-cron');
const Order = require('../models/Order');

/**
 * Starts the order expiry scheduler.
 * Every 5 minutes: cancel BROADCASTED orders that have had no accepted bid for >30 minutes.
 */
const startOrderExpiryScheduler = (io) => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      const expiredOrders = await Order.find({
        status: 'BROADCASTED',
        createdAt: { $lte: cutoff },
      });

      if (expiredOrders.length === 0) return;

      const ids = expiredOrders.map((o) => o._id);

      await Order.updateMany(
        { _id: { $in: ids } },
        {
          $set: { status: 'CANCELLED', cancelReason: 'No provider accepted within 30 minutes' },
          $push: {
            statusHistory: {
              status: 'CANCELLED',
              changedAt: new Date(),
              note: 'Auto-cancelled: no provider accepted within 30 minutes',
            },
          },
        }
      );

      // Notify clients via socket
      expiredOrders.forEach((order) => {
        // Remove from feed for all providers
        io.emit('feed_order_removed', { orderId: order._id.toString() });

        // Notify the customer their order was cancelled
        io.to(`order_${order._id}`).emit('order_update', {
          orderId: order._id.toString(),
          status: 'CANCELLED',
          cancelReason: 'No provider accepted within 30 minutes',
        });
      });

      console.log(`[Scheduler] Auto-cancelled ${expiredOrders.length} expired order(s)`);
    } catch (err) {
      console.error('[Scheduler] Error running order expiry job:', err.message);
    }
  });

  console.log('[Scheduler] Order expiry scheduler started (runs every 5 minutes)');
};

module.exports = { startOrderExpiryScheduler };
