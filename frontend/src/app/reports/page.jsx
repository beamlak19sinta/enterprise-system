'use client';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { reportApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { FileText, Download, Users, ShoppingCart, DollarSign, Package, Truck } from 'lucide-react';
import { formatCurrency, formatDate, downloadBlob } from '@/lib/utils';
import toast from 'react-hot-toast';

const reportTypes = [
  { id: 'employees', label: 'Employee Report', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500/10 text-blue-500', description: 'All employee details, departments, salaries' },
  { id: 'sales', label: 'Sales Report', icon: <ShoppingCart className="w-5 h-5" />, color: 'bg-green-500/10 text-green-500', description: 'Orders, revenue, customer activity' },
  { id: 'finance', label: 'Finance Report', icon: <DollarSign className="w-5 h-5" />, color: 'bg-purple-500/10 text-purple-500', description: 'Income, expenses, profit & loss' },
  { id: 'inventory', label: 'Inventory Report', icon: <Package className="w-5 h-5" />, color: 'bg-orange-500/10 text-orange-500', description: 'Products, stock levels, values' },
  { id: 'purchases', label: 'Purchase Report', icon: <Truck className="w-5 h-5" />, color: 'bg-pink-500/10 text-pink-500', description: 'Purchase orders, supplier spend' },
];

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('employees');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchApis = {
    employees: reportApi.getEmployees,
    sales: reportApi.getSales,
    finance: reportApi.getFinance,
    inventory: reportApi.getInventory,
    purchases: reportApi.getPurchases,
  };

  const generate = async () => {
    setLoading(true);
    try {
      const fn = fetchApis[activeReport];
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      const res = await fn(params);
      setData(res.data.data);
      toast.success('Report generated!');
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const exportExcel = async () => {
    if (!data) { toast.error('Generate report first'); return; }
    setExporting(true);
    try {
      const rows = data.employees || data.orders || data.income || data.products || data.purchases || [];
      const res = await reportApi.exportExcel({ reportType: activeReport, data: rows });
      downloadBlob(new Blob([res.data]), `${activeReport}-report-${Date.now()}.xlsx`);
      toast.success('Excel downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const exportPDF = async () => {
    if (!data) { toast.error('Generate report first'); return; }
    setExporting(true);
    try {
      const rows = data.employees || data.orders || data.income || data.products || data.purchases || [];
      const res = await reportApi.exportPDF({ reportType: activeReport, data: rows });
      downloadBlob(new Blob([res.data], { type: 'application/pdf' }), `${activeReport}-report-${Date.now()}.pdf`);
      toast.success('PDF downloaded!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const current = reportTypes.find(r => r.id === activeReport);

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div><h1 className="section-title flex items-center gap-2"><FileText className="w-5 h-5 text-primary-500" />Reports</h1><p className="text-sm text-gray-500">Generate and export business reports</p></div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={exportExcel} loading={exporting}>Excel</Button>
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={exportPDF} loading={exporting}>PDF</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {reportTypes.map(r => (
            <button key={r.id} onClick={() => { setActiveReport(r.id); setData(null); }}
              className={`p-4 rounded-2xl text-left border-2 transition-all duration-200 ${activeReport === r.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent card hover:border-gray-200'}`}>
              <div className={`p-2.5 rounded-xl w-fit mb-2 ${r.color}`}>{r.icon}</div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 hidden lg:block">{r.description}</p>
            </button>
          ))}
        </div>

        <div className="card p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" value={dateRange.startDate} onChange={e => setDateRange(p => ({ ...p, startDate: e.target.value }))} className="input-field" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input type="date" value={dateRange.endDate} onChange={e => setDateRange(p => ({ ...p, endDate: e.target.value }))} className="input-field" />
            </div>
            <Button onClick={generate} loading={loading} icon={<FileText className="w-4 h-4" />}>Generate {current?.label}</Button>
          </div>
        </div>

        {data && (
          <div className="card overflow-hidden animate-fade-in">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{current?.label} Results</h3>
              {data.summary && (
                <div className="flex gap-4 text-sm">
                  {Object.entries(data.summary).map(([k, v]) => (
                    <span key={k} className="text-gray-500"><span className="font-medium text-gray-900 dark:text-white">{typeof v === 'number' && k.includes('total') ? formatCurrency(v) : String(v)}</span> {k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {(data.employees || data.orders || data.income || data.products || data.purchases || []).slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                        {Object.entries(row).filter(([k]) => !['_id', '__v', 'password', 'refreshTokens'].includes(k)).slice(0, 6).map(([k, v]) => (
                          <td key={k} className="py-2.5 pr-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {typeof v === 'object' ? JSON.stringify(v)?.substring(0, 30) : String(v || '—').substring(0, 40)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
