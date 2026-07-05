const express = require('express');
const router = express.Router();
const { Department, Employee } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||50;
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) filter.name = new RegExp(req.query.search, 'i');
    const [departments, total] = await Promise.all([Department.find(filter).populate('manager','firstName lastName email avatar').populate('parentDepartment','name code').sort('name').skip((page-1)*limit).limit(limit), Department.countDocuments(filter)]);
    res.json({ status: 'success', data: { departments, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id).populate('manager','firstName lastName email avatar position').populate('parentDepartment','name code').populate('employees','firstName lastName email avatar');
    if (!dept) return res.status(404).json({ status: 'fail', message: 'Department not found.' });
    const employeeCount = await Employee.countDocuments({ department: req.params.id, employmentStatus: { $ne: 'terminated' } });
    res.json({ status: 'success', data: { department: dept, employeeCount } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/:id/employees', async (req, res) => {
  try {
    const employees = await Employee.find({ department: req.params.id }).populate('user','firstName lastName email avatar phone role').sort('-startDate');
    res.json({ status: 'success', data: { employees } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const existing = await Department.findOne({ $or: [{ name: req.body.name }, { code: req.body.code }] });
    if (existing) return res.status(400).json({ status: 'fail', message: 'Department name or code already exists.' });
    const dept = await Department.create(req.body);
    const populated = await Department.findById(dept._id).populate('manager','firstName lastName email');
    res.status(201).json({ status: 'success', data: { department: populated } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('manager','firstName lastName email');
    if (!dept) return res.status(404).json({ status: 'fail', message: 'Department not found.' });
    res.json({ status: 'success', data: { department: dept } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id/manager', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, { manager: req.body.managerId }, { new: true }).populate('manager','firstName lastName email');
    if (!dept) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    res.json({ status: 'success', data: { department: dept } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.delete('/:id', authorize('super_admin'), async (req, res) => {
  try {
    const count = await Employee.countDocuments({ department: req.params.id });
    if (count > 0) return res.status(400).json({ status: 'fail', message: 'Cannot delete department with employees.' });
    await Department.findByIdAndDelete(req.params.id);
    res.json({ status: 'success', message: 'Department deleted.' });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
