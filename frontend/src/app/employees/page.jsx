'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { employeeApi, departmentApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { Users, Plus, Search } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import Link from 'next/link';

export default function EmployeesPage() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const canManage = ['super_admin', 'hr_manager'].includes(user?.role);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (deptFilter) params.department = deptFilter;
      const res = await employeeApi.getAll(params);
      setEmployees(res.data.data.employees);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    departmentApi.getAll({ isActive: 'true' }).then(r => setDepartments(r.data.data.departments)).catch(() => {});
    fetchEmployees(1);
  }, [deptFilter]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await employeeApi.create({
        ...data,
        salary: { base: Number(data.salary), currency: 'USD', paymentFrequency: 'monthly' },
      });
      toast.success('Employee created!');
      setShowCreate(false);
      reset();
      fetchEmployees(1);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const filteredEmployees = search
    ? employees.filter(e => {
        const u = e.user;
        const name = `${u?.firstName} ${u?.lastName}`.toLowerCase();
        return name.includes(search.toLowerCase()) || u?.email?.toLowerCase().includes(search.toLowerCase());
      })
    : employees;

  const columns = [
    { key: 'user', header: 'Employee', render: (row) => {
      const u = row.user;
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {u?.firstName?.[0]}{u?.lastName?.[0]}
          </div>
          <div>
            <Link href={`/employees/${row._id}`} className="font-medium text-sm text-gray-900 dark:text-white hover:text-primary-600">{u?.firstName} {u?.lastName}</Link>
            <p className="text-xs text-gray-400">{u?.email}</p>
          </div>
        </div>
      );
    }},
    { key: 'employeeId', header: 'ID', render: (row) => <span className="font-mono text-xs text-gray-500">{row.employeeId}</span> },
    { key: 'department', header: 'Department', render: (row) => row.department?.name || '—' },
    { key: 'position', header: 'Position', render: (row) => row.position || '—' },
    { key: 'employmentType', header: 'Type', render: (row) => <span className="capitalize text-xs">{row.employmentType?.replace('_', ' ')}</span> },
    { key: 'employmentStatus', header: 'Status', render: (row) => <span className={`badge ${getStatusColor(row.employmentStatus)}`}>{row.employmentStatus}</span> },
    { key: 'actions', header: '', render: (row) => (
      <div className="flex gap-1">
        <Link href={`/employees/${row._id}`} className="px-2.5 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors">View</Link>
        {canManage && <Link href={`/employees/${row._id}/edit`} className="px-2.5 py-1.5 text-xs rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors">Edit</Link>}
      </div>
    )},
  ];

  const deptOptions = departments.map(d => ({ value: d._id, label: d.name }));

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="section-title flex items-center gap-2"><Users className="w-5 h-5 text-primary-500" />Employees</h1>
            <p className="text-sm text-gray-500">{pagination.total} employees</p>
          </div>
          {canManage && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Employee</Button>}
        </div>

        <div className="card p-4 flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="input-field pl-9 w-full" />
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-field w-auto">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
        </div>

        <div className="card">
          <Table columns={columns} data={filteredEmployees} loading={loading} emptyMessage="No employees found" />
          <Pagination {...pagination} onChange={fetchEmployees} />
        </div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Employee" size="lg"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create Employee</Button></div>}>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" {...register('firstName', { required: 'Required' })} error={errors.firstName?.message} />
            <Input label="Last Name" {...register('lastName', { required: 'Required' })} error={errors.lastName?.message} />
          </div>
          <Input label="Email" type="email" {...register('email', { required: 'Required' })} error={errors.email?.message} />
          <Input label="Password" type="password" {...register('password')} placeholder="Default: TempPass@123" />
          <Input label="Position / Job Title" {...register('position', { required: 'Required' })} error={errors.position?.message} />
          <Select label="Department" options={deptOptions} {...register('department', { required: 'Required' })} error={errors.department?.message} placeholder="Select department" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Base Salary (USD)" type="number" {...register('salary', { required: 'Required' })} error={errors.salary?.message} />
            <Input label="Start Date" type="date" {...register('startDate')} defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <Select label="Employment Type" options={[
            { value: 'full_time', label: 'Full Time' },
            { value: 'part_time', label: 'Part Time' },
            { value: 'contract', label: 'Contract' },
            { value: 'intern', label: 'Intern' },
          ]} {...register('employmentType')} />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
