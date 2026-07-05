const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// ─── USER ───────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['super_admin','hr_manager','finance_manager','inventory_manager','sales_manager','employee'], default: 'employee' },
  avatar: String, phone: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  position: String,
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  lastLogin: Date, loginAttempts: { type: Number, default: 0 }, lockUntil: Date,
  preferences: { theme: { type: String, default: 'system' }, language: { type: String, default: 'en' }, notifications: { type: Boolean, default: true }, emailNotifications: { type: Boolean, default: true } },
  refreshTokens: { type: [String], select: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

userSchema.virtual('fullName').get(function() { return `${this.firstName} ${this.lastName}`; });
userSchema.virtual('isLocked').get(function() { return !!(this.lockUntil && this.lockUntil > Date.now()); });
userSchema.pre('save', async function(next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
userSchema.methods.comparePassword = function(p) { return bcrypt.compare(p, this.password); };
userSchema.methods.createPasswordResetToken = function() { const t = crypto.randomBytes(32).toString('hex'); this.passwordResetToken = crypto.createHash('sha256').update(t).digest('hex'); this.passwordResetExpires = Date.now() + 3600000; return t; };
userSchema.methods.createEmailVerificationToken = function() { const t = crypto.randomBytes(32).toString('hex'); this.emailVerificationToken = crypto.createHash('sha256').update(t).digest('hex'); this.emailVerificationExpires = Date.now() + 86400000; return t; };
userSchema.index({ email: 1 }); userSchema.index({ role: 1 }); userSchema.index({ isActive: 1 });
const User = mongoose.model('User', userSchema);

// ─── DEPARTMENT ──────────────────────────────────────────────────────────────
const deptSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String, manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentDepartment: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  budget: Number, location: String, isActive: { type: Boolean, default: true },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
const Department = mongoose.model('Department', deptSchema);

// ─── EMPLOYEE ────────────────────────────────────────────────────────────────
const employeeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeId: { type: String, unique: true, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  position: { type: String, required: true },
  employmentType: { type: String, enum: ['full_time','part_time','contract','intern'], default: 'full_time' },
  employmentStatus: { type: String, enum: ['active','inactive','on_leave','terminated','probation'], default: 'active' },
  startDate: { type: Date, required: true }, endDate: Date,
  salary: { base: { type: Number, required: true }, currency: { type: String, default: 'USD' }, paymentFrequency: { type: String, default: 'monthly' } },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  skills: [String], education: [{ degree: String, institution: String, year: Number, field: String }],
  experience: [{ company: String, position: String, startDate: Date, endDate: Date, description: String }],
  documents: [{ name: String, type: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
  bankDetails: { bankName: String, accountNumber: String }, emergencyContact: { name: String, relationship: String, phone: String },
  address: { street: String, city: String, state: String, country: String, zipCode: String },
  performanceRating: Number, notes: String,
}, { timestamps: true });
employeeSchema.index({ user: 1 }); employeeSchema.index({ department: 1 }); employeeSchema.index({ employmentStatus: 1 });
const Employee = mongoose.model('Employee', employeeSchema);

// ─── ATTENDANCE ──────────────────────────────────────────────────────────────
const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: Date, checkOut: Date,
  status: { type: String, enum: ['present','absent','late','half_day','holiday','weekend'], required: true },
  workHours: Number, overtime: { type: Number, default: 0 }, notes: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
attendanceSchema.pre('save', function(next) { if (this.checkIn && this.checkOut) { const diff = (this.checkOut - this.checkIn) / 3600000; this.workHours = Math.round(diff * 100) / 100; if (diff > 8) this.overtime = Math.round((diff - 8) * 100) / 100; } next(); });
attendanceSchema.index({ employee: 1, date: -1 });
const Attendance = mongoose.model('Attendance', attendanceSchema);

// ─── LEAVE ───────────────────────────────────────────────────────────────────
const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: String, enum: ['annual','sick','maternity','paternity','emergency','unpaid','other'], required: true },
  startDate: { type: Date, required: true }, endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true }, reason: { type: String, required: true },
  status: { type: String, enum: ['pending','approved','rejected','cancelled'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, approvedAt: Date, rejectionReason: String, attachments: [String],
}, { timestamps: true });
leaveSchema.index({ employee: 1, status: 1 });
const Leave = mongoose.model('Leave', leaveSchema);

// ─── PAYROLL ─────────────────────────────────────────────────────────────────
const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  period: { month: { type: Number, required: true }, year: { type: Number, required: true } },
  basicSalary: Number, allowances: [{ name: String, amount: Number }], deductions: [{ name: String, amount: Number }],
  overtime: { hours: { type: Number, default: 0 }, rate: Number, amount: { type: Number, default: 0 } },
  bonus: { type: Number, default: 0 }, grossSalary: Number, netSalary: Number, tax: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['draft','pending','approved','paid'], default: 'draft' },
  paymentDate: Date, paymentMethod: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, notes: String,
}, { timestamps: true });
payrollSchema.index({ employee: 1, 'period.month': 1, 'period.year': 1 }, { unique: true });
const Payroll = mongoose.model('Payroll', payrollSchema);

// ─── CUSTOMER ────────────────────────────────────────────────────────────────
const customerSchema = new mongoose.Schema({
  customerId: { type: String, unique: true, required: true },
  type: { type: String, enum: ['individual','company'], required: true },
  firstName: String, lastName: String, companyName: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: String, website: String,
  address: { street: String, city: String, state: String, country: String, zipCode: String },
  category: { type: String, enum: ['regular','premium','vip','inactive'], default: 'regular' },
  creditLimit: Number, outstanding: { type: Number, default: 0 },
  taxId: String, currency: { type: String, default: 'USD' }, notes: String, tags: [String],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  totalOrders: { type: Number, default: 0 }, totalRevenue: { type: Number, default: 0 }, lastOrderDate: Date,
}, { timestamps: true, toJSON: { virtuals: true } });
customerSchema.virtual('fullName').get(function() { return this.type === 'company' ? this.companyName : `${this.firstName||''} ${this.lastName||''}`.trim(); });
customerSchema.index({ email: 1 }); customerSchema.index({ isActive: 1 });
const Customer = mongoose.model('Customer', customerSchema);

// ─── SUPPLIER ────────────────────────────────────────────────────────────────
const supplierSchema = new mongoose.Schema({
  supplierId: { type: String, unique: true, required: true },
  companyName: { type: String, required: true }, contactPerson: String,
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: String, website: String,
  address: { street: String, city: String, state: String, country: String, zipCode: String },
  category: String, paymentTerms: String, currency: { type: String, default: 'USD' },
  taxId: String, bankDetails: { bankName: String, accountNumber: String },
  rating: Number, notes: String, tags: [String], isActive: { type: Boolean, default: true },
  totalPurchases: { type: Number, default: 0 }, totalSpend: { type: Number, default: 0 }, lastPurchaseDate: Date,
}, { timestamps: true });
const Supplier = mongoose.model('Supplier', supplierSchema);

// ─── CATEGORY ────────────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, slug: { type: String, unique: true },
  description: String, parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  image: String, isActive: { type: Boolean, default: true }, productCount: { type: Number, default: 0 },
}, { timestamps: true });
categorySchema.pre('save', function(next) { if (this.isModified('name')) this.slug = this.name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''); next(); });
const Category = mongoose.model('Category', categorySchema);

// ─── WAREHOUSE ───────────────────────────────────────────────────────────────
const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, code: { type: String, required: true, unique: true, uppercase: true },
  address: { street: String, city: String, state: String, country: String, zipCode: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  capacity: Number, currentUsage: { type: Number, default: 0 }, phone: String, email: String,
  isActive: { type: Boolean, default: true }, notes: String,
}, { timestamps: true });
const Warehouse = mongoose.model('Warehouse', warehouseSchema);

// ─── PRODUCT ─────────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, uppercase: true },
  barcode: String, name: { type: String, required: true }, description: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  images: [String], costPrice: { type: Number, required: true }, sellingPrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' }, unit: { type: String, default: 'pcs' }, weight: Number,
  stock: { quantity: { type: Number, default: 0 }, reserved: { type: Number, default: 0 }, available: { type: Number, default: 0 }, minStock: { type: Number, default: 10 }, maxStock: { type: Number, default: 1000 }, reorderPoint: { type: Number, default: 20 }, reorderQuantity: { type: Number, default: 100 } },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' }, location: String,
  isActive: { type: Boolean, default: true }, isFeatured: { type: Boolean, default: false },
  tags: [String], taxRate: { type: Number, default: 0 }, totalSold: { type: Number, default: 0 }, totalRevenue: { type: Number, default: 0 },
}, { timestamps: true, toJSON: { virtuals: true } });
productSchema.virtual('isLowStock').get(function() { return this.stock.available <= this.stock.reorderPoint; });
productSchema.index({ sku: 1 }); productSchema.index({ isActive: 1 }); productSchema.index({ 'stock.available': 1 });
const Product = mongoose.model('Product', productSchema);

// ─── ORDER ───────────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, sku: String, quantity: Number, unitPrice: Number, discount: { type: Number, default: 0 }, taxRate: { type: Number, default: 0 }, taxAmount: { type: Number, default: 0 }, subtotal: Number, total: Number }, { _id: false });
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true }, type: { type: String, enum: ['sale','quotation'], default: 'sale' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [orderItemSchema], subtotal: Number, discountAmount: { type: Number, default: 0 }, taxAmount: { type: Number, default: 0 }, shippingCost: { type: Number, default: 0 }, total: Number,
  currency: { type: String, default: 'USD' },
  orderStatus: { type: String, enum: ['draft','pending','confirmed','processing','shipped','delivered','cancelled','refunded'], default: 'pending' },
  paymentStatus: { type: String, enum: ['unpaid','partial','paid','refunded','overdue'], default: 'unpaid' },
  paymentMethod: String, paidAmount: { type: Number, default: 0 },
  shippingAddress: { street: String, city: String, state: String, country: String, zipCode: String },
  notes: String, terms: String, validUntil: Date, shippedAt: Date, deliveredAt: Date, cancelledAt: Date, cancelReason: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  invoiceNumber: String, invoiceDate: Date, dueDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
orderSchema.index({ orderNumber: 1 }); orderSchema.index({ customer: 1 }); orderSchema.index({ orderStatus: 1 }); orderSchema.index({ createdAt: -1 });
const Order = mongoose.model('Order', orderSchema);

// ─── PURCHASE ────────────────────────────────────────────────────────────────
const purchaseSchema = new mongoose.Schema({
  purchaseNumber: { type: String, unique: true, required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, sku: String, quantity: Number, unitCost: Number, subtotal: Number, received: { type: Number, default: 0 } }],
  subtotal: Number, taxAmount: { type: Number, default: 0 }, shippingCost: { type: Number, default: 0 }, total: Number, currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['draft','pending','approved','ordered','partial','received','cancelled'], default: 'draft' },
  paymentStatus: { type: String, enum: ['unpaid','partial','paid','overdue'], default: 'unpaid' },
  paymentMethod: String, paidAmount: { type: Number, default: 0 }, expectedDate: Date, receivedDate: Date, notes: String,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, approvedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
}, { timestamps: true });
purchaseSchema.index({ purchaseNumber: 1 }); purchaseSchema.index({ supplier: 1 }); purchaseSchema.index({ status: 1 });
const Purchase = mongoose.model('Purchase', purchaseSchema);

// ─── TRANSACTION ─────────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true },
  type: { type: String, enum: ['income','expense'], required: true }, category: { type: String, required: true },
  amount: { type: Number, required: true }, currency: { type: String, default: 'USD' },
  date: { type: Date, default: Date.now }, description: { type: String, required: true }, reference: String,
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }, paymentMethod: { type: String, required: true },
  attachments: [String], tags: [String],
  status: { type: String, enum: ['pending','completed','cancelled','reconciled'], default: 'completed' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  relatedPurchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
}, { timestamps: true });
transactionSchema.index({ type: 1, date: -1 }); transactionSchema.index({ category: 1 }); transactionSchema.index({ createdAt: -1 });
const Transaction = mongoose.model('Transaction', transactionSchema);

// ─── ACCOUNT ─────────────────────────────────────────────────────────────────
const accountSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, type: { type: String, enum: ['cash','bank','credit','investment','other'], required: true },
  accountNumber: String, bankName: String, balance: { type: Number, default: 0 }, currency: { type: String, default: 'USD' },
  description: String, isActive: { type: Boolean, default: true },
}, { timestamps: true });
const Account = mongoose.model('Account', accountSchema);

// ─── BUDGET ──────────────────────────────────────────────────────────────────
const budgetSchema = new mongoose.Schema({
  name: { type: String, required: true }, department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  category: { type: String, required: true }, amount: { type: Number, required: true },
  spent: { type: Number, default: 0 }, remaining: Number, currency: { type: String, default: 'USD' },
  period: { month: Number, year: { type: Number, required: true }, quarter: Number },
  type: { type: String, enum: ['monthly','quarterly','annual'], required: true },
  status: { type: String, enum: ['active','exceeded','closed'], default: 'active' },
  notes: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
budgetSchema.pre('save', function(next) { this.remaining = this.amount - this.spent; if (this.spent > this.amount) this.status = 'exceeded'; next(); });
const Budget = mongoose.model('Budget', budgetSchema);

// ─── NOTIFICATION ────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true }, message: { type: String, required: true },
  type: { type: String, enum: ['info','success','warning','error','system'], default: 'info' },
  category: { type: String, default: 'general' },
  isRead: { type: Boolean, default: false }, readAt: Date, link: String, metadata: mongoose.Schema.Types.Mixed,
  priority: { type: String, enum: ['low','normal','high','urgent'], default: 'normal' }, expiresAt: Date,
}, { timestamps: true });
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
const Notification = mongoose.model('Notification', notificationSchema);

// ─── PERFORMANCE ─────────────────────────────────────────────────────────────
const performanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewPeriod: { startDate: Date, endDate: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  overallRating: { type: Number, required: true, min: 1, max: 5 },
  metrics: [{ name: String, target: Number, achieved: Number, rating: Number, comments: String }],
  strengths: [String], improvements: [String],
  goals: [{ description: String, targetDate: Date, status: { type: String, default: 'pending' } }],
  feedback: { type: String, required: true }, employeeComments: String,
  status: { type: String, enum: ['draft','submitted','acknowledged'], default: 'draft' }, acknowledgedAt: Date,
}, { timestamps: true });
const Performance = mongoose.model('Performance', performanceSchema);

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: String, resource: String, resourceId: String,
  changes: mongoose.Schema.Types.Mixed, ipAddress: String, userAgent: String,
  status: { type: String, enum: ['success','failed'], default: 'success' }, message: String,
}, { timestamps: true });
auditLogSchema.index({ user: 1, createdAt: -1 }); auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { User, Department, Employee, Attendance, Leave, Payroll, Customer, Supplier, Category, Warehouse, Product, Order, Purchase, Transaction, Account, Budget, Notification, Performance, AuditLog };
