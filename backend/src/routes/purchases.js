const express = require('express');
const router = express.Router();
const { Purchase, Supplier, Product, Transaction } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
const genPO = () => `PO-${Date.now()}`;
const genTxn = () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;

router.get('/', async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1,limit=parseInt(req.query.limit)||20;
    const filter={};
    if(req.query.status) filter.status=req.query.status;
    if(req.query.supplier) filter.supplier=req.query.supplier;
    const [purchases,total]=await Promise.all([Purchase.find(filter).populate('supplier','companyName email').populate('createdBy','firstName lastName').sort('-createdAt').skip((page-1)*limit).limit(limit),Purchase.countDocuments(filter)]);
    res.json({status:'success',data:{purchases,pagination:{total,page,limit,pages:Math.ceil(total/limit)}}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/:id', async (req, res) => {
  try {
    const p=await Purchase.findById(req.params.id).populate('supplier','companyName email phone').populate('createdBy','firstName lastName').populate('approvedBy','firstName lastName');
    if(!p) return res.status(404).json({status:'fail',message:'Not found.'});
    res.json({status:'success',data:{purchase:p}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/', authorize('super_admin','inventory_manager'), async (req, res) => {
  try {
    const supplier=await Supplier.findById(req.body.supplier);
    if(!supplier) return res.status(404).json({status:'fail',message:'Supplier not found.'});
    let subtotal=0;
    const items=req.body.items.map(item=>{const s=item.quantity*item.unitCost;subtotal+=s;return{...item,subtotal:s,received:0};});
    const total=subtotal+(req.body.taxAmount||0)+(req.body.shippingCost||0);
    const p=await Purchase.create({purchaseNumber:genPO(),supplier:req.body.supplier,items,subtotal,taxAmount:req.body.taxAmount||0,shippingCost:req.body.shippingCost||0,total,createdBy:req.user.id,expectedDate:req.body.expectedDate,notes:req.body.notes,status:'pending'});
    res.status(201).json({status:'success',data:{purchase:p}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.patch('/:id/approve', authorize('super_admin','finance_manager'), async (req, res) => {
  try {
    const p=await Purchase.findByIdAndUpdate(req.params.id,{status:'approved',approvedBy:req.user.id,approvedAt:new Date()},{new:true});
    if(!p) return res.status(404).json({status:'fail',message:'Not found.'});
    res.json({status:'success',data:{purchase:p}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.patch('/:id/receive', authorize('super_admin','inventory_manager'), async (req, res) => {
  try {
    const p=await Purchase.findById(req.params.id);
    if(!p) return res.status(404).json({status:'fail',message:'Not found.'});
    const {receivedItems=[]}=req.body;
    let allReceived=true;
    for(const r of receivedItems){
      const idx=p.items.findIndex(i=>i.product?.toString()===r.productId);
      if(idx===-1) continue;
      p.items[idx].received+=(r.quantity||0);
      if(p.items[idx].received<p.items[idx].quantity) allReceived=false;
      if(p.items[idx].product) await Product.findByIdAndUpdate(p.items[idx].product,{$inc:{'stock.quantity':r.quantity,'stock.available':r.quantity}});
    }
    p.status=allReceived?'received':'partial';
    if(allReceived) p.receivedDate=new Date();
    await p.save();
    res.json({status:'success',data:{purchase:p}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/:id/payment', authorize('super_admin','finance_manager'), async (req, res) => {
  try {
    const p=await Purchase.findById(req.params.id);
    if(!p) return res.status(404).json({status:'fail',message:'Not found.'});
    const newPaid=p.paidAmount+Number(req.body.amount);
    const paymentStatus=newPaid>=p.total?'paid':newPaid>0?'partial':'unpaid';
    await Purchase.findByIdAndUpdate(req.params.id,{paidAmount:newPaid,paymentStatus,paymentMethod:req.body.paymentMethod});
    await Transaction.create({transactionId:genTxn(),type:'expense',category:'Purchases',amount:Number(req.body.amount),date:new Date(),description:`Payment for PO ${p.purchaseNumber}`,paymentMethod:req.body.paymentMethod,status:'completed',createdBy:req.user.id,relatedPurchase:p._id});
    res.json({status:'success',message:'Payment recorded.'});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

module.exports = router;
