'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { salesApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useForm } from 'react-hook-form';

export default function OrderDetailPage({ params }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm();

  const fetchOrder = async () => {
    try {
      const res = await salesApi.getOrder(params.id);
      setOrder(res.data.data.order);
    } catch { toast.error('Failed to load order'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrder(); }, [params.id]);

  const handleStatusUpdate = async (status) => {
    try {
      await salesApi.updateStatus(params.id, status, '');
      toast.success('Status updated');
      fetchOrder();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const onPayment = async (data) => {
    setSaving(true);
    try {
      await salesApi.recordPayment(params.id, { amount: Number(data.amount), paymentMethod: data.paymentMethod });
      toast.success('Payment recorded!');
      setShowPayment(false);
      fetchOrder();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64"><div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 animate-pulse" /></div></DashboardLayout>;
  if (!order) return <DashboardLayout><div className="text-center py-20 text-gray-400">Order not found</div></DashboardLayout>;

  const nextStatusMap = { pending: 'confirmed', confirmed: 'processing', processing: 'shipped', shipped: 'delivered' };
  const nextStatus = nextStatusMap[order.orderStatus];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in max-w-5xl">
        <div className="flex items-center gap-3">
          <Link href="/sales/orders" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>
            <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
          </div>
          <span className={`badge ${getStatusColor(order.orderStatus)} text-sm`}>{order.orderStatus}</span>
          <span className={`badge ${getStatusColor(order.paymentStatus)} text-sm`}>{order.paymentStatus}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Customer</h3>
            <p className="font-medium text-gray-900 dark:text-white">
              {order.customer?.type === 'company' ? order.customer.companyName : `${order.customer?.firstName} ${order.customer?.lastName}`}
            </p>
            <p className="text-sm text-gray-500">{order.customer?.email}</p>
            <p className="text-sm text-gray-500">{order.customer?.phone}</p>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Summary</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.discountAmount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-red-500">-{formatCurrency(order.discountAmount)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>{formatCurrency(order.taxAmount)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1.5"><span>Total</span><span>{formatCurrency(order.total)}</span></div>
              <div className="flex justify-between text-sm text-green-600"><span>Paid</span><span>{formatCurrency(order.paidAmount)}</span></div>
              <div className="flex justify-between text-sm text-red-500"><span>Balance</span><span>{formatCurrency(order.total - order.paidAmount)}</span></div>
            </div>
          </div>
          <div className="card p-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Actions</h3>
            {nextStatus && (
              <Button className="w-full" onClick={() => handleStatusUpdate(nextStatus)}>
                Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
              </Button>
            )}
            {order.paymentStatus !== 'paid' && (
              <Button variant="secondary" className="w-full" icon={<CreditCard className="w-4 h-4" />} onClick={() => setShowPayment(true)}>
                Record Payment
              </Button>
            )}
            {['pending', 'confirmed'].includes(order.orderStatus) && (
              <Button variant="danger" className="w-full" onClick={() => handleStatusUpdate('cancelled')}>Cancel Order</Button>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="card">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Order Items ({order.items?.length || 0})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  {['Product', 'SKU', 'Qty', 'Unit Price', 'Discount', 'Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {order.items?.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{item.sku}</td>
                    <td className="px-4 py-3 text-sm">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-sm text-red-400">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Record Payment" size="sm"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowPayment(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onPayment)}>Record Payment</Button></div>}>
        <form className="space-y-4">
          <p className="text-sm text-gray-500">Outstanding: <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(order.total - order.paidAmount)}</span></p>
          <Input label="Amount" type="number" {...register('amount', { required: 'Required' })} placeholder="0.00" />
          <Select label="Payment Method" options={[
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'cash', label: 'Cash' },
            { value: 'credit_card', label: 'Credit Card' },
            { value: 'check', label: 'Check' },
          ]} {...register('paymentMethod', { required: 'Required' })} />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
