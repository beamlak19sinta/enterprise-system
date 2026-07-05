'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { financeApi } from '@/lib/api';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ProfitLossPage() {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    financeApi.getProfitLoss({ year }).then(r => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, [year]);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const chartData = data?.monthly?.map((m, i) => ({ month: months[i], income: m.income, expenses: m.expenses, profit: m.profit })) || [];
  const totalIncome = data?.monthly?.reduce((s, m) => s + m.income, 0) || 0;
  const totalExpenses = data?.monthly?.reduce((s, m) => s + m.expenses, 0) || 0;
  const totalProfit = totalIncome - totalExpenses;

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="page-header">
          <div><h1 className="section-title flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-500" />Profit & Loss</h1></div>
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="input-field w-auto">
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2"><div className="p-2.5 rounded-xl bg-green-100"><TrendingUp className="w-5 h-5 text-green-500" /></div><span className="text-sm font-medium text-gray-500">Total Income</span></div>
            {loading ? <div className="skeleton h-8 w-32" /> : <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>}
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2"><div className="p-2.5 rounded-xl bg-red-100"><TrendingDown className="w-5 h-5 text-red-500" /></div><span className="text-sm font-medium text-gray-500">Total Expenses</span></div>
            {loading ? <div className="skeleton h-8 w-32" /> : <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>}
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2"><div className={`p-2.5 rounded-xl ${totalProfit >= 0 ? 'bg-primary-100' : 'bg-orange-100'}`}><DollarSign className={`w-5 h-5 ${totalProfit >= 0 ? 'text-primary-500' : 'text-orange-500'}`} /></div><span className="text-sm font-medium text-gray-500">Net Profit</span></div>
            {loading ? <div className="skeleton h-8 w-32" /> : <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-primary-600' : 'text-red-500'}`}>{formatCurrency(totalProfit)}</p>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Breakdown — {year}</h3>
          {loading ? <div className="skeleton h-64 w-full rounded-xl" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4,4,0,0]} name="Expenses" />
                <Bar dataKey="profit" fill="#6366f1" radius={[4,4,0,0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700"><h3 className="font-semibold text-gray-900 dark:text-white">Monthly Details</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 dark:border-gray-700">{['Month','Income','Expenses','Profit','Margin'].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {loading ? Array.from({length:12}).map((_,i) => <tr key={i} className="border-b"><td colSpan={5} className="px-5 py-3"><div className="skeleton h-4 w-full" /></td></tr>) :
                chartData.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                    <td className="px-5 py-3 font-medium">{row.month}</td>
                    <td className="px-5 py-3 text-green-600">{formatCurrency(row.income)}</td>
                    <td className="px-5 py-3 text-red-500">{formatCurrency(row.expenses)}</td>
                    <td className={`px-5 py-3 font-semibold ${row.profit >= 0 ? 'text-primary-600' : 'text-red-500'}`}>{formatCurrency(row.profit)}</td>
                    <td className="px-5 py-3">{row.income > 0 ? `${((row.profit/row.income)*100).toFixed(1)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
