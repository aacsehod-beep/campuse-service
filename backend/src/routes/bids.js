const express = require('express');
const router = express.Router();
const { placeBid, getBids, acceptBid } = require('../controllers/bidController');
const { protect } = require('../middleware/auth');

router.post('/:orderId', protect, placeBid);
router.get('/:orderId', protect, getBids);
router.patch('/:orderId/:bidId/accept', protect, acceptBid);

module.exports = router;
