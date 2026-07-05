const express = require('express');
const router = express.Router();
const { Order, Customer, Product, Transaction } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

const genOrderNum = () => `ORD-${Date.now()}-${Math.floor(Math.random()*1000)}`;
const genTxnId = () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;

router.get('/stats', async (req, res) => {
  try {
    const now = new Date(), ms = new Date(now.getFullYear(), now.getMonth(), 1);
    const [total, month, rev, byStatus] = await Promise.all([Order.countDocuments({orderStatus:{$ne:'cancelled'}}), Order.countDocuments({createdAt:{$gte:ms},orderStatus:{$ne:'cancelled'}}), Order.aggregate([{$match:{paymentStatus:'paid'}},{$group:{_id:null,total:{$sum:'$total'}}}]), Order.aggregate([{$group:{_id:'$orderStatus',count:{$sum:1}}}])]);
    res.json({status:'success',data:{totalOrders:total,monthOrders:month,totalRevenue:rev[0]?.total||0,byStatus}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/orders', async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20;
    const filter={};
    if(req.query.orderStatus) filter.orderStatus=req.query.orderStatus;
    if(req.query.paymentStatus) filter.paymentStatus=req.query.paymentStatus;
    if(req.query.customer) filter.customer=req.query.customer;
    if(req.query.search) filter.orderNumber=new RegExp(req.query.search,'i');
    const [orders,total] = await Promise.all([Order.find(filter).populate('customer','firstName lastName companyName email type').populate('createdBy','firstName lastName').sort('-createdAt').skip((page-1)*limit).limit(limit), Order.countDocuments(filter)]);
    res.json({status:'success',data:{orders,pagination:{total,page,limit,pages:Math.ceil(total/limit)}}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer','firstName lastName companyName email phone type address').populate('items.product','name sku images').populate('createdBy','firstName lastName email');
    if(!order) return res.status(404).json({status:'fail',message:'Not found.'});
    res.json({status:'success',data:{order}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/orders', authorize('super_admin','sales_manager'), async (req, res) => {
  try {
    const {customer:custId, items, ...rest} = req.body;
    const cust = await Customer.findById(custId);
    if(!cust) return res.status(404).json({status:'fail',message:'Customer not found.'});
    let subtotal=0;
    const processedItems=[];
    for(const item of items){
      const prod = await Product.findById(item.product);
      if(!prod) return res.status(404).json({status:'fail',message:`Product ${item.product} not found.`});
      if(prod.stock.available < item.quantity) return res.status(400).json({status:'fail',message:`Insufficient stock for ${prod.name}.`});
      const itemSub = item.quantity * item.unitPrice;
      const discAmt = itemSub * ((item.discount||0)/100);
      const taxAmt = (itemSub-discAmt) * ((item.taxRate||0)/100);
      subtotal += itemSub;
      processedItems.push({product:item.product,name:prod.name,sku:prod.sku,quantity:item.quantity,unitPrice:item.unitPrice,discount:item.discount||0,taxRate:item.taxRate||0,taxAmount:taxAmt,subtotal:itemSub,total:itemSub-discAmt+taxAmt});
    }
    const taxAmount = processedItems.reduce((s,i)=>s+i.taxAmount,0);
    const total = subtotal-(rest.discountAmount||0)+taxAmount+(rest.shippingCost||0);
    const order = await Order.create({orderNumber:genOrderNum(),customer:custId,items:processedItems,subtotal,discountAmount:rest.discountAmount||0,taxAmount,total,createdBy:req.user.id,...rest});
    for(const item of processedItems) await Product.findByIdAndUpdate(item.product,{$inc:{'stock.reserved':item.quantity,'stock.available':-item.quantity}});
    await Customer.findByIdAndUpdate(custId,{$inc:{totalOrders:1},lastOrderDate:new Date()});
    const populated = await Order.findById(order._id).populate('customer','firstName lastName companyName').populate('createdBy','firstName lastName');
    res.status(201).json({status:'success',data:{order:populated}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.patch('/orders/:id', authorize('super_admin','sales_manager'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if(!order) return res.status(404).json({status:'fail',message:'Not found.'});
    if(['delivered','cancelled','refunded'].includes(order.orderStatus)) return res.status(400).json({status:'fail',message:`Cannot update ${order.orderStatus} order.`});
    const updated = await Order.findByIdAndUpdate(req.params.id, req.body, {new:true}).populate('customer','firstName lastName companyName');
    res.json({status:'success',data:{order:updated}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.patch('/orders/:id/status', authorize('super_admin','sales_manager'), async (req, res) => {
  try {
    const {status,reason} = req.body;
    const order = await Order.findById(req.params.id);
    if(!order) return res.status(404).json({status:'fail',message:'Not found.'});
    const flow={pending:['confirmed','cancelled'],confirmed:['processing','cancelled'],processing:['shipped','cancelled'],shipped:['delivered'],delivered:['refunded']};
    if(!flow[order.orderStatus]?.includes(status)) return res.status(400).json({status:'fail',message:`Cannot change from ${order.orderStatus} to ${status}.`});
    const updates={orderStatus:status};
    if(status==='shipped') updates.shippedAt=new Date();
    if(status==='delivered'){updates.deliveredAt=new Date(); await Customer.findByIdAndUpdate(order.customer,{$inc:{totalRevenue:order.total}}); for(const item of order.items) await Product.findByIdAndUpdate(item.product,{$inc:{'stock.reserved':-item.quantity,'stock.quantity':-item.quantity,'totalSold':item.quantity,'totalRevenue':item.total}});}
    if(status==='cancelled'){updates.cancelledAt=new Date();updates.cancelReason=reason;for(const item of order.items) await Product.findByIdAndUpdate(item.product,{$inc:{'stock.reserved':-item.quantity,'stock.available':item.quantity}});}
    const updated = await Order.findByIdAndUpdate(req.params.id,updates,{new:true}).populate('customer','firstName lastName companyName');
    res.json({status:'success',data:{order:updated}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/orders/:id/payment', authorize('super_admin','sales_manager','finance_manager'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if(!order) return res.status(404).json({status:'fail',message:'Not found.'});
    const {amount,paymentMethod} = req.body;
    const newPaid = order.paidAmount + Number(amount);
    const paymentStatus = newPaid>=order.total?'paid':newPaid>0?'partial':'unpaid';
    await Order.findByIdAndUpdate(req.params.id,{paidAmount:newPaid,paymentStatus,paymentMethod});
    await Transaction.create({transactionId:genTxnId(),type:'income',category:'Sales',amount:Number(amount),date:new Date(),description:`Payment for order ${order.orderNumber}`,paymentMethod,status:'completed',createdBy:req.user.id,relatedOrder:order._id});
    res.json({status:'success',message:'Payment recorded.',data:{paidAmount:newPaid,paymentStatus}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

module.exports = router;
