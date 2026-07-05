'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizes = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl', '2xl':'max-w-6xl' };

export function Modal({ isOpen, onClose, title, children, size='md', footer }) {
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') onClose(); }; document.addEventListener('keydown', h); return () => document.removeEventListener('keydown', h); }, [onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in max-h-[90vh] flex flex-col', sizes[size])}>
        {title && <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700"><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2><button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button></div>}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="p-6 border-t border-gray-100 dark:border-gray-700">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel='Confirm', variant='danger', loading }) {
  const colors = { danger:'bg-red-500 hover:bg-red-600', warning:'bg-yellow-500 hover:bg-yellow-600', info:'bg-primary-500 hover:bg-primary-600' };
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={cn('w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4', variant==='danger'?'bg-red-100':variant==='warning'?'bg-yellow-100':'bg-blue-100')}>
          <span className="text-2xl">{variant==='danger'?'🗑️':variant==='warning'?'⚠️':'ℹ️'}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className={cn('px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50', colors[variant])}>{loading?'Loading...':confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
