'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { supplierApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { Truck, Plus, Search, Edit2, Trash2, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchSuppliers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const res = await supplierApi.getAll(params);
      setSuppliers(res.data.data.suppliers);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(1); }, [search]);

  const openEdit = (s) => { setEditing(s); Object.keys(s).forEach(k => setValue(k, s[k])); setShowModal(true); };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) { await supplierApi.update(editing._id, data); toast.success('Supplier updated!'); }
      else { await supplierApi.create(data); toast.success('Supplier created!'); }
      setShowModal(false); reset(); setEditing(null); fetchSuppliers(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await supplierApi.delete(selected); toast.success('Supplier deleted'); setShowDelete(false); fetchSuppliers(1); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };

  const columns = [
    { key: 'companyName', header: 'Supplier', sortable: true, render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center"><Truck className="w-4 h-4 text-orange-500" /></div>
        <div><p className="font-medium text-sm text-gray-900 dark:text-white">{row.companyName}</p><p className="text-xs text-gray-400">{row.email}</p></div>
      </div>
    )},
    { key: 'contactPerson', header: 'Contact' },
    { key: 'category', header: 'Category' },
    { key: 'rating', header: 'Rating', render: (row) => row.rating ? (
      <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < row.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}</div>
    ) : '—' },
    { key: 'totalPurchases', header: 'Purchases' },
    { key: 'totalSpend', header: 'Total Spend', render: (row) => formatCurrency(row.totalSpend || 0) },
    { key: 'isActive', header: 'Status', render: (row) => <span className={`badge ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{row.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', header: '', render: (row) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { setSelected(row._id); setShowDelete(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div><h1 className="section-title flex items-center gap-2"><Truck className="w-5 h-5 text-primary-500" />Suppliers</h1><p className="text-sm text-gray-500">{pagination.total} suppliers</p></div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); reset(); setShowModal(true); }}>Add Supplier</Button>
        </div>
        <div className="card p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..." className="input-field pl-9" /></div></div>
        <div className="card"><Table columns={columns} data={suppliers} loading={loading} emptyMessage="No suppliers found" /><Pagination {...pagination} onChange={fetchSuppliers} /></div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} size="lg"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editing ? 'Update' : 'Create'}</Button></div>}>
        <form className="grid grid-cols-2 gap-4">
          <Input label="Company Name" {...register('companyName', { required: 'Required' })} error={errors.companyName?.message} className="col-span-2" />
          <Input label="Contact Person" {...register('contactPerson')} />
          <Input label="Email" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
          <Input label="Phone" {...register('phone')} />
          <Input label="Category" {...register('category')} placeholder="Electronics, Hardware..." />
          <Input label="Payment Terms" {...register('paymentTerms')} placeholder="Net 30" />
          <Select label="Rating" options={[{ value: '', label: 'No Rating' }, ...['1','2','3','4','5'].map(v => ({ value: v, label: `${v} Star${v !== '1' ? 's' : ''}` }))]} {...register('rating')} />
          <Input label="City" {...register('address.city')} />
          <Input label="Country" {...register('address.country')} />
        </form>
      </Modal>
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Supplier" message="Are you sure?" confirmLabel="Delete" variant="danger" />
    </DashboardLayout>
  );
}
