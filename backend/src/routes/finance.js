const express = require('express');
const router = express.Router();
const { Transaction, Account, Budget } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate, authorize('super_admin','finance_manager'));
const genTxn = () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
const getRange = (y,m) => ({start:new Date(y,m-1,1),end:new Date(y,m,0,23,59,59)});

router.get('/summary', async (req, res) => {
  try {
    const month=parseInt(req.query.month)||new Date().getMonth()+1, year=parseInt(req.query.year)||new Date().getFullYear();
    const {start,end}=getRange(year,month);
    const [inc,exp,byCat]=await Promise.all([Transaction.aggregate([{$match:{type:'income',status:'completed',date:{$gte:start,$lte:end}}},{$group:{_id:null,total:{$sum:'$amount'},count:{$sum:1}}}]),Transaction.aggregate([{$match:{type:'expense',status:'completed',date:{$gte:start,$lte:end}}},{$group:{_id:null,total:{$sum:'$amount'},count:{$sum:1}}}]),Transaction.aggregate([{$match:{status:'completed',date:{$gte:start,$lte:end}}},{$group:{_id:{type:'$type',category:'$category'},total:{$sum:'$amount'}}},{$sort:{total:-1}}])]);
    const totalIncome=inc[0]?.total||0, totalExpenses=exp[0]?.total||0;
    res.json({status:'success',data:{period:{month,year},income:{total:totalIncome,count:inc[0]?.count||0},expenses:{total:totalExpenses,count:exp[0]?.count||0},profit:totalIncome-totalExpenses,profitMargin:totalIncome>0?(((totalIncome-totalExpenses)/totalIncome)*100).toFixed(2):'0',byCategory:byCat}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/profit-loss', async (req, res) => {
  try {
    const year=parseInt(req.query.year)||new Date().getFullYear();
    const data=await Promise.all(Array.from({length:12},(_,i)=>i+1).map(async m=>{
      const {start,end}=getRange(year,m);
      const [inc,exp]=await Promise.all([Transaction.aggregate([{$match:{type:'income',status:'completed',date:{$gte:start,$lte:end}}},{$group:{_id:null,total:{$sum:'$amount'}}}]),Transaction.aggregate([{$match:{type:'expense',status:'completed',date:{$gte:start,$lte:end}}},{$group:{_id:null,total:{$sum:'$amount'}}}])]);
      const income=inc[0]?.total||0, expenses=exp[0]?.total||0;
      return {month:m,income,expenses,profit:income-expenses};
    }));
    res.json({status:'success',data:{year,monthly:data}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/cash-flow', async (req, res) => {
  try {
    const accounts=await Account.find({isActive:true}).sort('name');
    const totalBalance=accounts.reduce((s,a)=>s+a.balance,0);
    const recent=await Transaction.find({status:'completed'}).sort('-date').limit(20).populate('account','name').lean();
    res.json({status:'success',data:{accounts,totalBalance,recentTransactions:recent}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/transactions', async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20;
    const filter={};
    if(req.query.type) filter.type=req.query.type;
    if(req.query.category) filter.category=req.query.category;
    if(req.query.status) filter.status=req.query.status;
    if(req.query.search) filter.description=new RegExp(req.query.search,'i');
    const [txns,total]=await Promise.all([Transaction.find(filter).populate('createdBy','firstName lastName').populate('account','name type').sort('-date').skip((page-1)*limit).limit(limit),Transaction.countDocuments(filter)]);
    res.json({status:'success',data:{transactions:txns,pagination:{total,page,limit,pages:Math.ceil(total/limit)}}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/transactions', async (req, res) => {
  try {
    const t=await Transaction.create({...req.body,transactionId:genTxn(),createdBy:req.user.id});
    if(req.body.account){const change=req.body.type==='income'?req.body.amount:-req.body.amount;await Account.findByIdAndUpdate(req.body.account,{$inc:{balance:change}});}
    res.status(201).json({status:'success',data:{transaction:t}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.patch('/transactions/:id', async (req, res) => {
  try {
    const t=await Transaction.findByIdAndUpdate(req.params.id,req.body,{new:true});
    if(!t) return res.status(404).json({status:'fail',message:'Not found.'});
    res.json({status:'success',data:{transaction:t}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.delete('/transactions/:id', async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({status:'success',message:'Deleted.'});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/accounts', async (req, res) => {
  try { const a=await Account.find({isActive:true}).sort('name'); res.json({status:'success',data:{accounts:a}}); }
  catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/accounts', async (req, res) => {
  try { const a=await Account.create(req.body); res.status(201).json({status:'success',data:{account:a}}); }
  catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.patch('/accounts/:id', async (req, res) => {
  try { const a=await Account.findByIdAndUpdate(req.params.id,req.body,{new:true}); res.json({status:'success',data:{account:a}}); }
  catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/budgets', async (req, res) => {
  try {
    const filter={};
    if(req.query.year) filter['period.year']=parseInt(req.query.year);
    const b=await Budget.find(filter).populate('department','name').populate('createdBy','firstName lastName').sort('-period.year');
    res.json({status:'success',data:{budgets:b}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/budgets', async (req, res) => {
  try { const b=await Budget.create({...req.body,createdBy:req.user.id,remaining:req.body.amount}); res.status(201).json({status:'success',data:{budget:b}}); }
  catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.patch('/budgets/:id', async (req, res) => {
  try { const b=await Budget.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true}); res.json({status:'success',data:{budget:b}}); }
  catch(err){res.status(400).json({status:'fail',message:err.message});}
});

module.exports = router;
