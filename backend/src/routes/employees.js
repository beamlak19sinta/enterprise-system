const express = require('express');
const router = express.Router();
const { Employee, User, Department } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const genId = () => `EMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;

router.use(authenticate);

router.get('/stats', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const [total, active, byDept, byStatus] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ employmentStatus: 'active' }),
      Employee.aggregate([{ $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'd' } }, { $unwind: '$d' }, { $group: { _id: '$d.name', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Employee.aggregate([{ $group: { _id: '$employmentStatus', count: { $sum: 1 } } }]),
    ]);
    res.json({ status: 'success', data: { total, active, byDept, byStatus } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/profile', async (req, res) => {
  try {
    let emp;
    if (req.user.role === 'employee') emp = await Employee.findOne({ user: req.user.id }).populate('user', '-password -refreshTokens').populate('department', 'name code').populate('manager', 'firstName lastName');
    else emp = await Employee.findOne({ user: req.user.id }).populate('user', '-password -refreshTokens').populate('department', 'name code');
    if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee profile not found.' });
    res.json({ status: 'success', data: { employee: emp } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/', authorize('super_admin','hr_manager','finance_manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1, limit = parseInt(req.query.limit) || 20;
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.employmentStatus) filter.employmentStatus = req.query.employmentStatus;
    const [employees, total] = await Promise.all([
      Employee.find(filter).populate('user','firstName lastName email avatar phone role').populate('department','name code').populate('manager','firstName lastName').sort('-createdAt').skip((page-1)*limit).limit(limit),
      Employee.countDocuments(filter)
    ]);
    res.json({ status: 'success', data: { employees, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/:id', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id).populate('user','-password -refreshTokens').populate('department','name code description').populate('manager','firstName lastName email');
    if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee not found.' });
    res.json({ status: 'success', data: { employee: emp } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department, position, salary, startDate, employmentType, ...rest } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ status: 'fail', message: 'Email already exists.' });
    const user = await User.create({ firstName, lastName, email, password: password || 'TempPass@123', role: role || 'employee', department, position, isEmailVerified: true });
    const employee = await Employee.create({ user: user._id, employeeId: genId(), department, position, salary: salary || { base: 0, currency: 'USD', paymentFrequency: 'monthly' }, startDate: startDate || new Date(), employmentType: employmentType || 'full_time', ...rest });
    await Department.findByIdAndUpdate(department, { $addToSet: { employees: user._id } });
    const populated = await Employee.findById(employee._id).populate('user','firstName lastName email role').populate('department','name code');
    res.status(201).json({ status: 'success', data: { employee: populated } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee not found.' });
    const { firstName, lastName, email, phone, avatar, role, ...empData } = req.body;
    if (firstName || lastName || email || phone || avatar || role) await User.findByIdAndUpdate(emp.user, { firstName, lastName, email, phone, avatar, role }, { runValidators: true });
    const updated = await Employee.findByIdAndUpdate(req.params.id, empData, { new: true, runValidators: true }).populate('user','firstName lastName email avatar phone role').populate('department','name code').populate('manager','firstName lastName');
    res.json({ status: 'success', data: { employee: updated } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.delete('/:id', authorize('super_admin'), async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee not found.' });
    await User.findByIdAndUpdate(emp.user, { isActive: false });
    await Employee.findByIdAndUpdate(req.params.id, { employmentStatus: 'terminated', endDate: new Date() });
    res.json({ status: 'success', message: 'Employee terminated.' });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
