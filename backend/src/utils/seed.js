require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://beamlaksintayheu6_db_user:muna1921@cluster0.0k7dpxu.mongodb.net/erp_system?retryWrites=true&w=majority&appName=Cluster0&compressors=zlib';

// Minimal inline models for seeding
const userSchema = new mongoose.Schema({ firstName: String, lastName: String, email: { type: String, unique: true }, password: String, role: String, department: mongoose.Schema.Types.ObjectId, isActive: { type: Boolean, default: true }, isEmailVerified: { type: Boolean, default: true }, preferences: { theme: { type: String, default: 'system' }, language: { type: String, default: 'en' }, notifications: { type: Boolean, default: true } }, loginAttempts: { type: Number, default: 0 }, refreshTokens: [String] }, { timestamps: true });
const deptSchema = new mongoose.Schema({ name: String, code: String, description: String, manager: mongoose.Schema.Types.ObjectId, employees: [mongoose.Schema.Types.ObjectId], budget: Number, location: String, isActive: { type: Boolean, default: true } }, { timestamps: true });
const empSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, employeeId: String, department: mongoose.Schema.Types.ObjectId, position: String, employmentType: { type: String, default: 'full_time' }, employmentStatus: { type: String, default: 'active' }, startDate: Date, salary: { base: Number, currency: { type: String, default: 'USD' }, paymentFrequency: { type: String, default: 'monthly' } }, skills: [String] }, { timestamps: true });
const catSchema = new mongoose.Schema({ name: String, slug: String, description: String, isActive: { type: Boolean, default: true } }, { timestamps: true });
const whSchema = new mongoose.Schema({ name: String, code: String, address: { city: String, country: String }, capacity: Number, currentUsage: { type: Number, default: 0 }, isActive: { type: Boolean, default: true } }, { timestamps: true });
const productSchema = new mongoose.Schema({ sku: String, name: String, description: String, category: mongoose.Schema.Types.ObjectId, supplier: mongoose.Schema.Types.ObjectId, costPrice: Number, sellingPrice: Number, unit: { type: String, default: 'pcs' }, stock: { quantity: Number, reserved: { type: Number, default: 0 }, available: Number, minStock: Number, maxStock: Number, reorderPoint: Number, reorderQuantity: Number }, warehouse: mongoose.Schema.Types.ObjectId, isActive: { type: Boolean, default: true }, taxRate: { type: Number, default: 0 }, totalSold: { type: Number, default: 0 } }, { timestamps: true });
const supplierSchema = new mongoose.Schema({ supplierId: String, companyName: String, contactPerson: String, email: { type: String, unique: true }, phone: String, category: String, paymentTerms: String, currency: { type: String, default: 'USD' }, rating: Number, totalPurchases: { type: Number, default: 0 }, totalSpend: { type: Number, default: 0 }, isActive: { type: Boolean, default: true } }, { timestamps: true });
const customerSchema = new mongoose.Schema({ customerId: String, type: String, firstName: String, lastName: String, companyName: String, email: { type: String, unique: true }, phone: String, address: { city: String, country: String }, category: { type: String, default: 'regular' }, creditLimit: Number, totalOrders: { type: Number, default: 0 }, totalRevenue: { type: Number, default: 0 }, currency: { type: String, default: 'USD' }, isActive: { type: Boolean, default: true } }, { timestamps: true });
const accountSchema = new mongoose.Schema({ name: String, type: String, accountNumber: String, bankName: String, balance: { type: Number, default: 0 }, currency: { type: String, default: 'USD' }, isActive: { type: Boolean, default: true } }, { timestamps: true });
const transactionSchema = new mongoose.Schema({ transactionId: String, type: String, category: String, amount: Number, currency: { type: String, default: 'USD' }, date: Date, description: String, paymentMethod: String, status: { type: String, default: 'completed' }, createdBy: mongoose.Schema.Types.ObjectId }, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Department = mongoose.model('Department', deptSchema);
const Employee = mongoose.model('Employee', empSchema);
const Category = mongoose.model('Category', catSchema);
const Warehouse = mongoose.model('Warehouse', whSchema);
const Product = mongoose.model('Product', productSchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Account = mongoose.model('Account', accountSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB...');

  await Promise.all([User.deleteMany(), Department.deleteMany(), Employee.deleteMany(), Category.deleteMany(), Warehouse.deleteMany(), Product.deleteMany(), Supplier.deleteMany(), Customer.deleteMany(), Account.deleteMany(), Transaction.deleteMany()]);
  console.log('Cleared existing data');

  const hashedPasswords = await Promise.all([
    bcrypt.hash('Admin@123456', 12),
    bcrypt.hash('Hr@123456', 12),
    bcrypt.hash('Finance@123456', 12),
    bcrypt.hash('Inventory@123456', 12),
    bcrypt.hash('Sales@123456', 12),
    bcrypt.hash('Employee@123456', 12),
  ]);

  const depts = await Department.insertMany([
    { name: 'Engineering', code: 'ENG', description: 'Software development', budget: 500000 },
    { name: 'Human Resources', code: 'HR', description: 'HR and talent', budget: 150000 },
    { name: 'Finance', code: 'FIN', description: 'Financial operations', budget: 200000 },
    { name: 'Sales', code: 'SAL', description: 'Sales and BD', budget: 300000 },
    { name: 'Marketing', code: 'MKT', description: 'Marketing', budget: 250000 },
    { name: 'Operations', code: 'OPS', description: 'Operations', budget: 180000 },
    { name: 'Inventory', code: 'INV', description: 'Inventory management', budget: 120000 },
  ]);

  const usersData = [
    { firstName: 'Alex', lastName: 'Johnson', email: 'admin@erpsystem.com', password: hashedPasswords[0], role: 'super_admin', department: depts[0]._id },
    { firstName: 'Sarah', lastName: 'Williams', email: 'hr@erpsystem.com', password: hashedPasswords[1], role: 'hr_manager', department: depts[1]._id },
    { firstName: 'Michael', lastName: 'Chen', email: 'finance@erpsystem.com', password: hashedPasswords[2], role: 'finance_manager', department: depts[2]._id },
    { firstName: 'Emily', lastName: 'Davis', email: 'inventory@erpsystem.com', password: hashedPasswords[3], role: 'inventory_manager', department: depts[6]._id },
    { firstName: 'James', lastName: 'Wilson', email: 'sales@erpsystem.com', password: hashedPasswords[4], role: 'sales_manager', department: depts[3]._id },
    { firstName: 'Olivia', lastName: 'Brown', email: 'emp1@erpsystem.com', password: hashedPasswords[5], role: 'employee', department: depts[0]._id },
    { firstName: 'Liam', lastName: 'Martinez', email: 'emp2@erpsystem.com', password: hashedPasswords[5], role: 'employee', department: depts[3]._id },
    { firstName: 'Sophia', lastName: 'Anderson', email: 'emp3@erpsystem.com', password: hashedPasswords[5], role: 'employee', department: depts[4]._id },
    { firstName: 'Noah', lastName: 'Taylor', email: 'emp4@erpsystem.com', password: hashedPasswords[5], role: 'employee', department: depts[0]._id },
    { firstName: 'Emma', lastName: 'Thomas', email: 'emp5@erpsystem.com', password: hashedPasswords[5], role: 'employee', department: depts[5]._id },
  ];

  const users = await User.insertMany(usersData);
  console.log('Created 10 users');

  await Department.findByIdAndUpdate(depts[0]._id, { manager: users[0]._id });
  await Department.findByIdAndUpdate(depts[1]._id, { manager: users[1]._id });
  await Department.findByIdAndUpdate(depts[2]._id, { manager: users[2]._id });
  await Department.findByIdAndUpdate(depts[3]._id, { manager: users[4]._id });

  const positions = ['CTO', 'HR Director', 'CFO', 'Inventory Manager', 'Sales Director', 'Senior Dev', 'Account Exec', 'Marketing Mgr', 'DevOps', 'Operations Coord'];
  await Employee.insertMany(users.map((u, i) => ({
    user: u._id, employeeId: `EMP-${String(1000 + i).padStart(6, '0')}`,
    department: u.department, position: positions[i],
    startDate: new Date(2022, i % 12, (i % 28) + 1),
    salary: { base: 55000 + i * 7000, currency: 'USD', paymentFrequency: 'monthly' },
    skills: ['Communication', 'Leadership', 'Problem Solving'].slice(0, (i % 3) + 1),
  })));
  console.log('Created employees');

  const cats = await Category.insertMany([
    { name: 'Electronics', slug: 'electronics', description: 'Electronic devices' },
    { name: 'Office Supplies', slug: 'office-supplies', description: 'Office stationery' },
    { name: 'Hardware', slug: 'hardware', description: 'Computer hardware' },
    { name: 'Furniture', slug: 'furniture', description: 'Office furniture' },
    { name: 'Software', slug: 'software', description: 'Software licenses' },
  ]);

  const suppliers = await Supplier.insertMany([
    { supplierId: 'SUP-000001', companyName: 'TechParts Co.', contactPerson: 'David Lee', email: 'david@techparts.com', phone: '+1-555-0201', category: 'Electronics', paymentTerms: 'Net 30', rating: 5 },
    { supplierId: 'SUP-000002', companyName: 'Office Direct', contactPerson: 'Jennifer White', email: 'jennifer@osd.com', phone: '+1-555-0202', category: 'Office', paymentTerms: 'Net 15', rating: 4 },
    { supplierId: 'SUP-000003', companyName: 'Global Hardware', contactPerson: 'Thomas Harris', email: 'thomas@globalhw.com', phone: '+1-555-0203', category: 'Hardware', paymentTerms: 'Net 45', rating: 4 },
  ]);

  const wh = await Warehouse.create({ name: 'Main Warehouse', code: 'WH-001', address: { city: 'New York', country: 'USA' }, capacity: 10000, currentUsage: 3500 });

  await Product.insertMany([
    { sku: 'LAPTOP-001', name: 'Business Laptop 15"', description: 'High-performance laptop', category: cats[2]._id, supplier: suppliers[0]._id, costPrice: 800, sellingPrice: 1200, stock: { quantity: 50, available: 45, reserved: 5, minStock: 10, maxStock: 200, reorderPoint: 20, reorderQuantity: 50 }, warehouse: wh._id },
    { sku: 'MONITOR-001', name: '27" 4K Monitor', description: 'Ultra HD monitor', category: cats[2]._id, supplier: suppliers[0]._id, costPrice: 350, sellingPrice: 550, stock: { quantity: 30, available: 28, reserved: 2, minStock: 5, maxStock: 100, reorderPoint: 10, reorderQuantity: 30 }, warehouse: wh._id },
    { sku: 'KEYBOARD-001', name: 'Mechanical Keyboard', description: 'RGB keyboard', category: cats[0]._id, supplier: suppliers[0]._id, costPrice: 80, sellingPrice: 150, stock: { quantity: 8, available: 7, reserved: 1, minStock: 10, maxStock: 200, reorderPoint: 15, reorderQuantity: 50 }, warehouse: wh._id },
    { sku: 'PAPER-A4-001', name: 'A4 Copy Paper (500 sheets)', description: 'Premium A4 paper', category: cats[1]._id, supplier: suppliers[1]._id, costPrice: 5, sellingPrice: 8, unit: 'ream', stock: { quantity: 500, available: 480, reserved: 20, minStock: 100, maxStock: 2000, reorderPoint: 200, reorderQuantity: 500 }, warehouse: wh._id },
    { sku: 'CHAIR-001', name: 'Ergonomic Office Chair', description: 'Premium ergonomic chair', category: cats[3]._id, supplier: suppliers[1]._id, costPrice: 200, sellingPrice: 350, stock: { quantity: 25, available: 22, reserved: 3, minStock: 5, maxStock: 100, reorderPoint: 10, reorderQuantity: 20 }, warehouse: wh._id },
    { sku: 'SERVER-001', name: 'Server Rack Unit', description: 'Enterprise server', category: cats[2]._id, supplier: suppliers[2]._id, costPrice: 2500, sellingPrice: 4000, stock: { quantity: 5, available: 5, reserved: 0, minStock: 2, maxStock: 50, reorderPoint: 3, reorderQuantity: 10 }, warehouse: wh._id },
  ]);
  console.log('Created products');

  await Customer.insertMany([
    { customerId: 'CUS-000001', type: 'company', companyName: 'TechCorp Inc.', email: 'contact@techcorp.com', phone: '+1-555-0101', category: 'vip', totalOrders: 45, totalRevenue: 125000 },
    { customerId: 'CUS-000002', type: 'company', companyName: 'Global Solutions Ltd.', email: 'info@globalsol.com', phone: '+1-555-0102', category: 'premium', totalOrders: 23, totalRevenue: 67000 },
    { customerId: 'CUS-000003', type: 'individual', firstName: 'Robert', lastName: 'King', email: 'robert.king@email.com', phone: '+1-555-0103', category: 'regular', totalOrders: 8, totalRevenue: 15000 },
    { customerId: 'CUS-000004', type: 'company', companyName: 'Innovate Systems', email: 'hello@innovate.io', phone: '+1-555-0104', category: 'premium', totalOrders: 31, totalRevenue: 89000 },
    { customerId: 'CUS-000005', type: 'individual', firstName: 'Patricia', lastName: 'Moore', email: 'patricia@email.com', phone: '+1-555-0105', category: 'regular', totalOrders: 5, totalRevenue: 8500 },
  ]);

  const accounts = await Account.insertMany([
    { name: 'Main Business Account', type: 'bank', bankName: 'Chase Bank', accountNumber: '****1234', balance: 250000 },
    { name: 'Operating Cash', type: 'cash', balance: 15000 },
    { name: 'Business Credit Card', type: 'credit', bankName: 'Amex', balance: -8500 },
    { name: 'Savings Account', type: 'bank', bankName: 'Wells Fargo', accountNumber: '****5678', balance: 100000 },
  ]);

  // Sample transactions
  const txns = [];
  const months = [0,1,2,3,4,5,6,7,8,9,10,11];
  for (const m of months) {
    txns.push({ transactionId: `TXN-INC-${m}`, type: 'income', category: 'Sales', amount: 40000 + Math.random() * 30000, date: new Date(2026, m, 15), description: `Monthly sales revenue`, paymentMethod: 'bank_transfer', status: 'completed', createdBy: users[0]._id });
    txns.push({ transactionId: `TXN-EXP-${m}`, type: 'expense', category: 'Salaries', amount: 25000 + Math.random() * 5000, date: new Date(2026, m, 28), description: `Monthly salaries`, paymentMethod: 'bank_transfer', status: 'completed', createdBy: users[2]._id });
    txns.push({ transactionId: `TXN-EXP2-${m}`, type: 'expense', category: 'Operations', amount: 3000 + Math.random() * 2000, date: new Date(2026, m, 10), description: `Operational expenses`, paymentMethod: 'cash', status: 'completed', createdBy: users[2]._id });
  }
  await Transaction.insertMany(txns);
  console.log('Created transactions');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('='.repeat(50));
  console.log('DEFAULT CREDENTIALS:');
  console.log('Super Admin:        admin@erpsystem.com    / Admin@123456');
  console.log('HR Manager:         hr@erpsystem.com       / Hr@123456');
  console.log('Finance Manager:    finance@erpsystem.com  / Finance@123456');
  console.log('Inventory Manager:  inventory@erpsystem.com/ Inventory@123456');
  console.log('Sales Manager:      sales@erpsystem.com    / Sales@123456');
  console.log('Employee:           emp1@erpsystem.com     / Employee@123456');
  console.log('='.repeat(50));

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
