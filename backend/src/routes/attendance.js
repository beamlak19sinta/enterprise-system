const express = require('express');
const router = express.Router();
const { Attendance, Employee } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/my', async (req, res) => {
  try {
    const emp = await Employee.findOne({ user: req.user.id });
    if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee not found.' });
    const month = parseInt(req.query.month) || new Date().getMonth()+1, year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(year, month-1, 1), end = new Date(year, month, 0, 23, 59, 59);
    const attendance = await Attendance.find({ employee: emp._id, date: { $gte: start, $lte: end } }).sort('date');
    const summary = { present: attendance.filter(a=>['present','late'].includes(a.status)).length, absent: attendance.filter(a=>a.status==='absent').length, late: attendance.filter(a=>a.status==='late').length, halfDay: attendance.filter(a=>a.status==='half_day').length, totalHours: attendance.reduce((s,a)=>s+(a.workHours||0),0), overtime: attendance.reduce((s,a)=>s+(a.overtime||0),0) };
    res.json({ status: 'success', data: { attendance, summary } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/check-in', async (req, res) => {
  try {
    const emp = await Employee.findOne({ user: req.user.id });
    if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee not found.' });
    const today = new Date(); today.setHours(0,0,0,0);
    const existing = await Attendance.findOne({ employee: emp._id, date: { $gte: today } });
    if (existing?.checkIn) return res.status(400).json({ status: 'fail', message: 'Already checked in.' });
    const now = new Date(), workStart = new Date(); workStart.setHours(9,0,0,0);
    const status = now > workStart ? 'late' : 'present';
    const attendance = existing ? await Attendance.findByIdAndUpdate(existing._id, { checkIn: now, status }, { new: true }) : await Attendance.create({ employee: emp._id, date: today, checkIn: now, status });
    res.json({ status: 'success', data: { attendance } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/check-out', async (req, res) => {
  try {
    const emp = await Employee.findOne({ user: req.user.id });
    if (!emp) return res.status(404).json({ status: 'fail', message: 'Employee not found.' });
    const today = new Date(); today.setHours(0,0,0,0);
    const attendance = await Attendance.findOne({ employee: emp._id, date: { $gte: today } });
    if (!attendance?.checkIn) return res.status(400).json({ status: 'fail', message: 'Not checked in.' });
    if (attendance.checkOut) return res.status(400).json({ status: 'fail', message: 'Already checked out.' });
    const updated = await Attendance.findByIdAndUpdate(attendance._id, { checkOut: new Date() }, { new: true });
    res.json({ status: 'success', data: { attendance: updated } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page)||1, limit = parseInt(req.query.limit)||30;
    const filter = {};
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.month && req.query.year) { const s = new Date(req.query.year, req.query.month-1, 1), e = new Date(req.query.year, req.query.month, 0, 23, 59, 59); filter.date = { $gte: s, $lte: e }; }
    const [attendance, total] = await Promise.all([Attendance.find(filter).populate({ path: 'employee', populate: { path: 'user', select: 'firstName lastName avatar' } }).sort('-date').skip((page-1)*limit).limit(limit), Attendance.countDocuments(filter)]);
    res.json({ status: 'success', data: { attendance, pagination: { total, page, limit, pages: Math.ceil(total/limit) } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/', authorize('super_admin','hr_manager'), async (req, res) => {
  try { const a = await Attendance.create({ ...req.body, approvedBy: req.user.id }); res.status(201).json({ status: 'success', data: { attendance: a } }); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/:id', authorize('super_admin','hr_manager'), async (req, res) => {
  try { const a = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true }); res.json({ status: 'success', data: { attendance: a } }); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
