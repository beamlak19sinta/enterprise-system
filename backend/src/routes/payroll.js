const express = require('express');
const router = express.Router();
const { Payroll, Employee, Notification } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/summary', authorize('super_admin','finance_manager','hr_manager'), async (req, res) => {
  try {
    const month = parseInt(req.query.month)||new Date().getMonth()+1, year = parseInt(req.query.year)||new Date().getFullYear();
    const summary = await Payroll.aggregate([{ $match: { 'period.month': month, 'period.year': year } }, { $group: { _id: '$status', count: { $sum: 1 }, totalNet: { $sum: '$netSalary' }, totalGross: { $sum: '$grossSalary' } } }]);
    res.json({ status: 'success', data: { summary, period: { month, year } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||20;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.month) filter['period.month'] = parseInt(req.query.month);
    if (req.query.year) filter['period.year'] = parseInt(req.query.year);
    if (req.user.role === 'employee') { const emp = await Employee.findOne({ user: req.user.id }); if (emp) filter.employee = emp._id; }
    const [payrolls, total] = await Promise.all([Payroll.find(filter).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName avatar' } }).populate('approvedBy','firstName lastName').sort('-period.year -period.month').skip((page-1)*limit).limit(limit), Payroll.countDocuments(filter)]);
    res.json({ status: 'success', data: { payrolls, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/generate', authorize('super_admin','finance_manager','hr_manager'), async (req, res) => {
  try {
    const { month, year, employeeId, bonus = 0 } = req.body;
    const employees = employeeId ? [await Employee.findById(employeeId)] : await Employee.find({ employmentStatus: 'active' });
    const generated = [];
    for (const emp of employees.filter(Boolean)) {
      const existing = await Payroll.findOne({ employee: emp._id, 'period.month': month, 'period.year': year });
      if (existing) continue;
      const gross = emp.salary.base + bonus;
      const tax = gross * 0.2;
      const net = gross - tax;
      const p = await Payroll.create({ employee: emp._id, period: { month, year }, basicSalary: emp.salary.base, bonus, grossSalary: gross, netSalary: net, tax, currency: emp.salary.currency || 'USD', deductions: [{ name: 'Income Tax', amount: tax }], status: 'pending' });
      generated.push(p);
    }
    res.status(201).json({ status: 'success', data: { generated: generated.length, payrolls: generated } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id/approve', authorize('super_admin','finance_manager'), async (req, res) => {
  try {
    const p = await Payroll.findById(req.params.id).populate({ path: 'employee', populate: { path: 'user', select: '_id' } });
    if (!p) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    if (p.status !== 'pending') return res.status(400).json({ status: 'fail', message: `Payroll is ${p.status}.` });
    p.status = 'approved'; p.approvedBy = req.user.id; await p.save();
    const uid = p.employee?.user?._id;
    if (uid) await Notification.create({ recipient: uid, title: 'Payroll Approved', message: `Your payroll for ${p.period.month}/${p.period.year} approved.`, type: 'success', category: 'payroll' });
    res.json({ status: 'success', data: { payroll: p } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id/pay', authorize('super_admin','finance_manager'), async (req, res) => {
  try {
    const p = await Payroll.findById(req.params.id).populate({ path: 'employee', populate: { path: 'user', select: '_id' } });
    if (!p) return res.status(404).json({ status: 'fail', message: 'Not found.' });
    if (p.status !== 'approved') return res.status(400).json({ status: 'fail', message: 'Must be approved first.' });
    p.status = 'paid'; p.paymentDate = new Date(); p.paymentMethod = req.body.paymentMethod || 'bank_transfer'; await p.save();
    const uid = p.employee?.user?._id;
    if (uid) await Notification.create({ recipient: uid, title: 'Salary Paid!', message: `Your salary for ${p.period.month}/${p.period.year} processed.`, type: 'success', category: 'payroll', priority: 'high' });
    res.json({ status: 'success', data: { payroll: p } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
