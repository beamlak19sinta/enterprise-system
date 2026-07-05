'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { attendanceApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Table, Pagination } from '@/components/ui/Table';
import { Clock, CheckCircle, XCircle, LogIn, LogOut } from 'lucide-react';
import { formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { StatCard } from '@/components/ui/StatCard';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 30 });
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const isEmployee = user?.role === 'employee';

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isEmployee) {
        const res = await attendanceApi.getMy({ month, year });
        setAttendance(res.data.data.attendance);
        setSummary(res.data.data.summary);
      } else {
        const res = await attendanceApi.getAll({ month, year, limit: 30 });
        setAttendance(res.data.data.attendance);
        setPagination(res.data.data.pagination);
      }
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [month, year]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await attendanceApi.checkIn();
      toast.success('Checked in successfully!');
      fetchData();
    } catch (err) { toast.error(err.message || 'Already checked in'); }
    finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingIn(true);
    try {
      await attendanceApi.checkOut();
      toast.success('Checked out successfully!');
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setCheckingIn(false); }
  };

  const columns = [
    { key: 'date', header: 'Date', sortable: true, render: (row) => formatDate(row.date) },
    ...(isEmployee ? [] : [{ key: 'employee', header: 'Employee', render: (row) => `${row.employee?.user?.firstName || ''} ${row.employee?.user?.lastName || ''}` }]),
    { key: 'checkIn', header: 'Check In', render: (row) => row.checkIn ? formatDateTime(row.checkIn).split(' ')[1] : '—' },
    { key: 'checkOut', header: 'Check Out', render: (row) => row.checkOut ? formatDateTime(row.checkOut).split(' ')[1] : '—' },
    { key: 'workHours', header: 'Hours', render: (row) => row.workHours ? `${row.workHours}h` : '—' },
    { key: 'overtime', header: 'OT', render: (row) => row.overtime > 0 ? <span className="text-orange-500 font-medium">{row.overtime}h</span> : '—' },
    { key: 'status', header: 'Status', render: (row) => <span className={`badge ${getStatusColor(row.status)}`}>{row.status.replace('_', ' ')}</span> },
  ];

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="section-title flex items-center gap-2"><Clock className="w-5 h-5 text-primary-500" />Attendance</h1>
            <p className="text-sm text-gray-500">Track daily attendance records</p>
          </div>
          {isEmployee && (
            <div className="flex gap-2">
              <Button variant="secondary" icon={<LogIn className="w-4 h-4" />} onClick={handleCheckIn} loading={checkingIn}>Check In</Button>
              <Button variant="outline" icon={<LogOut className="w-4 h-4" />} onClick={handleCheckOut} loading={checkingIn}>Check Out</Button>
            </div>
          )}
        </div>

        {isEmployee && summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard title="Present" value={summary.present} icon={<CheckCircle className="w-5 h-5" />} color="green" />
            <StatCard title="Absent" value={summary.absent} icon={<XCircle className="w-5 h-5" />} color="pink" />
            <StatCard title="Late" value={summary.late} icon={<Clock className="w-5 h-5" />} color="orange" />
            <StatCard title="Total Hours" value={`${summary.totalHours?.toFixed(1)}h`} icon={<Clock className="w-5 h-5" />} color="blue" />
          </div>
        )}

        <div className="card p-4 flex gap-3">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input-field w-auto">
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input-field w-auto">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="card">
          <Table columns={columns} data={attendance} loading={loading} emptyMessage="No attendance records" />
          {!isEmployee && <Pagination {...pagination} onChange={() => {}} />}
        </div>
      </div>
    </DashboardLayout>
  );
}
