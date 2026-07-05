'use client';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

export function Table({ columns, data, loading, emptyMessage='No data found', onRowClick }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const handleSort = (key) => { if (sortKey===key) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortKey(key); setSortDir('asc'); } };
  const sorted = sortKey ? [...data].sort((a,b) => { const cmp = String(a[sortKey]||'').localeCompare(String(b[sortKey]||'')); return sortDir==='asc'?cmp:-cmp; }) : data;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            {columns.map(col => (
              <th key={col.key} className={cn('text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap', col.sortable&&'cursor-pointer hover:text-gray-700 select-none', col.className)} onClick={()=>col.sortable&&handleSort(col.key)}>
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable&&(sortKey===col.key?(sortDir==='asc'?<ChevronUp className="w-3 h-3"/>:<ChevronDown className="w-3 h-3"/>):<ChevronsUpDown className="w-3 h-3 opacity-40"/>)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? Array.from({length:5}).map((_,i)=>(
            <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
              {columns.map(col=><td key={col.key} className="px-4 py-3"><div className="skeleton h-4 w-full max-w-[120px]"/></td>)}
            </tr>
          )) : sorted.length===0 ? (
            <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 text-sm">{emptyMessage}</td></tr>
          ) : sorted.map((row,i)=>(
            <tr key={row._id||i} className={cn('border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors', onRowClick&&'cursor-pointer')} onClick={()=>onRowClick?.(row)}>
              {columns.map(col=><td key={col.key} className={cn('px-4 py-3 text-gray-700 dark:text-gray-300',col.className)}>{col.render?col.render(row):String(row[col.key]??'—')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, total, limit, onChange }) {
  const start = Math.min((page-1)*limit+1, total), end = Math.min(page*limit, total);
  const nums = Array.from({length:Math.min(pages,7)},(_,i)=>{ if(pages<=7)return i+1; if(i===0)return 1; if(i===6)return pages; if(page<=4)return i+1; if(page>=pages-3)return pages-6+i; return page-3+i; });
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-700">
      <p className="text-sm text-gray-500">{total>0?`Showing ${start}–${end} of ${total}`:'No results'}</p>
      <div className="flex items-center gap-1">
        <button disabled={page<=1} onClick={()=>onChange(page-1)} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">← Prev</button>
        {nums.map((n,i)=><button key={`${n}-${i}`} onClick={()=>typeof n==='number'&&onChange(n)} className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors',n===page?'bg-primary-500 text-white':'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400')}>{n}</button>)}
        <button disabled={page>=pages} onClick={()=>onChange(page+1)} className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Next →</button>
      </div>
    </div>
  );
}
