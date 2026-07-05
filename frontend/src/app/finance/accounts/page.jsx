'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { financeApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { DollarSign, Plus, CreditCard, Landmark, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { type: 'bank', currency: 'USD', balance: 0 } });

  const fetchAccounts = async () => {
    setLoading(true);
    try { const res = await financeApi.getAccounts(); setAccounts(res.data.data.accounts); }
    catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try { await financeApi.createAccount(data); toast.success('Account created!'); setShowCreate(false); reset(); fetchAccounts(); }
    catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);

  const iconMap = { bank: <Landmark className="w-5 h-5" />, cash: <Wallet className="w-5 h-5" />, credit: <CreditCard className="w-5 h-5" />, investment: <DollarSign className="w-5 h-5" /> };
  const colorMap = { bank: 'bg-blue-500/10 text-blue-500', cash: 'bg-green-500/10 text-green-500', credit: 'bg-red-500/10 text-red-500', investment: 'bg-purple-500/10 text-purple-500' };

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div><h1 className="section-title flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary-500" />Accounts</h1>
            <p className="text-sm text-gray-500">Total Balance: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalBalance)}</span></p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Account</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(acc => (
              <div key={acc._id} className="card p-5 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${colorMap[acc.type] || 'bg-gray-100 text-gray-500'}`}>{iconMap[acc.type] || <DollarSign className="w-5 h-5" />}</div>
                  <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">{acc.type}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{acc.name}</h3>
                {acc.bankName && <p className="text-sm text-gray-400 mt-0.5">{acc.bankName} {acc.accountNumber ? `• ${acc.accountNumber}` : ''}</p>}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className={`text-2xl font-bold ${acc.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{formatCurrency(acc.balance)}</p>
                  <p className="text-xs text-gray-400">{acc.currency}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Account" size="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create</Button></div>}>
        <form className="space-y-4">
          <Input label="Account Name" {...register('name', { required: 'Required' })} error={errors.name?.message} placeholder="e.g. Business Checking" />
          <Select label="Account Type" options={[{ value: 'bank', label: 'Bank' }, { value: 'cash', label: 'Cash' }, { value: 'credit', label: 'Credit Card' }, { value: 'investment', label: 'Investment' }]} {...register('type')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Bank Name" {...register('bankName')} placeholder="Optional" />
            <Input label="Account Number" {...register('accountNumber')} placeholder="••••1234" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Opening Balance" type="number" step="0.01" {...register('balance')} />
            <Select label="Currency" options={[{ value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]} {...register('currency')} />
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
