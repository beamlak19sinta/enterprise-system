const express = require('express');
const router = express.Router();
const { Product, Category, Warehouse, User, Notification } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/stats', async (req, res) => {
  try {
    const [total, lowStock, val, byCat] = await Promise.all([Product.countDocuments({ isActive: true }), Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock.available', '$stock.reorderPoint'] } }), Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: null, totalCost: { $sum: { $multiply: ['$stock.quantity', '$costPrice'] } }, totalSelling: { $sum: { $multiply: ['$stock.quantity', '$sellingPrice'] } } } }]), Product.aggregate([{ $match: { isActive: true } }, { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } }, { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } }, { $group: { _id: { $ifNull: ['$cat.name', 'Uncategorized'] }, count: { $sum: 1 }, value: { $sum: { $multiply: ['$stock.quantity', '$sellingPrice'] } } } }, { $sort: { count: -1 } }])]);
    res.json({ status: 'success', data: { totalProducts: total, lowStockCount: lowStock, totalValue: val[0] || { totalCost: 0, totalSelling: 0 }, byCategory: byCat } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, $expr: { $lte: ['$stock.available', '$stock.reorderPoint'] } }).populate('category','name').populate('supplier','companyName email').sort('stock.available').limit(50);
    res.json({ status: 'success', data: { products, count: products.length } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

// Products
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||20;
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true'; else filter.isActive = true;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.lowStock === 'true') filter.$expr = { $lte: ['$stock.available', '$stock.reorderPoint'] };
    if (req.query.search) { const r = new RegExp(req.query.search, 'i'); filter.$or = [{ name: r }, { sku: r }, { barcode: r }]; }
    const [products, total] = await Promise.all([Product.find(filter).populate('category','name slug').populate('supplier','companyName').populate('warehouse','name code').sort(req.query.sort || '-createdAt').skip((page-1)*limit).limit(limit), Product.countDocuments(filter)]);
    res.json({ status: 'success', data: { products, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).populate('category','name slug').populate('supplier','companyName email phone').populate('warehouse','name code address');
    if (!p) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    res.json({ status: 'success', data: { product: p } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/products', authorize('super_admin','inventory_manager'), async (req, res) => {
  try {
    const existing = await Product.findOne({ sku: req.body.sku });
    if (existing) return res.status(400).json({ status: 'fail', message: 'SKU already exists.' });
    const qty = req.body.stock?.quantity || 0;
    const p = await Product.create({ ...req.body, 'stock.available': qty });
    res.status(201).json({ status: 'success', data: { product: p } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/products/:id', authorize('super_admin','inventory_manager'), async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category','name').populate('supplier','companyName');
    if (!p) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    res.json({ status: 'success', data: { product: p } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.delete('/products/:id', authorize('super_admin','inventory_manager'), async (req, res) => {
  try { await Product.findByIdAndUpdate(req.params.id, { isActive: false }); res.json({ status: 'success', message: 'Product deactivated.' }); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/products/:id/stock', authorize('super_admin','inventory_manager'), async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    const newQty = p.stock.quantity + req.body.adjustment;
    if (newQty < 0) return res.status(400).json({ status: 'fail', message: 'Stock cannot be negative.' });
    p.stock.quantity = newQty; p.stock.available = Math.max(0, newQty - p.stock.reserved);
    await p.save();
    if (p.stock.available <= p.stock.reorderPoint) {
      const managers = await User.find({ role: { $in: ['inventory_manager','super_admin'] }, isActive: true }).select('_id');
      for (const m of managers) await Notification.create({ recipient: m._id, title: 'Low Stock Alert', message: `${p.name} (${p.sku}) is low. Available: ${p.stock.available}`, type: 'warning', category: 'inventory', priority: 'high' });
    }
    res.json({ status: 'success', data: { product: p } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

// Categories
router.get('/categories', async (req, res) => {
  try { const cats = await Category.find({ isActive: true }).populate('parent','name').sort('name'); res.json({ status: 'success', data: { categories: cats } }); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/categories', authorize('super_admin','inventory_manager'), async (req, res) => {
  try { const c = await Category.create(req.body); res.status(201).json({ status: 'success', data: { category: c } }); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/categories/:id', authorize('super_admin','inventory_manager'), async (req, res) => {
  try { const c = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!c) return res.status(404).json({ status: 'fail', message: 'Not found.' }); res.json({ status: 'success', data: { category: c } }); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.delete('/categories/:id', authorize('super_admin'), async (req, res) => {
  try {
    const count = await Product.countDocuments({ category: req.params.id });
    if (count > 0) return res.status(400).json({ status: 'fail', message: 'Category has products.' });
    await Category.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'Deleted.' });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

// Warehouses
router.get('/warehouses', async (req, res) => {
  try { const wh = await Warehouse.find({ isActive: true }).populate('manager','firstName lastName').sort('name'); res.json({ status: 'success', data: { warehouses: wh } }); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/warehouses', authorize('super_admin','inventory_manager'), async (req, res) => {
  try { const wh = await Warehouse.create(req.body); res.status(201).json({ status: 'success', data: { warehouse: wh } }); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/warehouses/:id', authorize('super_admin','inventory_manager'), async (req, res) => {
  try { const wh = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!wh) return res.status(404).json({ status: 'fail', message: 'Not found.' }); res.json({ status: 'success', data: { warehouse: wh } }); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
