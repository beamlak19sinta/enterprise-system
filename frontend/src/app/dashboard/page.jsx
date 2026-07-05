'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { dashboardApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Users, ShoppingCart, Package, DollarSign, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAuthStore } from '@/store/authStore';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [salesChart, setSalesChart] = useState([]);
  const [inventoryChart, setInventoryChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, r, sc, ic] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRevenueChart(),
          dashboardApi.getSalesChart(),
          dashboardApi.getInventoryChart(),
        ]);
        setStats(s.data.data);
        setRevenueChart(r.data.data.chart);
        setSalesChart(sc.data.data.chart);
        setInventoryChart(ic.data.data.chart);
      } catch (err) { console.error('Dashboard error', err); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 animate-pulse" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's what's happening with your business today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Total Employees"
            value={stats?.employees?.total ?? 0}
            subtitle={`${stats?.employees?.active ?? 0} active`}
            icon={<Users className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats?.revenue?.thisMonth ?? 0)}
            subtitle={stats?.revenue?.growth !== undefined ? `${stats.revenue.growth >= 0 ? '+' : ''}${stats.revenue.growth}% vs last month` : ''}
            icon={<DollarSign className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Monthly Orders"
            value={stats?.orders?.thisMonth ?? 0}
            subtitle={`${stats?.orders?.pending ?? 0} pending`}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Total Products"
            value={stats?.products?.total ?? 0}
            subtitle={stats?.products?.lowStock ? `${stats.products.lowStock} low stock` : 'All stocked'}
            icon={<Package className="w-5 h-5" />}
            color={stats?.products?.lowStock > 0 ? 'orange' : 'indigo'}
          />
        </div>

        {/* Quick Alerts */}
        {(stats?.products?.lowStock > 0 || stats?.leaves?.pending > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats?.products?.lowStock > 0 && (
              <div className="card p-4 border-l-4 border-amber-400 bg-amber-50/50 dark:bg-amber-900/10">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{stats.products.lowStock} products below reorder point</p>
                    <a href="/inventory/low-stock" className="text-xs text-amber-600 hover:underline">View low stock →</a>
                  </div>
                </div>
              </div>
            )}
            {stats?.leaves?.pending > 0 && (
              <div className="card p-4 border-l-4 border-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{stats.leaves.pending} leave requests awaiting approval</p>
                    <a href="/leaves" className="text-xs text-blue-600 hover:underline">Review now →</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Revenue Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Revenue & Expenses</h3>
                <p className="text-xs text-gray-400 mt-0.5">Last 12 months</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary-500 inline-block"/>Revenue</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/>Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, '']} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white">Inventory by Category</h3>
              <p className="text-xs text-gray-400 mt-0.5">Product distribution</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={inventoryChart} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="count" nameKey="_id">
                  {inventoryChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {inventoryChart.slice(0, 4).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{d._id}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sales Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Sales Orders</h3>
              <p className="text-xs text-gray-400 mt-0.5">Order volume & revenue</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesChart} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Bottom Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net Profit (Month)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency((stats?.revenue?.thisMonth ?? 0) - (stats?.revenue?.expenses ?? 0))}
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              {(stats?.revenue?.thisMonth ?? 0) > (stats?.revenue?.expenses ?? 0)
                ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
              <span>Revenue minus expenses</span>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Customers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.customers?.total ?? 0}</p>
            <p className="text-xs text-gray-500 mt-2">Active clients</p>
          </div>
          <div className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Orders</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats?.orders?.pending ?? 0}</p>
            <a href="/sales/orders" className="text-xs text-primary-500 hover:underline mt-2 block">View all orders →</a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
