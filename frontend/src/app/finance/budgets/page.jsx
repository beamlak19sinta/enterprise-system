'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { financeApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { BarChart3, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { type: 'monthly', 'period.year': new Date().getFullYear() } });

  const fetchBudgets = async () => {
    setLoading(true);
    try { const res = await financeApi.getBudgets({ year: new Date().getFullYear() }); setBudgets(res.data.data.budgets); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBudgets(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try { await financeApi.createBudget(data); toast.success('Budget created!'); setShowCreate(false); reset(); fetchBudgets(); }
    catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const getProgressColor = (pct) => pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-primary-500';

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div><h1 className="section-title flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary-500" />Budgets</h1><p className="text-sm text-gray-500">{budgets.length} budgets</p></div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Budget</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}</div>
        ) : budgets.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">No budgets found. Create your first budget.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map(b => {
              const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
              return (
                <div key={b._id} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div><h3 className="font-semibold text-gray-900 dark:text-white">{b.name}</h3><p className="text-xs text-gray-400 mt-0.5 capitalize">{b.category} • {b.type}</p></div>
                    <span className={`badge ${b.status === 'exceeded' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{b.status}</span>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs text-gray-500"><span>Spent: {formatCurrency(b.spent)}</span><span>Budget: {formatCurrency(b.amount)}</span></div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Remaining</span>
                    <span className={`font-semibold ${b.remaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(b.remaining || 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Budget" size="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create</Button></div>}>
        <form className="space-y-4">
          <Input label="Budget Name" {...register('name', { required: 'Required' })} error={errors.name?.message} placeholder="e.g. Marketing Q1" />
          <Input label="Category" {...register('category', { required: 'Required' })} error={errors.category?.message} placeholder="e.g. Marketing, Operations" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount (USD)" type="number" {...register('amount', { required: 'Required' })} error={errors.amount?.message} />
            <Select label="Type" options={[{ value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annual', label: 'Annual' }]} {...register('type')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Month" options={[{ value: '', label: 'N/A' }, ...['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => ({ value: String(i+1), label: m }))]} {...register('period.month')} />
            <Input label="Year" type="number" {...register('period.year')} />
          </div>
          <TextArea label="Notes" {...register('notes')} rows={2} />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
