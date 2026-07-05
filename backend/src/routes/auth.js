const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const signToken = (id, role, email) => jwt.sign({ id, role, email }, process.env.JWT_SECRET || 'erp_secret_key_2024', { expiresIn: '7d' });
const signRefresh = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'erp_refresh_secret_2024', { expiresIn: '30d' });

const sendTokens = (user, statusCode, res) => {
  const accessToken = signToken(user._id, user.role, user.email);
  const refreshToken = signRefresh(user._id);
  const u = user.toObject ? user.toObject() : user;
  delete u.password; delete u.refreshTokens;
  res.status(statusCode).json({ status: 'success', data: { user: u, accessToken, refreshToken } });
};

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ status: 'fail', message: 'Email already registered.' });
    const user = await User.create({ firstName, lastName, email, password, role: role || 'employee', isEmailVerified: true });
    sendTokens(user, 201, res);
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ status: 'fail', message: 'Email and password required.' });
    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
    if (!user) return res.status(401).json({ status: 'fail', message: 'Invalid credentials.' });
    if (user.lockUntil && user.lockUntil > Date.now()) return res.status(423).json({ status: 'fail', message: 'Account locked. Try again in 30 minutes.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await User.findByIdAndUpdate(user._id, { $inc: { loginAttempts: 1 }, ...(user.loginAttempts >= 4 ? { lockUntil: new Date(Date.now() + 1800000) } : {}) });
      return res.status(401).json({ status: 'fail', message: 'Invalid credentials.' });
    }
    if (!user.isActive) return res.status(401).json({ status: 'fail', message: 'Account deactivated.' });
    await User.findByIdAndUpdate(user._id, { loginAttempts: 0, lastLogin: new Date(), $unset: { lockUntil: '' } });
    sendTokens(user, 200, res);
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.post('/logout', authenticate, async (req, res) => {
  res.clearCookie('accessToken'); res.clearCookie('refreshToken');
  res.json({ status: 'success', message: 'Logged out.' });
});

router.post('/refresh-token', async (req, res) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ status: 'fail', message: 'No refresh token.' });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'erp_refresh_secret_2024');
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ status: 'fail', message: 'Invalid token.' });
    const accessToken = signToken(user._id, user.role, user.email);
    const refreshToken = signRefresh(user._id);
    res.json({ status: 'success', data: { accessToken, refreshToken } });
  } catch { res.status(401).json({ status: 'fail', message: 'Invalid refresh token.' }); }
});

router.post('/forgot-password', async (req, res) => {
  res.json({ status: 'success', message: 'If that email is registered, a reset link has been sent.' });
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return;
    const token = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // Email would be sent here in production
  } catch {}
});

router.patch('/reset-password/:token', async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } }).select('+password');
    if (!user) return res.status(400).json({ status: 'fail', message: 'Invalid or expired token.' });
    user.password = req.body.password; user.passwordResetToken = undefined; user.passwordResetExpires = undefined; user.loginAttempts = 0;
    await user.save();
    sendTokens(user, 200, res);
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/verify-email/:token', async (req, res) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: hashed, emailVerificationExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ status: 'fail', message: 'Invalid or expired token.' });
    user.isEmailVerified = true; user.emailVerificationToken = undefined; user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.json({ status: 'success', message: 'Email verified.' });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('department', 'name code');
    res.json({ status: 'success', data: { user } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/update-profile', authenticate, async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'phone', 'avatar', 'preferences'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true }).populate('department', 'name code');
    res.json({ status: 'success', data: { user } });
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

router.patch('/change-password', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(req.body.currentPassword);
    if (!isMatch) return res.status(401).json({ status: 'fail', message: 'Current password incorrect.' });
    user.password = req.body.newPassword; await user.save();
    sendTokens(user, 200, res);
  } catch (err) { res.status(400).json({ status: 'fail', message: err.message }); }
});

module.exports = router;
