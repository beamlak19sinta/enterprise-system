const express = require('express');
const router = express.Router();
const { Supplier, Purchase } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
const genId = () => `SUP-${Date.now().toString(36).toUpperCase()}`;

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||20;
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) { const r = new RegExp(req.query.search, 'i'); filter.$or = [{ companyName: r }, { email: r }, { contactPerson: r }]; }
    const [suppliers, total] = await Promise.all([Supplier.find(filter).sort('-createdAt').skip((page-1)*limit).limit(limit), Supplier.countDocuments(filter)]);
    res.json({ status: 'success', data: { suppliers, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const s = await Supplier.findById(req.params.id);
    if (!s) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    const recent = await Purchase.find({ supplier: req.params.id }).sort('-createdAt').limit(10).select('purchaseNumber total status paymentStatus createdAt');
    res.json({ status: 'success', data: { supplier: s, recentPurchases: recent } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/:id/purchases', async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||10;
    const [purchases, total] = await Promise.all([Purchase.find({ supplier: req.params.id }).sort('-createdAt').skip((page-1)*limit).limit(limit), Purchase.countDocuments({ supplier: req.params.id })]);
    res.json({ status: 'success', data: { purchases, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/', authorize('super_admin','inventory_manager'), async (req, res) => {
  try {
    const existing = await Supplier.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ status: 'fail', message: 'Email already exists.' });
    const s = await Supplier.create({ ...req.body, supplierId: genId() });
    res.status(201).json({ status: 'success', data: { supplier: s } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id', authorize('super_admin','inventory_manager'), async (req, res) => {
  try {
    const s = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    res.json({ status: 'success', data: { supplier: s } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.delete('/:id', authorize('super_admin'), async (req, res) => {
  try {
    const count = await Purchase.countDocuments({ supplier: req.params.id });
    if (count > 0) { await Supplier.findByIdAndUpdate(req.params.id, { isActive: false }); return res.json({ status: 'success', message: 'Supplier deactivated.' }); }
    await Supplier.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'Deleted.' });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
