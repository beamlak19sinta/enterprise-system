import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
const variants = { primary:'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 shadow-md hover:shadow-lg', secondary:'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700', danger:'bg-red-500 text-white hover:bg-red-600', ghost:'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50', outline:'border border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20' };
const sizes = { sm:'px-3 py-1.5 text-xs', md:'px-4 py-2.5 text-sm', lg:'px-6 py-3 text-base' };
export function Button({ variant='primary', size='md', loading, icon, children, className, disabled, ...props }) {
  return (
    <button className={cn('inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed', variants[variant], sizes[size], className)} disabled={disabled||loading} {...props}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
