'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { inventoryApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Building2, Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchWarehouses = async () => {
    setLoading(true);
    try { const res = await inventoryApi.getWarehouses(); setWarehouses(res.data.data.warehouses); }
    catch { toast.error('Failed to load warehouses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editItem) { await inventoryApi.updateWarehouse(editItem._id, data); toast.success('Warehouse updated!'); setEditItem(null); }
      else { await inventoryApi.createWarehouse(data); toast.success('Warehouse created!'); setShowCreate(false); }
      reset(); fetchWarehouses();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleEdit = (wh) => {
    setEditItem(wh);
    setValue('name', wh.name); setValue('code', wh.code);
    setValue('capacity', wh.capacity); setValue('address.city', wh.address?.city); setValue('address.country', wh.address?.country);
  };

  const usagePct = (wh) => wh.capacity > 0 ? Math.round((wh.currentUsage / wh.capacity) * 100) : 0;

  const columns = [
    { key: 'name', header: 'Warehouse', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'code', header: 'Code', render: (row) => <span className="font-mono text-xs text-gray-500">{row.code}</span> },
    { key: 'address', header: 'Location', render: (row) => row.address ? `${row.address.city || ''}, ${row.address.country || ''}`.trim().replace(/^,|,$/, '') : '—' },
    { key: 'capacity', header: 'Capacity / Usage', render: (row) => (
      <div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-24">
            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${usagePct(row)}%` }} />
          </div>
          <span className="text-xs text-gray-500">{usagePct(row)}%</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{row.currentUsage} / {row.capacity} units</p>
      </div>
    )},
    { key: 'manager', header: 'Manager', render: (row) => row.manager ? `${row.manager.firstName} ${row.manager.lastName}` : '—' },
    { key: 'actions', header: '', render: (row) => (
      <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
    )},
  ];

  const modalOpen = showCreate || !!editItem;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <h1 className="section-title flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-500" />Warehouses</h1>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setShowCreate(true); setEditItem(null); reset(); }}>Add Warehouse</Button>
        </div>
        <div className="card">
          <Table columns={columns} data={warehouses} loading={loading} emptyMessage="No warehouses yet" />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setShowCreate(false); setEditItem(null); reset(); }} title={editItem ? 'Edit Warehouse' : 'Add Warehouse'} size="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => { setShowCreate(false); setEditItem(null); reset(); }}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editItem ? 'Save Changes' : 'Create'}</Button></div>}>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
            <Input label="Code" {...register('code', { required: 'Required' })} placeholder="WH-001" error={errors.code?.message} />
          </div>
          <Input label="Capacity (units)" type="number" {...register('capacity')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" {...register('address.city')} />
            <Input label="Country" {...register('address.country')} />
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
