const express = require('express');
const router = express.Router();
const { getWallet, addFunds, getEarnings } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getWallet);
router.post('/add', protect, addFunds);
router.get('/earnings', protect, getEarnings);

module.exports = router;
