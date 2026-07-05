const express = require('express');
const router = express.Router();
const { Performance, Employee } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/', authorize('super_admin', 'hr_manager'), async (req, res) => {
  try {
    const reviews = await Performance.find().populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName avatar' } }).populate('reviewedBy', 'firstName lastName').sort('-createdAt');
    res.json({ status: 'success', data: { reviews } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/my', async (req, res) => {
  try {
    const emp = await Employee.findOne({ user: req.user.id });
    const reviews = emp ? await Performance.find({ employee: emp._id }).sort('-createdAt') : [];
    res.json({ status: 'success', data: { reviews } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await Performance.findById(req.params.id).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName avatar' } }).populate('reviewedBy', 'firstName lastName');
    if (!r) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    res.json({ status: 'success', data: { review: r } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/', authorize('super_admin', 'hr_manager'), async (req, res) => {
  try {
    const r = await Performance.create({ ...req.body, reviewedBy: req.user.id });
    res.status(201).json({ status: 'success', data: { review: r } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id', authorize('super_admin', 'hr_manager'), async (req, res) => {
  try {
    const r = await Performance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!r) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    res.json({ status: 'success', data: { review: r } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
