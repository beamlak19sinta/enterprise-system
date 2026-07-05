'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { departmentApi, userApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { Building2, Plus, Edit2, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchDepartments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await departmentApi.getAll({ page, limit: 50 });
      setDepartments(res.data.data.departments);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDepartments();
    userApi.getAll({ limit: 100 }).then(r => setManagers(r.data.data.users)).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); reset(); setShowModal(true); };
  const openEdit = (dept) => {
    setEditing(dept);
    setValue('name', dept.name);
    setValue('code', dept.code);
    setValue('description', dept.description || '');
    setValue('budget', dept.budget || '');
    setValue('location', dept.location || '');
    setValue('manager', dept.manager?._id || '');
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await departmentApi.update(editing._id, data);
        toast.success('Department updated!');
      } else {
        await departmentApi.create(data);
        toast.success('Department created!');
      }
      setShowModal(false);
      reset();
      fetchDepartments(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await departmentApi.delete(selected);
      toast.success('Department deleted');
      setShowDelete(false);
      fetchDepartments(1);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const managerOptions = [
    { value: '', label: 'No Manager' },
    ...managers.map(u => ({ value: u._id, label: `${u.firstName} ${u.lastName}` }))
  ];

  const columns = [
    { key: 'name', header: 'Department', sortable: true, render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-primary-500" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm">{row.name}</p>
          <p className="text-xs text-gray-400">{row.code}</p>
        </div>
      </div>
    )},
    { key: 'manager', header: 'Manager', render: (row) => row.manager ? `${row.manager.firstName} ${row.manager.lastName}` : <span className="text-gray-400">—</span> },
    { key: 'employees', header: 'Employees', render: (row) => (
      <span className="flex items-center gap-1.5 text-sm"><Users className="w-3.5 h-3.5 text-gray-400" />{row.employees?.length || 0}</span>
    )},
    { key: 'budget', header: 'Budget', render: (row) => row.budget ? formatCurrency(row.budget) : '—' },
    { key: 'isActive', header: 'Status', render: (row) => (
      <span className={`badge ${row.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
        {row.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { key: 'actions', header: '', render: (row) => (
      <div className="flex items-center gap-1">
        <Link href={`/departments/${row._id}`}><button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-500 transition-colors"><Users className="w-4 h-4" /></button></Link>
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
        <button onClick={() => { setSelected(row._id); setShowDelete(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="section-title flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-500" />Departments</h1>
            <p className="text-sm text-gray-500 mt-0.5">{pagination.total} departments</p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Add Department</Button>
        </div>
        <div className="card">
          <Table columns={columns} data={departments} loading={loading} emptyMessage="No departments found" />
          <Pagination {...pagination} onChange={fetchDepartments} />
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Department' : 'New Department'} size="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editing ? 'Update' : 'Create'}</Button></div>}>
        <form className="space-y-4">
          <Input label="Department Name" {...register('name', { required: 'Required' })} error={errors.name?.message} placeholder="e.g. Engineering" />
          <Input label="Department Code" {...register('code', { required: 'Required' })} error={errors.code?.message} placeholder="e.g. ENG" />
          <TextArea label="Description" {...register('description')} rows={2} placeholder="Department description..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Budget (USD)" type="number" {...register('budget')} placeholder="0" />
            <Input label="Location" {...register('location')} placeholder="e.g. New York" />
          </div>
          <Select label="Manager" options={managerOptions} {...register('manager')} />
        </form>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        title="Delete Department" message="Are you sure? This cannot be undone." confirmLabel="Delete" variant="danger" />
    </DashboardLayout>
  );
}
