'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { departmentApi } from '@/lib/api';
import { Building2, ArrowLeft, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function DepartmentDetailPage() {
  const { id } = useParams();
  const [dept, setDept] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([departmentApi.getOne(id), departmentApi.getEmployees(id)])
      .then(([d, e]) => { setDept(d.data.data.department); setEmployees(e.data.data.employees); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DashboardLayout><div className="skeleton h-64 rounded-2xl" /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link href="/departments"><button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></button></Link>
          <h1 className="section-title flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-500" />{dept?.name}</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card p-5 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"><Building2 className="w-6 h-6 text-primary-500" /></div>
            <div><p className="text-xs text-gray-400 uppercase tracking-wide">Code</p><p className="font-mono font-semibold text-gray-900 dark:text-white">{dept?.code}</p></div>
            {dept?.description && <div><p className="text-xs text-gray-400 uppercase tracking-wide">Description</p><p className="text-sm text-gray-600 dark:text-gray-300">{dept.description}</p></div>}
            {dept?.manager && <div><p className="text-xs text-gray-400 uppercase tracking-wide">Manager</p><p className="text-sm font-medium text-gray-900 dark:text-white">{dept.manager.firstName} {dept.manager.lastName}</p></div>}
            {dept?.budget && <div><p className="text-xs text-gray-400 uppercase tracking-wide">Budget</p><p className="text-sm font-semibold text-green-600">{formatCurrency(dept.budget)}</p></div>}
            <div><p className="text-xs text-gray-400 uppercase tracking-wide">Status</p><span className={`badge ${dept?.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{dept?.isActive ? 'Active' : 'Inactive'}</span></div>
          </div>
          <div className="lg:col-span-2 card">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" /><h3 className="font-semibold text-gray-900 dark:text-white">Employees ({employees.length})</h3></div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {employees.length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">No employees in this department</p> :
                employees.map(emp => (
                  <div key={emp._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xs font-bold">{emp.user?.firstName?.[0]}{emp.user?.lastName?.[0]}</div>
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900 dark:text-white">{emp.user?.firstName} {emp.user?.lastName}</p><p className="text-xs text-gray-400">{emp.position}</p></div>
                    <span className={`badge ${emp.employmentStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{emp.employmentStatus}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
