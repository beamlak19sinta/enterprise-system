import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export const Input = forwardRef(({ label, error, icon, rightIcon, hint, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
      <input ref={ref} className={cn('w-full px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200', icon && 'pl-10', rightIcon && 'pr-10', error ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/30 focus:border-primary-500', className)} {...props} />
      {rightIcon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</span>}
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
    {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
  </div>
));
Input.displayName = 'Input';

export const Select = forwardRef(({ label, error, options, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <select ref={ref} className={cn('w-full px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 transition-all duration-200', error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/30 focus:border-primary-500', className)} {...props}>
      {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));
Select.displayName = 'Select';

export const TextArea = forwardRef(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <textarea ref={ref} rows={4} className={cn('w-full px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none transition-all duration-200', error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700 focus:ring-primary-500/30 focus:border-primary-500', className)} {...props} />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));
TextArea.displayName = 'TextArea';
