'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Table, Pagination } from '@/components/ui/Table';
import { TrendingUp, Plus, Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';

export default function PerformancePage() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { overallRating: '3' } });
  const isManager = ['super_admin', 'hr_manager'].includes(user?.role);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const endpoint = isManager ? '/performance' : '/performance/my';
      const res = await api.get(endpoint);
      setReviews(res.data.data.reviews);
    } catch { toast.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await api.post('/performance', data);
      toast.success('Review created!');
      setShowCreate(false); reset(); fetchReviews();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const StarRating = ({ rating }) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}
      <span className="text-sm text-gray-500 ml-1">{rating}/5</span>
    </div>
  );

  const columns = [
    { key: 'employee', header: 'Employee', render: (row) => {
      const u = row.employee?.user;
      return u ? `${u.firstName} ${u.lastName}` : '—';
    }},
    { key: 'reviewPeriod', header: 'Period', render: (row) => `${formatDate(row.reviewPeriod?.startDate)} — ${formatDate(row.reviewPeriod?.endDate)}` },
    { key: 'overallRating', header: 'Rating', render: (row) => <StarRating rating={row.overallRating} /> },
    { key: 'reviewedBy', header: 'Reviewer', render: (row) => row.reviewedBy ? `${row.reviewedBy.firstName} ${row.reviewedBy.lastName}` : '—' },
    { key: 'status', header: 'Status', render: (row) => <span className={`badge ${row.status === 'submitted' ? 'bg-blue-100 text-blue-700' : row.status === 'acknowledged' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{row.status}</span> },
    { key: 'createdAt', header: 'Date', render: (row) => formatDate(row.createdAt) },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div><h1 className="section-title flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-500" />Performance Reviews</h1></div>
          {isManager && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Review</Button>}
        </div>
        <div className="card"><Table columns={columns} data={reviews} loading={loading} emptyMessage="No performance reviews" /></div>
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Performance Review" size="lg"
        footer={<div className="flex gap-3 justify-end"><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create</Button></div>}>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Review Period Start" type="date" {...register('reviewPeriod.startDate', { required: 'Required' })} />
            <Input label="Review Period End" type="date" {...register('reviewPeriod.endDate', { required: 'Required' })} />
          </div>
          <Select label="Overall Rating" options={[1,2,3,4,5].map(v => ({ value: String(v), label: `${v} — ${['Poor','Fair','Good','Very Good','Excellent'][v-1]}` }))} {...register('overallRating', { required: 'Required' })} />
          <TextArea label="Feedback" {...register('feedback', { required: 'Required' })} placeholder="Performance feedback..." rows={4} />
          <TextArea label="Strengths" {...register('strengths')} placeholder="Key strengths (one per line)..." rows={2} />
          <TextArea label="Areas for Improvement" {...register('improvements')} placeholder="Areas to improve (one per line)..." rows={2} />
        </form>
      </Modal>
    </DashboardLayout>
  );
}
