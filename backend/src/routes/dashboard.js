const express = require('express');
const router = express.Router();
const { Employee, Order, Product, Customer, Transaction, Leave, Notification, AuditLog } = require('../models');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', async (req, res) => {
  try {
    const now = new Date(), ms = new Date(now.getFullYear(), now.getMonth(), 1), lms = new Date(now.getFullYear(), now.getMonth()-1, 1), lme = new Date(now.getFullYear(), now.getMonth(), 0);
    const [totalEmp, activeEmp, totalCust, totalProd, lowStock, pendingOrders, thisMonthOrders, lastMonthOrders, thisIncome, lastIncome, thisExpenses, pendingLeaves] = await Promise.all([
      Employee.countDocuments(), Employee.countDocuments({ employmentStatus: 'active' }),
      Customer.countDocuments({ isActive: true }), Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock.available', '$stock.reorderPoint'] } }),
      Order.countDocuments({ orderStatus: 'pending' }),
      Order.countDocuments({ createdAt: { $gte: ms } }),
      Order.countDocuments({ createdAt: { $gte: lms, $lte: lme } }),
      Transaction.aggregate([{ $match: { type: 'income', status: 'completed', date: { $gte: ms } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { type: 'income', status: 'completed', date: { $gte: lms, $lte: lme } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { type: 'expense', status: 'completed', date: { $gte: ms } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Leave.countDocuments({ status: 'pending' }),
    ]);
    const rev = thisIncome[0]?.total || 0, lastRev = lastIncome[0]?.total || 0, exp = thisExpenses[0]?.total || 0;
    res.json({ status: 'success', data: { employees: { total: totalEmp, active: activeEmp }, revenue: { thisMonth: rev, lastMonth: lastRev, growth: lastRev > 0 ? (((rev-lastRev)/lastRev)*100).toFixed(1) : '0', expenses: exp, profit: rev - exp }, orders: { thisMonth: thisMonthOrders, pending: pendingOrders, growth: lastMonthOrders > 0 ? (((thisMonthOrders-lastMonthOrders)/lastMonthOrders)*100).toFixed(1) : '0' }, customers: { total: totalCust }, products: { total: totalProd, lowStock }, leaves: { pending: pendingLeaves } } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

const getMonthRange = (year, month) => ({ start: new Date(year, month-1, 1), end: new Date(year, month, 0, 23, 59, 59, 999) });

router.get('/charts/revenue', async (req, res) => {
  try {
    const now = new Date();
    const data = await Promise.all(Array.from({length:12},(_,i) => { const d = new Date(now.getFullYear(), now.getMonth()-11+i, 1); return d; }).map(async d => {
      const { start, end } = getMonthRange(d.getFullYear(), d.getMonth()+1);
      const [inc, exp] = await Promise.all([Transaction.aggregate([{$match:{type:'income',status:'completed',date:{$gte:start,$lte:end}}},{$group:{_id:null,total:{$sum:'$amount'}}}]), Transaction.aggregate([{$match:{type:'expense',status:'completed',date:{$gte:start,$lte:end}}},{$group:{_id:null,total:{$sum:'$amount'}}}])]);
      return { month: d.toLocaleString('default',{month:'short',year:'numeric'}), revenue: inc[0]?.total||0, expenses: exp[0]?.total||0, profit: (inc[0]?.total||0)-(exp[0]?.total||0) };
    }));
    res.json({ status: 'success', data: { chart: data } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/charts/sales', async (req, res) => {
  try {
    const now = new Date();
    const data = await Promise.all(Array.from({length:12},(_,i) => new Date(now.getFullYear(), now.getMonth()-11+i, 1)).map(async d => {
      const { start, end } = getMonthRange(d.getFullYear(), d.getMonth()+1);
      const [count, rev] = await Promise.all([Order.countDocuments({createdAt:{$gte:start,$lte:end},orderStatus:{$ne:'cancelled'}}), Order.aggregate([{$match:{createdAt:{$gte:start,$lte:end},orderStatus:{$ne:'cancelled'}}},{$group:{_id:null,total:{$sum:'$total'}}}])]);
      return { month: d.toLocaleString('default',{month:'short'}), orders: count, revenue: rev[0]?.total||0 };
    }));
    res.json({ status: 'success', data: { chart: data } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/charts/employees', async (req, res) => {
  try {
    const now = new Date();
    const data = await Promise.all(Array.from({length:12},(_,i) => new Date(now.getFullYear(), now.getMonth()-11+i+1, 0)).map(async d => ({ month: d.toLocaleString('default',{month:'short',year:'numeric'}), employees: await Employee.countDocuments({startDate:{$lte:d}}) })));
    res.json({ status: 'success', data: { chart: data } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/charts/inventory', async (req, res) => {
  try {
    const data = await Product.aggregate([{$match:{isActive:true}},{$lookup:{from:'categories',localField:'category',foreignField:'_id',as:'cat'}},{$unwind:{path:'$cat',preserveNullAndEmptyArrays:true}},{$group:{_id:{$ifNull:['$cat.name','Uncategorized']},count:{$sum:1},totalStock:{$sum:'$stock.quantity'},value:{$sum:{$multiply:['$stock.quantity','$costPrice']}}}},{$sort:{count:-1}},{$limit:8}]);
    res.json({ status: 'success', data: { chart: data } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/activities', async (req, res) => {
  try {
    const activities = await AuditLog.find().populate('user','firstName lastName avatar role').sort('-createdAt').limit(20).lean();
    res.json({ status: 'success', data: { activities } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/notifications', async (req, res) => {
  try {
    const [notifs, unreadCount] = await Promise.all([Notification.find({recipient:req.user.id}).sort('-createdAt').limit(20).lean(), Notification.countDocuments({recipient:req.user.id,isRead:false})]);
    res.json({ status: 'success', data: { notifications: notifs, unreadCount } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/notifications/read-all', async (req, res) => {
  try { await Notification.updateMany({recipient:req.user.id,isRead:false},{isRead:true,readAt:new Date()}); res.json({status:'success',message:'All read.'}); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try { await Notification.findOneAndUpdate({_id:req.params.id,recipient:req.user.id},{isRead:true,readAt:new Date()}); res.json({status:'success'}); }
  catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
