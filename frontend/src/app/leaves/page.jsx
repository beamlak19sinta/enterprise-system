'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { leaveApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { Calendar, Plus, Check, X } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function LeavesPage() {
  const { user } = useAuthStore();
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const isManager = ['super_admin', 'hr_manager'].includes(user?.role);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchLeaves = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await leaveApi.getAll(params);
      setLeaves(res.data.data.leaves);
      setPagination(res.data.data.pagination);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLeaves(1); }, [statusFilter]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      await leaveApi.create({ ...data, totalDays });
      toast.success('Leave request submitted!');
      setShowCreate(false);
      reset();
      fetchLeaves(1);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try {
      await leaveApi.approve(id);
      toast.success('Leave approved');
      fetchLeaves(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleReject = async () => {
    try {
      await leaveApi.reject(selectedId, rejectReason);
      toast.success('Leave rejected');
      setShowReject(false);
      setRejectReason('');
      fetchLeaves(pagination.page);
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const columns = [
    { key: 'employee', header: 'Employee', render: (row) => {
      const u = row.employee?.user;
      return u ? `${u.firstName} ${u.lastName}` : '—';
    }},
    { key: 'leaveType', header: 'Type', render: (row) => <span className="capitalize">{row.leaveType?.replace('_', ' ')}</span> },
    { key: 'startDate', header: 'Start', render: (row) => formatDate(row.startDate) },
    { key: 'endDate', header: 'End', render: (row) => formatDate(row.endDate) },
    { key: 'totalDays', header: 'Days', render: (row) => <span className="font-medium">{row.totalDays}</span> },
    { key: 'status', header: 'Status', render: (row) => <span className={`badge ${getStatusColor(row.status)}`}>{row.status}</span> },
    { key: 'actions', header: '', render: (row) => row.status === 'pending' && isManager ? (
      <div className="flex gap-1">
        <button onClick={() => handleApprove(row._id)} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={() => { setSelectedId(row._id); setShowReject(true); }} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
    ) : null },
  ];

  const leaveTypeOptions = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'emergency', label: 'Emergency Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="section-title flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-500" />Leave Requests</h1>
            <p className="text-sm text-gray-500">{pagination.total} requests</p>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Request Leave</Button>
        </div>

        <div className="card p-4">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-auto">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="card">
          <Table columns={columns} data={leaves} loading={loading} emptyMessage="No leave requests" />
          <Pagination {...pagination} onChange={fetchLeaves} />
        </div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Request Leave" size="md"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Submit Request</Button></div>}>
        <form className="space-y-4">
          <Select label="Leave Type" options={leaveTypeOptions} {...register('leaveType', { required: 'Required' })} error={errors.leaveType?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" {...register('startDate', { required: 'Required' })} error={errors.startDate?.message} />
            <Input label="End Date" type="date" {...register('endDate', { required: 'Required' })} error={errors.endDate?.message} />
          </div>
          <TextArea label="Reason" {...register('reason', { required: 'Required' })} error={errors.reason?.message} placeholder="Reason for leave..." />
        </form>
      </Modal>

      <Modal isOpen={showReject} onClose={() => setShowReject(false)} title="Reject Leave" size="sm"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowReject(false)}>Cancel</Button><Button variant="danger" onClick={handleReject}>Reject</Button></div>}>
        <TextArea label="Rejection Reason" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Why is this leave being rejected?" rows={3} />
      </Modal>
    </DashboardLayout>
  );
}
