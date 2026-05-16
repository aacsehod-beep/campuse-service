const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getMyServices,
  getServicesByUser,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

router.get('/', getAllServices);
router.get('/mine', protect, getMyServices);
router.get('/user/:userId', getServicesByUser);
router.get('/:id', getServiceById);
router.post('/', protect, createService);
router.patch('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
