'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { customerApi } from '@/lib/api';
import { Table } from '@/components/ui/Table';
import { UserCheck, Mail, Phone, Globe, MapPin, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([customerApi.getOne(id), customerApi.getOrders(id)])
      .then(([c, o]) => { setCustomer(c.data.data.customer); setOrders(o.data.data.orders); })
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false));
  }, [id]);

  const orderColumns = [
    { key: 'orderNumber', header: 'Order #', render: r => <span className="font-mono text-primary-600 text-sm">{r.orderNumber}</span> },
    { key: 'total', header: 'Total', render: r => formatCurrency(r.total) },
    { key: 'orderStatus', header: 'Status', render: r => <span className={`badge ${getStatusColor(r.orderStatus)}`}>{r.orderStatus}</span> },
    { key: 'paymentStatus', header: 'Payment', render: r => <span className={`badge ${getStatusColor(r.paymentStatus)}`}>{r.paymentStatus}</span> },
    { key: 'createdAt', header: 'Date', render: r => formatDate(r.createdAt) },
  ];

  if (loading) return <DashboardLayout><div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/customers"><button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button></Link>
          <h1 className="section-title">{customer?.companyName || `${customer?.firstName} ${customer?.lastName}`}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                {(customer?.companyName || customer?.firstName)?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{customer?.companyName || `${customer?.firstName} ${customer?.lastName}`}</h2>
                <span className={`badge mt-1 ${customer?.category === 'vip' ? 'bg-purple-100 text-purple-700' : customer?.category === 'premium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{customer?.category}</span>
              </div>
            </div>
            <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-gray-700">
              {customer?.email && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><Mail className="w-4 h-4 text-gray-400" />{customer.email}</div>}
              {customer?.phone && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><Phone className="w-4 h-4 text-gray-400" />{customer.phone}</div>}
              {customer?.website && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><Globe className="w-4 h-4 text-gray-400" />{customer.website}</div>}
              {customer?.address?.city && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><MapPin className="w-4 h-4 text-gray-400" />{[customer.address.city, customer.address.country].filter(Boolean).join(', ')}</div>}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-2xl font-bold text-gray-900 dark:text-white">{customer?.totalOrders || 0}</p><p className="text-xs text-gray-400">Orders</p></div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-lg font-bold text-green-600">{formatCurrency(customer?.totalRevenue || 0)}</p><p className="text-xs text-gray-400">Revenue</p></div>
            </div>
          </div>

          <div className="lg:col-span-2 card">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700"><h3 className="font-semibold text-gray-900 dark:text-white">Order History</h3></div>
            <Table columns={orderColumns} data={orders} emptyMessage="No orders yet" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
