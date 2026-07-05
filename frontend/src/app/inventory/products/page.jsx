'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { inventoryApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { Package, Plus, Search } from 'lucide-react';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdjust, setShowAdjust] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: regAdj, handleSubmit: handleAdj, reset: resetAdj } = useForm();

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (catFilter) params.category = catFilter;
      if (search) params.search = search;
      const res = await inventoryApi.getProducts(params);
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    inventoryApi.getCategories().then(r => setCategories(r.data.data.categories)).catch(() => {});
    fetchProducts(1);
  }, [catFilter]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await inventoryApi.createProduct({
        ...data,
        costPrice: Number(data.costPrice),
        sellingPrice: Number(data.sellingPrice),
        stock: { quantity: Number(data.quantity || 0), available: Number(data.quantity || 0) },
      });
      toast.success('Product created!');
      setShowCreate(false);
      reset();
      fetchProducts(1);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const onAdjust = async (data) => {
    setSaving(true);
    try {
      await inventoryApi.adjustStock(showAdjust._id, { adjustment: Number(data.adjustment) });
      toast.success('Stock adjusted!');
      setShowAdjust(null);
      resetAdj();
      fetchProducts(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const stockStatus = (p) => {
    if (p.stock.available <= 0) return 'out';
    if (p.stock.available <= p.stock.reorderPoint) return 'low';
    return 'ok';
  };

  const columns = [
    { key: 'name', header: 'Product', render: (row) => (
      <div>
        <p className="font-medium text-sm text-gray-900 dark:text-white">{row.name}</p>
        <p className="text-xs font-mono text-gray-400">{row.sku}</p>
      </div>
    )},
    { key: 'category', header: 'Category', render: (row) => row.category?.name || '—' },
    { key: 'costPrice', header: 'Cost', render: (row) => formatCurrency(row.costPrice) },
    { key: 'sellingPrice', header: 'Price', render: (row) => <span className="font-medium">{formatCurrency(row.sellingPrice)}</span> },
    { key: 'stock', header: 'Stock', render: (row) => (
      <div className="flex items-center gap-2">
        <span className={`font-bold text-sm ${stockStatus(row) === 'ok' ? 'text-green-600' : stockStatus(row) === 'low' ? 'text-amber-500' : 'text-red-500'}`}>{row.stock.available}</span>
        <span className="text-xs text-gray-400">/ {row.stock.quantity}</span>
        {stockStatus(row) === 'low' && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Low</span>}
        {stockStatus(row) === 'out' && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">Out</span>}
      </div>
    )},
    { key: 'supplier', header: 'Supplier', render: (row) => row.supplier?.companyName || '—' },
    { key: 'actions', header: '', render: (row) => (
      <button onClick={() => setShowAdjust(row)} className="px-2.5 py-1.5 text-xs rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors">Adjust Stock</button>
    )},
  ];

  const catOptions = categories.map(c => ({ value: c._id, label: c.name }));

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="section-title flex items-center gap-2"><Package className="w-5 h-5 text-primary-500" />Products</h1>
            <p className="text-sm text-gray-500">{pagination.total} products</p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Product</Button>
        </div>

        <div className="card p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProducts(1)} placeholder="Search by name or SKU..." className="input-field pl-9 w-full" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-auto">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        <div className="card">
          <Table columns={columns} data={products} loading={loading} emptyMessage="No products found" />
          <Pagination {...pagination} onChange={fetchProducts} />
        </div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Product" size="lg"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create Product</Button></div>}>
        <form className="space-y-4">
          <Input label="Product Name" {...register('name', { required: 'Required' })} error={errors.name?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" {...register('sku', { required: 'Required' })} error={errors.sku?.message} placeholder="PROD-001" />
            <Input label="Barcode" {...register('barcode')} placeholder="Optional" />
          </div>
          <Select label="Category" options={catOptions} {...register('category', { required: 'Required' })} error={errors.category?.message} placeholder="Select category" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cost Price" type="number" {...register('costPrice', { required: 'Required' })} error={errors.costPrice?.message} />
            <Input label="Selling Price" type="number" {...register('sellingPrice', { required: 'Required' })} error={errors.sellingPrice?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Initial Quantity" type="number" {...register('quantity')} placeholder="0" />
            <Input label="Reorder Point" type="number" {...register('stock.reorderPoint')} placeholder="20" />
          </div>
          <Input label="Description" {...register('description')} placeholder="Product description..." />
        </form>
      </Modal>

      <Modal isOpen={!!showAdjust} onClose={() => setShowAdjust(null)} title={`Adjust Stock: ${showAdjust?.name}`} size="sm"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowAdjust(null)}>Cancel</Button><Button loading={saving} onClick={handleAdj(onAdjust)}>Apply Adjustment</Button></div>}>
        <form className="space-y-4">
          <p className="text-sm text-gray-500">Current available: <span className="font-bold text-gray-800 dark:text-gray-200">{showAdjust?.stock?.available}</span></p>
          <Input label="Adjustment" type="number" {...regAdj('adjustment', { required: 'Required' })} placeholder="Use negative values to reduce stock" />
          <p className="text-xs text-gray-400">Example: +50 to add stock, -10 to remove stock</p>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
