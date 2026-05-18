const Service = require('../models/Service');

// GET /api/services — list all active services (optional category filter)
exports.getAllServices = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    const services = await Service.find(filter)
      .populate('userId', 'name avatar rating completedOrders')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/services/mine — logged-in user's services
exports.getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/services/user/:userId — another user's active services
exports.getServicesByUser = async (req, res) => {
  try {
    const services = await Service.find({ userId: req.params.userId, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/services/:id — single service
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('userId', 'name avatar rating completedOrders hostel');
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/services — create
exports.createService = async (req, res) => {
  try {
    const { title, description, category, price, priceType, tags, deliveryTime } = req.body;
    if (!title || !description || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'title, description, category and price are required' });
    }
    const service = await Service.create({
      userId: req.user._id, title, description, category, price, priceType, tags, deliveryTime,
    });
    res.status(201).json({ success: true, service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/services/:id — update (owner only)
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (service.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const allowed = ['title', 'description', 'category', 'price', 'priceType', 'isActive', 'tags', 'deliveryTime'];
    allowed.forEach((field) => { if (req.body[field] !== undefined) service[field] = req.body[field]; });
    await service.save();
    res.json({ success: true, service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/services/:id — delete (owner only)
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    if (service.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await service.deleteOne();
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
