import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const formatDate = (date: string | Date) =>
  format(new Date(date), 'MMM dd, yyyy');

export const formatDateTime = (date: string | Date) =>
  format(new Date(date), 'MMM dd, yyyy HH:mm');

export const timeAgo = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const getInitials = (firstName: string, lastName?: string) =>
  `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

export const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    hr_manager: 'HR Manager',
    finance_manager: 'Finance Manager',
    inventory_manager: 'Inventory Manager',
    sales_manager: 'Sales Manager',
    employee: 'Employee',
  };
  return labels[role] || role;
};

export const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    hr_manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    finance_manager: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    inventory_manager: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    sales_manager: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    employee: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
  return colors[role] || 'bg-gray-100 text-gray-700';
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-600',
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-red-100 text-red-700',
    partial: 'bg-yellow-100 text-yellow-700',
    delivered: 'bg-green-100 text-green-700',
    shipped: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    confirmed: 'bg-indigo-100 text-indigo-700',
    draft: 'bg-gray-100 text-gray-600',
    overdue: 'bg-red-100 text-red-700',
    received: 'bg-green-100 text-green-700',
    on_leave: 'bg-orange-100 text-orange-700',
    terminated: 'bg-red-100 text-red-700',
    probation: 'bg-yellow-100 text-yellow-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
};

export const truncate = (str: string, length: number) =>
  str?.length > length ? `${str.substring(0, length)}...` : str;

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  hr_manager: ['employees', 'departments', 'attendance', 'leaves', 'payroll', 'performance'],
  finance_manager: ['finance', 'payroll', 'reports', 'purchases'],
  inventory_manager: ['inventory', 'suppliers', 'purchases', 'reports'],
  sales_manager: ['sales', 'customers', 'reports'],
  employee: ['attendance', 'leaves', 'payroll', 'performance'],
};

export const hasPermission = (role: string, resource: string) => {
  if (!role) return false;
  const perms = PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(resource);
};
