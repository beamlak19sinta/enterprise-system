'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { employeeApi, attendanceApi, leaveApi } from '@/lib/api';
import { Table } from '@/components/ui/Table';
import { ArrowLeft, User, Mail, Phone, Building2, Calendar, DollarSign, FileText } from 'lucide-react';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    employeeApi.getOne(id).then(r => setEmployee(r.data.data.employee)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DashboardLayout><div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div></DashboardLayout>;
  if (!employee) return <DashboardLayout><div className="card p-12 text-center text-gray-400">Employee not found</div></DashboardLayout>;

  const u = employee.user;
  const tabs = ['overview', 'documents'];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/employees"><button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button></Link>
            <h1 className="section-title">{u?.firstName} {u?.lastName}</h1>
          </div>
          <Link href={`/employees/${id}/edit`}><button className="btn-secondary">Edit Employee</button></Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile Card */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
                {u?.firstName?.[0]}{u?.lastName?.[0]}
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">{u?.firstName} {u?.lastName}</h2>
              <p className="text-sm text-gray-500">{employee.position}</p>
              <span className="badge bg-primary-100 text-primary-700 mt-2 capitalize">{u?.role?.replace('_',' ')}</span>
            </div>
            <div className="space-y-2.5 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Mail className="w-4 h-4 text-gray-400" />{u?.email}</div>
              {u?.phone && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Phone className="w-4 h-4 text-gray-400" />{u.phone}</div>}
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Building2 className="w-4 h-4 text-gray-400" />{employee.department?.name}</div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Calendar className="w-4 h-4 text-gray-400" />Since {formatDate(employee.startDate)}</div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><DollarSign className="w-4 h-4 text-gray-400" />{formatCurrency(employee.salary?.base)}/mo</div>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className={`badge w-full justify-center ${getStatusColor(employee.employmentStatus)}`}>{employee.employmentStatus?.replace('_',' ')}</span>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${tab === t ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t}</button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Employee ID', value: employee.employeeId },
                  { label: 'Employment Type', value: employee.employmentType?.replace('_',' ') },
                  { label: 'Department', value: employee.department?.name },
                  { label: 'Position', value: employee.position },
                  { label: 'Manager', value: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '—' },
                  { label: 'Performance Rating', value: employee.performanceRating ? `${employee.performanceRating}/5` : '—' },
                ].map(item => (
                  <div key={item.label} className="card p-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 capitalize">{item.value || '—'}</p>
                  </div>
                ))}
                {employee.skills?.length > 0 && (
                  <div className="card p-4 col-span-2">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">{employee.skills.map(s => <span key={s} className="badge bg-primary-100 text-primary-700">{s}</span>)}</div>
                  </div>
                )}
              </div>
            )}

            {tab === 'documents' && (
              <div className="space-y-3">
                {employee.documents?.length === 0 ? (
                  <div className="card p-8 text-center text-gray-400"><FileText className="w-8 h-8 mx-auto mb-2" />No documents uploaded</div>
                ) : employee.documents?.map((doc, i) => (
                  <div key={i} className="card p-4 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-500" />
                    <div className="flex-1"><p className="font-medium text-sm text-gray-900 dark:text-white">{doc.name}</p><p className="text-xs text-gray-400 capitalize">{doc.type} • {formatDate(doc.uploadedAt)}</p></div>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="btn-secondary text-xs py-1.5">View</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
