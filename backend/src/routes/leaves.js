const express = require('express');
const router = express.Router();
const { Leave, Employee, User, Notification } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.leaveType) filter.leaveType = req.query.leaveType;
    if (req.user.role === 'employee') { const emp = await Employee.findOne({ user: req.user.id }); if (emp) filter.employee = emp._id; }
    const [leaves, total] = await Promise.all([Leave.find(filter).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName avatar' } }).populate('approvedBy','firstName lastName').sort('-createdAt').skip((page-1)*limit).limit(limit), Leave.countDocuments(filter)]);
    res.json({ status: 'success', data: { leaves, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName email avatar' } }).populate('approvedBy','firstName lastName');
    if (!leave) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    res.json({ status: 'success', data: { leave } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const emp = req.user.role === 'employee' ? await Employee.findOne({ user: req.user.id }) : await Employee.findById(req.body.employee);
    if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee not found.' });
    const leave = await Leave.create({ ...req.body, employee: emp._id });
    const io = req.app.get('io');
    const managers = await User.find({ role: 'hr_manager', isActive: true }).select('_id');
    for (const m of managers) {
      await Notification.create({ recipient: m._id, title: 'New Leave Request', message: `A new ${req.body.leaveType} leave request submitted.`, type: 'info', category: 'leave', link: `/leaves/${leave._id}` });
      io?.to(`user-${m._id}`).emit('notification', { title: 'New Leave Request', message: `A new ${req.body.leaveType} leave request submitted.` });
    }
    res.status(201).json({ status: 'success', data: { leave } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id/approve', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate({ path: 'employee', populate: { path: 'user', select: '_id' } });
    if (!leave) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ status: 'fail', message: `Leave is ${leave.status}.` });
    leave.status = 'approved'; leave.approvedBy = req.user.id; leave.approvedAt = new Date();
    await leave.save();
    const empUserId = leave.employee?.user?._id;
    if (empUserId) { await Notification.create({ recipient: empUserId, title: 'Leave Approved!', message: `Your ${leave.leaveType} leave has been approved.`, type: 'success', category: 'leave' }); req.app.get('io')?.to(`user-${empUserId}`).emit('notification', { title: 'Leave Approved!' }); }
    res.json({ status: 'success', data: { leave } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id/reject', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate({ path: 'employee', populate: { path: 'user', select: '_id' } });
    if (!leave) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    leave.status = 'rejected'; leave.approvedBy = req.user.id; leave.approvedAt = new Date(); leave.rejectionReason = req.body.reason;
    await leave.save();
    const empUserId = leave.employee?.user?._id;
    if (empUserId) await Notification.create({ recipient: empUserId, title: 'Leave Rejected', message: `Your ${leave.leaveType} leave was rejected. Reason: ${req.body.reason}`, type: 'error', category: 'leave' });
    res.json({ status: 'success', data: { leave } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id/cancel', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    if (leave.status !== 'pending') return res.status(400).json({ status: 'fail', message: 'Only pending leaves can be cancelled.' });
    leave.status = 'cancelled'; await leave.save();
    res.json({ status: 'success', data: { leave } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
