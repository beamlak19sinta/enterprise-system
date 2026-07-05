'use client';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
const colors = { blue:{bg:'bg-blue-500/10',icon:'text-blue-500'}, green:{bg:'bg-green-500/10',icon:'text-green-500'}, purple:{bg:'bg-purple-500/10',icon:'text-purple-500'}, orange:{bg:'bg-orange-500/10',icon:'text-orange-500'}, pink:{bg:'bg-pink-500/10',icon:'text-pink-500'}, indigo:{bg:'bg-indigo-500/10',icon:'text-indigo-500'} };
export function StatCard({ title, value, change, changeLabel, icon, color='blue', loading, subtitle }) {
  const c = colors[color] || colors.blue;
  return (
    <div className="card p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          {loading ? <div className="skeleton h-8 w-24 mt-1"/> : <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>}
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl',c.bg)}><span className={c.icon}>{icon}</span></div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className={cn('flex items-center gap-0.5 text-xs font-medium',change>=0?'text-green-600':'text-red-500')}>
            {change>=0?<TrendingUp className="w-3.5 h-3.5"/>:<TrendingDown className="w-3.5 h-3.5"/>}{Math.abs(change)}%
          </span>
          {changeLabel && <span className="text-xs text-gray-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
