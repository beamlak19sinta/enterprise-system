const express = require('express');
const router = express.Router();
const { Employee, Order, Transaction, Product, Purchase, Customer, Supplier } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/employees', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const filter={};
    if(req.query.department) filter.department=req.query.department;
    const employees=await Employee.find(filter).populate('user','firstName lastName email phone').populate('department','name').lean();
    const byStatus=employees.reduce((a,e)=>{a[e.employmentStatus]=(a[e.employmentStatus]||0)+1;return a;},{});
    res.json({status:'success',data:{employees,summary:{total:employees.length,byStatus}}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/sales', authorize('super_admin','sales_manager','finance_manager'), async (req, res) => {
  try {
    const start=req.query.startDate?new Date(req.query.startDate):new Date(new Date().setDate(1));
    const end=req.query.endDate?new Date(req.query.endDate):new Date();
    const orders=await Order.find({createdAt:{$gte:start,$lte:end}}).populate('customer','firstName lastName companyName').sort('-createdAt').lean();
    const totalRevenue=orders.filter(o=>o.orderStatus!=='cancelled').reduce((s,o)=>s+o.total,0);
    res.json({status:'success',data:{orders,totalRevenue,period:{startDate:start,endDate:end}}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/finance', authorize('super_admin','finance_manager'), async (req, res) => {
  try {
    const start=req.query.startDate?new Date(req.query.startDate):new Date(new Date().setDate(1));
    const end=req.query.endDate?new Date(req.query.endDate):new Date();
    const [income,expenses]=await Promise.all([Transaction.find({type:'income',status:'completed',date:{$gte:start,$lte:end}}).sort('-date').lean(),Transaction.find({type:'expense',status:'completed',date:{$gte:start,$lte:end}}).sort('-date').lean()]);
    const totalIncome=income.reduce((s,t)=>s+t.amount,0), totalExpenses=expenses.reduce((s,t)=>s+t.amount,0);
    res.json({status:'success',data:{income,expenses,summary:{totalIncome,totalExpenses,profit:totalIncome-totalExpenses},period:{startDate:start,endDate:end}}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/inventory', authorize('super_admin','inventory_manager'), async (req, res) => {
  try {
    const products=await Product.find({isActive:true}).populate('category','name').populate('supplier','companyName').lean();
    const lowStock=products.filter(p=>p.stock.available<=p.stock.reorderPoint).length;
    const totalValue=products.reduce((s,p)=>s+p.stock.quantity*p.costPrice,0);
    res.json({status:'success',data:{products,summary:{total:products.length,lowStock,totalValue}}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/purchases', authorize('super_admin','inventory_manager','finance_manager'), async (req, res) => {
  try {
    const start=req.query.startDate?new Date(req.query.startDate):new Date(new Date().setDate(1));
    const end=req.query.endDate?new Date(req.query.endDate):new Date();
    const purchases=await Purchase.find({createdAt:{$gte:start,$lte:end}}).populate('supplier','companyName').sort('-createdAt').lean();
    const totalSpend=purchases.filter(p=>p.status!=='cancelled').reduce((s,p)=>s+p.total,0);
    res.json({status:'success',data:{purchases,summary:{total:purchases.length,totalSpend},period:{startDate:start,endDate:end}}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/export/excel', async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const ws=XLSX.utils.json_to_sheet(req.body.data||[]);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,req.body.reportType||'Report');
    const buf=XLSX.write(wb,{bookType:'xlsx',type:'buffer'});
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition',`attachment; filename="${req.body.reportType}-${Date.now()}.xlsx"`);
    res.send(buf);
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/export/pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const doc=new PDFDocument({margin:50});
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`attachment; filename="${req.body.reportType}-${Date.now()}.pdf"`);
    doc.pipe(res);
    doc.fontSize(24).fillColor('#6366f1').text('ERP System',50,50);
    doc.fontSize(16).fillColor('#1f2937').text(`${(req.body.reportType||'').toUpperCase()} Report`,50,80);
    doc.fontSize(10).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleString()}`,50,100);
    doc.moveTo(50,120).lineTo(545,120).strokeColor('#e5e7eb').stroke();
    const data=req.body.data||[];
    let y=140;
    data.slice(0,30).forEach((row,i)=>{
      if(y>700){doc.addPage();y=50;}
      doc.fontSize(9).fillColor('#374151').text(`${i+1}. ${Object.values(row).filter(v=>typeof v==='string'||typeof v==='number').slice(0,4).join(' | ')}`.substring(0,100),50,y);
      y+=18;
    });
    doc.end();
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

module.exports = router;
