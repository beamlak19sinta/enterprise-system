'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { salesApi, customerApi, inventoryApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function NewOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: '', name: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { orderStatus: 'pending', paymentMethod: 'bank_transfer' } });

  useEffect(() => {
    customerApi.getAll({ limit: 200, isActive: 'true' }).then(r => setCustomers(r.data.data.customers)).catch(() => {});
    inventoryApi.getProducts({ limit: 200 }).then(r => setProducts(r.data.data.products)).catch(() => {});
  }, []);

  const addItem = () => setItems([...items, { product: '', name: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;
    if (field === 'product') {
      const prod = products.find(p => p._id === value);
      if (prod) { updated[i].name = prod.name; updated[i].unitPrice = prod.sellingPrice; }
    }
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const totalDiscount = items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.discount / 100), 0);
  const totalTax = items.reduce((s, i) => s + ((i.quantity * i.unitPrice - i.quantity * i.unitPrice * i.discount / 100) * i.taxRate / 100), 0);
  const total = subtotal - totalDiscount + totalTax;

  const onSubmit = async (data) => {
    const validItems = items.filter(i => i.product && i.quantity > 0 && i.unitPrice > 0);
    if (!validItems.length) { toast.error('Add at least one item with a product selected'); return; }
    setSaving(true);
    try {
      await salesApi.createOrder({
        customer: data.customer,
        items: validItems,
        shippingCost: Number(data.shippingCost || 0),
        discountAmount: Number(data.discountAmount || 0),
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        orderStatus: 'pending',
      });
      toast.success('Order created!');
      router.push('/sales/orders');
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const custOptions = [{ value: '', label: 'Select Customer' }, ...customers.map(c => ({ value: c._id, label: c.companyName || `${c.firstName} ${c.lastName}` }))];
  const prodOptions = [{ value: '', label: 'Select Product' }, ...products.map(p => ({ value: p._id, label: `${p.name} (${p.sku}) — ${formatCurrency(p.sellingPrice)}` }))];

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/sales/orders"><button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button></Link>
          <h1 className="section-title">New Sales Order</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Order Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Customer *" options={custOptions} {...register('customer', { required: 'Customer is required' })} error={errors.customer?.message} />
              <Select label="Payment Method" options={[
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'cash', label: 'Cash' },
                { value: 'credit_card', label: 'Credit Card' },
                { value: 'check', label: 'Check' },
              ]} {...register('paymentMethod')} />
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">Order Items</h3>
              <Button type="button" variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addItem}>Add Item</Button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                    <select value={item.product} onChange={e => updateItem(i, 'product', e.target.value)} className="input-field text-sm">
                      {prodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                    <input type="number" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                    <input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} className="input-field text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Disc %</label>
                    <input type="number" min={0} max={100} value={item.discount} onChange={e => updateItem(i, 'discount', Number(e.target.value))} className="input-field text-sm" />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Subtotal</label>
                      <div className="input-field bg-gray-100 dark:bg-gray-700 text-gray-600 text-sm">{formatCurrency(item.quantity * item.unitPrice * (1 - item.discount / 100))}</div>
                    </div>
                    {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="p-2.5 mb-0.5 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Adjustments</h3>
              <div className="space-y-3">
                <Input label="Additional Discount ($)" type="number" step="0.01" {...register('discountAmount')} placeholder="0.00" />
                <Input label="Shipping Cost ($)" type="number" step="0.01" {...register('shippingCost')} placeholder="0.00" />
                <Input label="Notes" {...register('notes')} placeholder="Order notes..." />
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Order Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatCurrency(totalDiscount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatCurrency(totalTax)}</span></div>
                <div className="flex justify-between font-bold text-lg border-t pt-2.5"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pb-4">
            <Link href="/sales/orders"><Button type="button" variant="secondary">Cancel</Button></Link>
            <Button type="submit" loading={saving}>Create Order</Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
