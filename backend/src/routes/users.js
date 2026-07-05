const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const page=parseInt(req.query.page)||1, limit=parseInt(req.query.limit)||20;
    const filter={};
    if(req.query.role) filter.role=req.query.role;
    if(req.query.isActive!==undefined) filter.isActive=req.query.isActive==='true';
    if(req.query.search){const r=new RegExp(req.query.search,'i');filter.$or=[{firstName:r},{lastName:r},{email:r}];}
    const [users,total]=await Promise.all([User.find(filter).populate('department','name code').sort('-createdAt').skip((page-1)*limit).limit(limit),User.countDocuments(filter)]);
    res.json({status:'success',data:{users,pagination:{total,page,limit,pages:Math.ceil(total/limit)}}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.get('/:id', authorize('super_admin','hr_manager'), async (req, res) => {
  try {
    const u=await User.findById(req.params.id).populate('department','name code');
    if(!u) return res.status(404).json({status:'fail',message:'Not found.'});
    res.json({status:'success',data:{user:u}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.post('/', authorize('super_admin'), async (req, res) => {
  try {
    const existing=await User.findOne({email:req.body.email});
    if(existing) return res.status(400).json({status:'fail',message:'Email exists.'});
    const u=await User.create({...req.body,isEmailVerified:true});
    res.status(201).json({status:'success',data:{user:u}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.patch('/:id', authorize('super_admin'), async (req, res) => {
  try {
    const {password,refreshTokens,...data}=req.body;
    const u=await User.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true}).populate('department','name code');
    if(!u) return res.status(404).json({status:'fail',message:'Not found.'});
    res.json({status:'success',data:{user:u}});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

router.delete('/:id', authorize('super_admin'), async (req, res) => {
  try {
    if(req.params.id===req.user.id) return res.status(400).json({status:'fail',message:'Cannot delete own account.'});
    await User.findByIdAndUpdate(req.params.id,{isActive:false});
    res.json({status:'success',message:'User deactivated.'});
  } catch(err){res.status(400).json({status:'fail',message:err.message});}
});

module.exports = router;
