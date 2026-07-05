'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { payrollApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { DollarSign, Plus, CheckCircle, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function PayrollPage() {
  const { user } = useAuthStore();
  const [payrolls, setPayrolls] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth() + 1);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const canManage = ['super_admin', 'finance_manager', 'hr_manager'].includes(user?.role);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } });

  const fetchPayrolls = async (page = 1) => {
    setLoading(true);
    try {
      const res = await payrollApi.getAll({ page, limit: 20, month: monthFilter, year: yearFilter });
      setPayrolls(res.data.data.payrolls);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load payroll'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayrolls(1); }, [monthFilter, yearFilter]);

  const onGenerate = async (data) => {
    setSaving(true);
    try {
      const res = await payrollApi.generate(data);
      toast.success(`Generated ${res.data.data.generated} payroll records`);
      setShowGenerate(false);
      reset();
      fetchPayrolls(1);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try {
      await payrollApi.approve(id);
      toast.success('Payroll approved');
      fetchPayrolls(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handlePay = async (id) => {
    try {
      await payrollApi.pay(id, { paymentMethod: 'bank_transfer' });
      toast.success('Payment processed!');
      fetchPayrolls(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const columns = [
    { key: 'employee', header: 'Employee', render: (row) => {
      const u = row.employee?.user;
      return u ? (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xs font-bold">{u.firstName?.[0]}{u.lastName?.[0]}</div>
          <span className="font-medium text-sm">{u.firstName} {u.lastName}</span>
        </div>
      ) : '—';
    }},
    { key: 'period', header: 'Period', render: (row) => `${months[row.period?.month - 1]} ${row.period?.year}` },
    { key: 'basicSalary', header: 'Basic', render: (row) => formatCurrency(row.basicSalary) },
    { key: 'grossSalary', header: 'Gross', render: (row) => <span className="font-medium">{formatCurrency(row.grossSalary)}</span> },
    { key: 'tax', header: 'Tax', render: (row) => <span className="text-red-500">-{formatCurrency(row.tax)}</span> },
    { key: 'netSalary', header: 'Net', render: (row) => <span className="font-bold text-green-600">{formatCurrency(row.netSalary)}</span> },
    { key: 'status', header: 'Status', render: (row) => <span className={`badge ${getStatusColor(row.status)}`}>{row.status}</span> },
    { key: 'paymentDate', header: 'Paid On', render: (row) => row.paymentDate ? formatDate(row.paymentDate) : '—' },
    ...(canManage ? [{ key: 'actions', header: '', render: (row) => (
      <div className="flex gap-1">
        {row.status === 'pending' && <button onClick={() => handleApprove(row._id)} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 text-xs transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>}
        {row.status === 'approved' && <button onClick={() => handlePay(row._id)} className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 text-xs transition-colors" title="Process Payment"><CreditCard className="w-4 h-4" /></button>}
      </div>
    )}] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="section-title flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary-500" />Payroll</h1>
            <p className="text-sm text-gray-500">{pagination.total} records</p>
          </div>
          {canManage && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowGenerate(true)}>Generate Payroll</Button>}
        </div>

        <div className="card p-4 flex gap-3 flex-wrap">
          <select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))} className="input-field w-auto">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))} className="input-field w-auto">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="card">
          <Table columns={columns} data={payrolls} loading={loading} emptyMessage="No payroll records. Generate payroll first." />
          <Pagination {...pagination} onChange={fetchPayrolls} />
        </div>
      </div>

      <Modal isOpen={showGenerate} onClose={() => setShowGenerate(false)} title="Generate Payroll" size="sm"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowGenerate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onGenerate)}>Generate</Button></div>}>
        <form className="space-y-4">
          <p className="text-sm text-gray-500">Generate payroll for all active employees for the selected period.</p>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Month" options={months.map((m, i) => ({ value: String(i + 1), label: m }))} {...register('month')} />
            <Select label="Year" options={[2024,2025,2026].map(y => ({ value: String(y), label: String(y) }))} {...register('year')} />
          </div>
          <Input label="Bonus (USD)" type="number" {...register('bonus')} placeholder="0" />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
