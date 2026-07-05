const express = require('express');
const router = express.Router();
const { Customer, Order } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

const genId = () => `CUS-${Date.now().toString(36).toUpperCase()}`;

router.get('/stats', authorize('super_admin','sales_manager'), async (req, res) => {
  try {
    const [byCategory, top] = await Promise.all([Customer.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]), Customer.find({ isActive: true }).sort('-totalRevenue').limit(10).select('firstName lastName companyName email totalRevenue totalOrders category')]);
    res.json({ status: 'success', data: { byCategory, topCustomers: top } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||20;
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.category) filter.category = req.query.category;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.search) { const r = new RegExp(req.query.search, 'i'); filter.$or = [{ firstName: r }, { lastName: r }, { companyName: r }, { email: r }]; }
    const [customers, total] = await Promise.all([Customer.find(filter).sort('-createdAt').skip((page-1)*limit).limit(limit), Customer.countDocuments(filter)]);
    res.json({ status: 'success', data: { customers, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    const recentOrders = await Order.find({ customer: req.params.id }).sort('-createdAt').limit(10).select('orderNumber total orderStatus paymentStatus createdAt');
    res.json({ status: 'success', data: { customer, recentOrders } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/:id/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||10;
    const [orders, total] = await Promise.all([Order.find({ customer: req.params.id }).sort('-createdAt').skip((page-1)*limit).limit(limit), Order.countDocuments({ customer: req.params.id })]);
    res.json({ status: 'success', data: { orders, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/', authorize('super_admin','sales_manager'), async (req, res) => {
  try {
    const existing = await Customer.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ status: 'fail', message: 'Email already exists.' });
    const c = await Customer.create({ ...req.body, customerId: genId() });
    res.status(201).json({ status: 'success', data: { customer: c } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id', authorize('super_admin','sales_manager'), async (req, res) => {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    res.json({ status: 'success', data: { customer: c } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.delete('/:id', authorize('super_admin'), async (req, res) => {
  try {
    const count = await Order.countDocuments({ customer: req.params.id });
    if (count > 0) { await Customer.findByIdAndUpdate(req.params.id, { isActive: false }); return res.json({ status: 'success', message: 'Customer deactivated (has orders).' }); }
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'Deleted.' });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
