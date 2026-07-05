const express = require('express');
const router = express.Router();
const { User, Customer, Supplier, Product, Order, Employee } = require('../models');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json({ status: 'success', data: { results: [] } });
    const r = new RegExp(q, 'i');
    const limit = 5;
    const [customers, suppliers, products, orders, employees] = await Promise.all([
      Customer.find({ $or: [{ firstName: r }, { lastName: r }, { companyName: r }, { email: r }] }).limit(limit).select('firstName lastName companyName email type'),
      Supplier.find({ $or: [{ companyName: r }, { email: r }] }).limit(limit).select('companyName email'),
      Product.find({ $or: [{ name: r }, { sku: r }] }).limit(limit).select('name sku sellingPrice'),
      Order.find({ orderNumber: r }).limit(limit).select('orderNumber total orderStatus createdAt').populate('customer', 'firstName lastName companyName'),
      Employee.find().populate({ path: 'user', match: { $or: [{ firstName: r }, { lastName: r }, { email: r }] }, select: 'firstName lastName email avatar' }).limit(limit),
    ]);
    const results = [
      ...employees.filter(e => e.user).map(e => ({ type: 'employee', data: e.user, url: `/employees/${e._id}` })),
      ...customers.map(c => ({ type: 'customer', data: c, url: `/customers/${c._id}` })),
      ...suppliers.map(s => ({ type: 'supplier', data: s, url: `/suppliers/${s._id}` })),
      ...products.map(p => ({ type: 'product', data: p, url: `/inventory/products/${p._id}` })),
      ...orders.map(o => ({ type: 'order', data: o, url: `/sales/orders/${o._id}` })),
    ];
    res.json({ status: 'success', data: { results, query: q } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
