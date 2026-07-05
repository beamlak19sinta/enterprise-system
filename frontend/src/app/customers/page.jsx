'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { customerApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { UserCheck, Plus, Search, Eye, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ defaultValues: { type: 'company', category: 'regular' } });

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await customerApi.getAll(params);
      setCustomers(res.data.data.customers);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(1); }, [search, categoryFilter]);

  const openEdit = (c) => {
    setEditing(c);
    Object.keys(c).forEach(k => setValue(k, c[k]));
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) { await customerApi.update(editing._id, data); toast.success('Customer updated!'); }
      else { await customerApi.create(data); toast.success('Customer created!'); }
      setShowModal(false); reset(); fetchCustomers(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await customerApi.delete(selected); toast.success('Customer deleted'); setShowDelete(false); fetchCustomers(1); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };

  const categoryBadgeColor = { regular: 'bg-gray-100 text-gray-600', premium: 'bg-blue-100 text-blue-700', vip: 'bg-purple-100 text-purple-700', inactive: 'bg-red-100 text-red-600' };

  const columns = [
    { key: 'name', header: 'Customer', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {(row.companyName || row.firstName)?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-sm text-gray-900 dark:text-white">{row.companyName || `${row.firstName} ${row.lastName}`}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'type', header: 'Type', render: (row) => <span className="capitalize text-sm">{row.type}</span> },
    { key: 'category', header: 'Category', render: (row) => <span className={`badge ${categoryBadgeColor[row.category] || 'bg-gray-100 text-gray-600'}`}>{row.category}</span> },
    { key: 'totalOrders', header: 'Orders' },
    { key: 'totalRevenue', header: 'Revenue', render: (row) => formatCurrency(row.totalRevenue || 0) },
    { key: 'isActive', header: 'Status', render: (row) => <span className={`badge ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{row.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', header: '', render: (row) => (
      <div className="flex gap-1">
        <Link href={`/customers/${row._id}`}><button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-500 transition-colors"><Eye className="w-4 h-4" /></button></Link>
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { setSelected(row._id); setShowDelete(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div><h1 className="section-title flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary-500" />Customers</h1><p className="text-sm text-gray-500">{pagination.total} customers</p></div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setEditing(null); reset(); setShowModal(true); }}>Add Customer</Button>
        </div>
        <div className="card p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="input-field pl-9" /></div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="input-field w-auto">
            <option value="">All Categories</option><option value="regular">Regular</option><option value="premium">Premium</option><option value="vip">VIP</option>
          </select>
        </div>
        <div className="card"><Table columns={columns} data={customers} loading={loading} emptyMessage="No customers found" /><Pagination {...pagination} onChange={fetchCustomers} /></div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'} size="lg"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editing ? 'Update' : 'Create'}</Button></div>}>
        <form className="grid grid-cols-2 gap-4">
          <Select label="Type" options={[{ value: 'company', label: 'Company' }, { value: 'individual', label: 'Individual' }]} {...register('type')} />
          <Select label="Category" options={[{ value: 'regular', label: 'Regular' }, { value: 'premium', label: 'Premium' }, { value: 'vip', label: 'VIP' }]} {...register('category')} />
          <Input label="Company Name" {...register('companyName')} placeholder="Acme Corp" />
          <Input label="Email" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
          <Input label="First Name" {...register('firstName')} />
          <Input label="Last Name" {...register('lastName')} />
          <Input label="Phone" {...register('phone')} />
          <Input label="Website" {...register('website')} placeholder="https://..." />
          <Input label="City" {...register('address.city')} />
          <Input label="Country" {...register('address.country')} />
          <Input label="Credit Limit (USD)" type="number" {...register('creditLimit')} />
          <Input label="Tax ID" {...register('taxId')} />
        </form>
      </Modal>
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Customer" message="Are you sure? Customers with orders will be deactivated instead." confirmLabel="Delete" variant="danger" />
    </DashboardLayout>
  );
}
