'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { purchaseApi, supplierApi, inventoryApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { Receipt, Plus, Search, CheckCircle, Package } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState([{ productId: '', name: '', quantity: 1, unitCost: 0 }]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchPurchases = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await purchaseApi.getAll(params);
      setPurchases(res.data.data.purchases);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPurchases(1); }, [statusFilter]);
  useEffect(() => { supplierApi.getAll({ limit: 100 }).then(r => setSuppliers(r.data.data.suppliers)).catch(() => {}); }, []);

  const handleApprove = async (id) => {
    try { await purchaseApi.approve(id); toast.success('Purchase approved'); fetchPurchases(pagination.page); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const validItems = items.filter(i => i.name && i.quantity > 0 && i.unitCost > 0);
      if (!validItems.length) { toast.error('Add at least one item'); return; }
      await purchaseApi.create({
        ...data,
        items: validItems.map(i => ({ product: i.productId || undefined, name: i.name, sku: i.name.toUpperCase().replace(' ', '-'), quantity: i.quantity, unitCost: i.unitCost })),
      });
      toast.success('Purchase order created!');
      setShowCreate(false); reset();
      setItems([{ productId: '', name: '', quantity: 1, unitCost: 0 }]);
      fetchPurchases(1);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const addItem = () => setItems([...items, { productId: '', name: '', quantity: 1, unitCost: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => { const newItems = [...items]; newItems[i][field] = value; setItems(newItems); };

  const columns = [
    { key: 'purchaseNumber', header: 'PO Number', render: (row) => <span className="font-mono text-sm font-medium text-primary-600">{row.purchaseNumber}</span> },
    { key: 'supplier', header: 'Supplier', render: (row) => row.supplier?.companyName || '—' },
    { key: 'total', header: 'Total', render: (row) => <span className="font-semibold">{formatCurrency(row.total)}</span> },
    { key: 'status', header: 'Status', render: (row) => <span className={`badge ${getStatusColor(row.status)}`}>{row.status}</span> },
    { key: 'paymentStatus', header: 'Payment', render: (row) => <span className={`badge ${getStatusColor(row.paymentStatus)}`}>{row.paymentStatus}</span> },
    { key: 'expectedDate', header: 'Expected', render: (row) => row.expectedDate ? formatDate(row.expectedDate) : '—' },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    { key: 'actions', header: '', render: (row) => (
      <div className="flex gap-1">
        {row.status === 'pending' && <button onClick={() => handleApprove(row._id)} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>}
      </div>
    )},
  ];

  const supplierOptions = [{ value: '', label: 'Select Supplier' }, ...suppliers.map(s => ({ value: s._id, label: s.companyName }))];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div><h1 className="section-title flex items-center gap-2"><Receipt className="w-5 h-5 text-primary-500" />Purchase Orders</h1><p className="text-sm text-gray-500">{pagination.total} orders</p></div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>New Purchase Order</Button>
        </div>
        <div className="card p-4">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="">All Status</option><option value="draft">Draft</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="received">Received</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="card"><Table columns={columns} data={purchases} loading={loading} emptyMessage="No purchase orders" /><Pagination {...pagination} onChange={fetchPurchases} /></div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Purchase Order" size="xl"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create PO</Button></div>}>
        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Supplier" options={supplierOptions} {...register('supplier', { required: 'Required' })} error={errors.supplier?.message} />
            <Input label="Expected Delivery Date" type="date" {...register('expectedDate')} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Items</h4>
              <Button variant="secondary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={addItem}>Add Item</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 items-end">
                  <Input label={i === 0 ? 'Product Name' : ''} value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Product name" />
                  <Input label={i === 0 ? 'Qty' : ''} type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} min={1} />
                  <Input label={i === 0 ? 'Unit Cost' : ''} type="number" value={item.unitCost} onChange={e => updateItem(i, 'unitCost', Number(e.target.value))} step="0.01" />
                  <div className="flex items-end gap-2">
                    <div className="input-field bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm">{formatCurrency(item.quantity * item.unitCost)}</div>
                    {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="btn-danger px-2 py-2.5 text-xs">×</button>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Total: {formatCurrency(items.reduce((s, i) => s + i.quantity * i.unitCost, 0))}
              </span>
            </div>
          </div>
          <TextArea label="Notes" {...register('notes')} rows={2} placeholder="Additional notes..." />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
