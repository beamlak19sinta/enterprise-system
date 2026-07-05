const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) token = req.headers.authorization.split(' ')[1];
    else if (req.cookies?.accessToken) token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ status: 'fail', message: 'Access denied. No token provided.' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'erp_secret_key_2024');
    const user = await User.findById(decoded.id).select('isActive role email firstName lastName');
    if (!user) return res.status(401).json({ status: 'fail', message: 'User not found.' });
    if (!user.isActive) return res.status(401).json({ status: 'fail', message: 'Account deactivated.' });
    req.user = { id: decoded.id, role: user.role, email: user.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ status: 'fail', message: 'Token expired.' });
    return res.status(401).json({ status: 'fail', message: 'Invalid token.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ status: 'fail', message: 'Not authenticated.' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ status: 'fail', message: `Access denied. Required: ${roles.join(' or ')}` });
  next();
};

module.exports = { authenticate, authorize };
