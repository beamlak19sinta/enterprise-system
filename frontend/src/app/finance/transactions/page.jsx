'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { financeApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { CreditCard, Plus, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { type: 'income', paymentMethod: 'bank_transfer', status: 'completed' } });

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (typeFilter) params.type = typeFilter;
      const res = await financeApi.getTransactions(params);
      setTransactions(res.data.data.transactions);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(1); }, [typeFilter]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await financeApi.createTransaction({ ...data, date: data.date || new Date().toISOString() });
      toast.success('Transaction added!');
      setShowCreate(false); reset(); fetchTransactions(1);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await financeApi.deleteTransaction(selected); toast.success('Deleted'); setShowDelete(false); fetchTransactions(1); }
    catch (err) { toast.error(err.message || 'Failed'); }
  };

  const incomeCategories = ['Sales', 'Service', 'Interest', 'Investment', 'Other Income'];
  const expenseCategories = ['Salaries', 'Rent', 'Utilities', 'Purchases', 'Marketing', 'Travel', 'Equipment', 'Other Expense'];

  const columns = [
    { key: 'type', header: 'Type', render: (row) => (
      <div className="flex items-center gap-1.5">
        {row.type === 'income' ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
        <span className={`capitalize font-medium text-sm ${row.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{row.type}</span>
      </div>
    )},
    { key: 'description', header: 'Description', render: (row) => <span className="text-sm">{row.description}</span> },
    { key: 'category', header: 'Category' },
    { key: 'amount', header: 'Amount', render: (row) => <span className={`font-semibold ${row.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{row.type === 'expense' ? '-' : '+'}{formatCurrency(row.amount)}</span> },
    { key: 'paymentMethod', header: 'Method', render: (row) => <span className="capitalize text-sm">{row.paymentMethod?.replace('_', ' ')}</span> },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    { key: 'status', header: 'Status', render: (row) => <span className={`badge ${row.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{row.status}</span> },
    { key: 'actions', header: '', render: (row) => (
      <button onClick={() => { setSelected(row._id); setShowDelete(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div><h1 className="section-title flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary-500" />Transactions</h1><p className="text-sm text-gray-500">{pagination.total} records</p></div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Transaction</Button>
        </div>
        <div className="card p-4">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field w-auto">
            <option value="">All Types</option><option value="income">Income</option><option value="expense">Expense</option>
          </select>
        </div>
        <div className="card"><Table columns={columns} data={transactions} loading={loading} emptyMessage="No transactions found" /><Pagination {...pagination} onChange={fetchTransactions} /></div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Transaction" size="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Add</Button></div>}>
        <form className="space-y-4">
          <Select label="Type" options={[{ value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }]} {...register('type', { required: 'Required' })} />
          <Input label="Description" {...register('description', { required: 'Required' })} error={errors.description?.message} placeholder="Transaction description..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (USD)" type="number" step="0.01" {...register('amount', { required: 'Required' })} error={errors.amount?.message} />
            <Input label="Date" type="date" {...register('date')} defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" {...register('category', { required: 'Required' })} error={errors.category?.message} placeholder="e.g. Sales, Rent..." />
            <Select label="Payment Method" options={[{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'credit_card', label: 'Credit Card' }, { value: 'check', label: 'Check' }]} {...register('paymentMethod')} />
          </div>
          <Input label="Reference" {...register('reference')} placeholder="Invoice/receipt number..." />
        </form>
      </Modal>
      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Transaction" message="This cannot be undone." confirmLabel="Delete" variant="danger" />
    </DashboardLayout>
  );
}
