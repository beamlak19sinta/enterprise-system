import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') {
      Cookies.remove('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject({
      message: error.response?.data?.message || 'Something went wrong',
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: object) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.patch(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
  updateProfile: (data: object) => api.patch('/auth/update-profile', data),
  changePassword: (data: object) => api.patch('/auth/change-password', data),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRevenueChart: () => api.get('/dashboard/charts/revenue'),
  getSalesChart: () => api.get('/dashboard/charts/sales'),
  getEmployeeChart: () => api.get('/dashboard/charts/employees'),
  getInventoryChart: () => api.get('/dashboard/charts/inventory'),
  getActivities: () => api.get('/dashboard/activities'),
  getNotifications: () => api.get('/dashboard/notifications'),
  markRead: (id: string) => api.patch(`/dashboard/notifications/${id}/read`),
  markAllRead: () => api.patch('/dashboard/notifications/read-all'),
};

// Employees
export const employeeApi = {
  getAll: (params?: object) => api.get('/employees', { params }),
  getOne: (id: string) => api.get(`/employees/${id}`),
  create: (data: object) => api.post('/employees', data),
  update: (id: string, data: object) => api.patch(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getProfile: () => api.get('/employees/profile'),
  getStats: () => api.get('/employees/stats'),
  uploadDocument: (id: string, formData: FormData) =>
    api.post(`/employees/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Departments
export const departmentApi = {
  getAll: (params?: object) => api.get('/departments', { params }),
  getOne: (id: string) => api.get(`/departments/${id}`),
  create: (data: object) => api.post('/departments', data),
  update: (id: string, data: object) => api.patch(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
  getEmployees: (id: string) => api.get(`/departments/${id}/employees`),
  assignManager: (id: string, managerId: string) => api.patch(`/departments/${id}/manager`, { managerId }),
};

// Attendance
export const attendanceApi = {
  getAll: (params?: object) => api.get('/attendance', { params }),
  getMy: (params?: object) => api.get('/attendance/my', { params }),
  checkIn: () => api.post('/attendance/check-in'),
  checkOut: () => api.post('/attendance/check-out'),
  create: (data: object) => api.post('/attendance', data),
  update: (id: string, data: object) => api.patch(`/attendance/${id}`, data),
};

// Leaves
export const leaveApi = {
  getAll: (params?: object) => api.get('/leaves', { params }),
  getOne: (id: string) => api.get(`/leaves/${id}`),
  create: (data: object) => api.post('/leaves', data),
  approve: (id: string) => api.patch(`/leaves/${id}/approve`),
  reject: (id: string, reason: string) => api.patch(`/leaves/${id}/reject`, { reason }),
  cancel: (id: string) => api.patch(`/leaves/${id}/cancel`),
};

// Payroll
export const payrollApi = {
  getAll: (params?: object) => api.get('/payroll', { params }),
  getSummary: (params?: object) => api.get('/payroll/summary', { params }),
  generate: (data: object) => api.post('/payroll/generate', data),
  approve: (id: string) => api.patch(`/payroll/${id}/approve`),
  pay: (id: string, data: object) => api.patch(`/payroll/${id}/pay`, data),
};

// Customers
export const customerApi = {
  getAll: (params?: object) => api.get('/customers', { params }),
  getOne: (id: string) => api.get(`/customers/${id}`),
  create: (data: object) => api.post('/customers', data),
  update: (id: string, data: object) => api.patch(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getOrders: (id: string, params?: object) => api.get(`/customers/${id}/orders`, { params }),
  getStats: () => api.get('/customers/stats'),
};

// Suppliers
export const supplierApi = {
  getAll: (params?: object) => api.get('/suppliers', { params }),
  getOne: (id: string) => api.get(`/suppliers/${id}`),
  create: (data: object) => api.post('/suppliers', data),
  update: (id: string, data: object) => api.patch(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
  getPurchases: (id: string) => api.get(`/suppliers/${id}/purchases`),
};

// Inventory
export const inventoryApi = {
  getProducts: (params?: object) => api.get('/inventory/products', { params }),
  getProduct: (id: string) => api.get(`/inventory/products/${id}`),
  createProduct: (data: object) => api.post('/inventory/products', data),
  updateProduct: (id: string, data: object) => api.patch(`/inventory/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/inventory/products/${id}`),
  adjustStock: (id: string, data: object) => api.patch(`/inventory/products/${id}/stock`, data),
  getLowStock: () => api.get('/inventory/low-stock'),
  getStats: () => api.get('/inventory/stats'),
  getCategories: () => api.get('/inventory/categories'),
  createCategory: (data: object) => api.post('/inventory/categories', data),
  updateCategory: (id: string, data: object) => api.patch(`/inventory/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/inventory/categories/${id}`),
  getWarehouses: () => api.get('/inventory/warehouses'),
  createWarehouse: (data: object) => api.post('/inventory/warehouses', data),
  updateWarehouse: (id: string, data: object) => api.patch(`/inventory/warehouses/${id}`, data),
};

// Sales
export const salesApi = {
  getOrders: (params?: object) => api.get('/sales/orders', { params }),
  getOrder: (id: string) => api.get(`/sales/orders/${id}`),
  createOrder: (data: object) => api.post('/sales/orders', data),
  updateOrder: (id: string, data: object) => api.patch(`/sales/orders/${id}`, data),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/sales/orders/${id}/status`, { status, reason }),
  recordPayment: (id: string, data: object) => api.post(`/sales/orders/${id}/payment`, data),
  getStats: () => api.get('/sales/stats'),
};

// Purchases
export const purchaseApi = {
  getAll: (params?: object) => api.get('/purchases', { params }),
  getOne: (id: string) => api.get(`/purchases/${id}`),
  create: (data: object) => api.post('/purchases', data),
  approve: (id: string) => api.patch(`/purchases/${id}/approve`),
  receive: (id: string, data: object) => api.patch(`/purchases/${id}/receive`, data),
  recordPayment: (id: string, data: object) => api.post(`/purchases/${id}/payment`, data),
};

// Finance
export const financeApi = {
  getTransactions: (params?: object) => api.get('/finance/transactions', { params }),
  createTransaction: (data: object) => api.post('/finance/transactions', data),
  updateTransaction: (id: string, data: object) => api.patch(`/finance/transactions/${id}`, data),
  deleteTransaction: (id: string) => api.delete(`/finance/transactions/${id}`),
  getAccounts: () => api.get('/finance/accounts'),
  createAccount: (data: object) => api.post('/finance/accounts', data),
  updateAccount: (id: string, data: object) => api.patch(`/finance/accounts/${id}`, data),
  getBudgets: (params?: object) => api.get('/finance/budgets', { params }),
  createBudget: (data: object) => api.post('/finance/budgets', data),
  updateBudget: (id: string, data: object) => api.patch(`/finance/budgets/${id}`, data),
  getSummary: (params?: object) => api.get('/finance/summary', { params }),
  getProfitLoss: (params?: object) => api.get('/finance/profit-loss', { params }),
  getCashFlow: () => api.get('/finance/cash-flow'),
};

// Reports
export const reportApi = {
  getEmployees: (params?: object) => api.get('/reports/employees', { params }),
  getSales: (params?: object) => api.get('/reports/sales', { params }),
  getFinance: (params?: object) => api.get('/reports/finance', { params }),
  getInventory: (params?: object) => api.get('/reports/inventory', { params }),
  getPurchases: (params?: object) => api.get('/reports/purchases', { params }),
  exportPDF: (data: object) => api.post('/reports/export/pdf', data, { responseType: 'blob' }),
  exportExcel: (data: object) => api.post('/reports/export/excel', data, { responseType: 'blob' }),
};

// Search
export const searchApi = {
  search: (q: string) => api.get('/search', { params: { q } }),
};

// Users (admin)
export const userApi = {
  getAll: (params?: object) => api.get('/users', { params }),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: object) => api.post('/users', data),
  update: (id: string, data: object) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
