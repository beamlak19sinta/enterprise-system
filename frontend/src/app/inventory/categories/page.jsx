'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { inventoryApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Boxes, Plus, Trash2, Pencil } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getCategories();
      setCategories(res.data.data.categories);
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editItem) {
        await inventoryApi.updateCategory(editItem._id, data);
        toast.success('Category updated!');
        setEditItem(null);
      } else {
        await inventoryApi.createCategory(data);
        toast.success('Category created!');
        setShowCreate(false);
      }
      reset();
      fetchCategories();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleEdit = (cat) => {
    setEditItem(cat);
    setValue('name', cat.name);
    setValue('description', cat.description);
  };

  const handleDelete = async () => {
    try {
      await inventoryApi.deleteCategory(deleteId);
      toast.success('Category deleted');
      setDeleteId(null);
      fetchCategories();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'slug', header: 'Slug', render: (row) => <span className="font-mono text-xs text-gray-500">{row.slug}</span> },
    { key: 'description', header: 'Description', render: (row) => row.description || '—' },
    { key: 'productCount', header: 'Products', render: (row) => <span className="font-medium">{row.productCount || 0}</span> },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    { key: 'actions', header: '', render: (row) => (
      <div className="flex gap-1">
        <button onClick={() => handleEdit(row)} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(row._id)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  const modalOpen = showCreate || !!editItem;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <h1 className="section-title flex items-center gap-2"><Boxes className="w-5 h-5 text-primary-500" />Product Categories</h1>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => { setShowCreate(true); setEditItem(null); reset(); }}>Add Category</Button>
        </div>
        <div className="card">
          <Table columns={columns} data={categories} loading={loading} emptyMessage="No categories yet" />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setShowCreate(false); setEditItem(null); reset(); }} title={editItem ? 'Edit Category' : 'Add Category'} size="sm"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => { setShowCreate(false); setEditItem(null); reset(); }}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editItem ? 'Save Changes' : 'Create'}</Button></div>}>
        <form className="space-y-4">
          <Input label="Category Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
          <Input label="Description" {...register('description')} placeholder="Optional" />
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Category" message="Are you sure you want to delete this category? This cannot be undone." />
    </DashboardLayout>
  );
}
