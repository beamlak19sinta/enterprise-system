'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { salesApi, customerApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Table, Pagination } from '@/components/ui/Table';
import { ShoppingCart, Search, Eye } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SalesOrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.orderStatus = statusFilter;
      if (search) params.search = search;
      const res = await salesApi.getOrders(params);
      setOrders(res.data.data.orders);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    salesApi.getStats().then(r => setStats(r.data.data)).catch(() => {});
    fetchOrders(1);
  }, [statusFilter]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await salesApi.updateStatus(id, status, '');
      toast.success('Order status updated');
      fetchOrders(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const columns = [
    { key: 'orderNumber', header: 'Order #', render: (row) => <span className="font-mono text-sm font-medium text-primary-600">{row.orderNumber}</span> },
    { key: 'customer', header: 'Customer', render: (row) => {
      const c = row.customer;
      return c ? <span className="text-sm">{c.type === 'company' ? c.companyName : `${c.firstName} ${c.lastName}`}</span> : '—';
    }},
    { key: 'total', header: 'Total', render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span> },
    { key: 'orderStatus', header: 'Order Status', render: (row) => <span className={`badge ${getStatusColor(row.orderStatus)}`}>{row.orderStatus}</span> },
    { key: 'paymentStatus', header: 'Payment', render: (row) => <span className={`badge ${getStatusColor(row.paymentStatus)}`}>{row.paymentStatus}</span> },
    { key: 'createdAt', header: 'Date', render: (row) => formatDate(row.createdAt) },
    { key: 'actions', header: '', render: (row) => (
      <div className="flex gap-1 flex-wrap">
        <Link href={`/sales/orders/${row._id}`} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors" title="View"><Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" /></Link>
        {row.orderStatus === 'pending' && <button onClick={() => handleStatusUpdate(row._id, 'confirmed')} className="px-2.5 py-1.5 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">Confirm</button>}
        {row.orderStatus === 'confirmed' && <button onClick={() => handleStatusUpdate(row._id, 'processing')} className="px-2.5 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">Process</button>}
        {row.orderStatus === 'processing' && <button onClick={() => handleStatusUpdate(row._id, 'shipped')} className="px-2.5 py-1.5 text-xs rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">Ship</button>}
        {row.orderStatus === 'shipped' && <button onClick={() => handleStatusUpdate(row._id, 'delivered')} className="px-2.5 py-1.5 text-xs rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors">Deliver</button>}
      </div>
    )},
  ];

  const statusOptions = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="section-title flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary-500" />Sales Orders</h1>
            <p className="text-sm text-gray-500">{pagination.total} orders</p>
          </div>
          <Link href="/sales/orders/new">
            <Button>+ New Order</Button>
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: stats.totalOrders },
              { label: 'This Month', value: stats.monthOrders },
              { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue) },
              { label: 'Pending', value: stats.byStatus?.find(s => s._id === 'pending')?.count || 0 },
            ].map((s, i) => (
              <div key={i} className="card p-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="card p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); }} onKeyDown={e => e.key === 'Enter' && fetchOrders(1)} placeholder="Search order number..." className="input-field pl-9 w-full" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>

        <div className="card">
          <Table columns={columns} data={orders} loading={loading} emptyMessage="No orders found" />
          <Pagination {...pagination} onChange={fetchOrders} />
        </div>
      </div>
    </DashboardLayout>
  );
}
