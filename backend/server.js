require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const rateLimit = require('express-rate-limit');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', methods: ['GET', 'POST'], credentials: true }
});
app.set('io', io);

app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (_, res) => res.json({ status: 'OK', message: 'ERP API running', timestamp: new Date() }));

// Routes
const routes = require('./src/routes');
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ status: 'fail', message: `Route ${req.originalUrl} not found` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  if (err.name === 'ValidationError') { statusCode = 400; message = Object.values(err.errors).map(e => e.message).join(', '); }
  if (err.code === 11000) { statusCode = 400; const field = Object.keys(err.keyValue)[0]; message = `${field} already exists`; }
  if (err.name === 'CastError') { statusCode = 400; message = `Invalid ${err.path}: ${err.value}`; }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired'; }
  res.status(statusCode).json({ status: statusCode >= 500 ? 'error' : 'fail', message });
});

io.on('connection', socket => {
  socket.on('join-room', userId => socket.join(`user-${userId}`));
  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system')
  .then(() => {
    console.log('✅ MongoDB Connected');
    server.listen(PORT, () => {
      console.log(`🚀 ERP Server running on http://localhost:${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => { console.error('MongoDB connection failed:', err); process.exit(1); });

module.exports = app;
