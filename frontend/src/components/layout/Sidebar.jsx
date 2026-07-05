'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Users, Building2, Clock, Calendar, DollarSign, ShoppingCart, Package, Truck, BarChart3, Settings, ChevronDown, ChevronRight, UserCheck, Boxes, Receipt, CreditCard, FileText, TrendingUp, X, Zap } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label:'Dashboard', href:'/dashboard', icon:<LayoutDashboard className="w-4 h-4"/> },
  { label:'HR', icon:<Users className="w-4 h-4"/>, children:[
    { label:'Employees', href:'/employees', icon:<Users className="w-4 h-4"/>, roles:['super_admin','hr_manager'] },
    { label:'Departments', href:'/departments', icon:<Building2 className="w-4 h-4"/>, roles:['super_admin','hr_manager'] },
    { label:'Attendance', href:'/attendance', icon:<Clock className="w-4 h-4"/> },
    { label:'Leave', href:'/leaves', icon:<Calendar className="w-4 h-4"/> },
    { label:'Payroll', href:'/payroll', icon:<DollarSign className="w-4 h-4"/> },
    { label:'Performance', href:'/performance', icon:<TrendingUp className="w-4 h-4"/>, roles:['super_admin','hr_manager'] },
  ]},
  { label:'Sales', icon:<ShoppingCart className="w-4 h-4"/>, roles:['super_admin','sales_manager'], children:[
    { label:'Orders', href:'/sales/orders', icon:<ShoppingCart className="w-4 h-4"/> },
    { label:'Customers', href:'/customers', icon:<UserCheck className="w-4 h-4"/> },
  ]},
  { label:'Inventory', icon:<Package className="w-4 h-4"/>, roles:['super_admin','inventory_manager'], children:[
    { label:'Products', href:'/inventory/products', icon:<Package className="w-4 h-4"/> },
    { label:'Categories', href:'/inventory/categories', icon:<Boxes className="w-4 h-4"/> },
    { label:'Warehouses', href:'/inventory/warehouses', icon:<Building2 className="w-4 h-4"/> },
    { label:'Low Stock', href:'/inventory/low-stock', icon:<Zap className="w-4 h-4"/> },
  ]},
  { label:'Purchases', icon:<Truck className="w-4 h-4"/>, roles:['super_admin','inventory_manager'], children:[
    { label:'Purchase Orders', href:'/purchases', icon:<Receipt className="w-4 h-4"/> },
    { label:'Suppliers', href:'/suppliers', icon:<Truck className="w-4 h-4"/> },
  ]},
  { label:'Finance', icon:<CreditCard className="w-4 h-4"/>, roles:['super_admin','finance_manager'], children:[
    { label:'Transactions', href:'/finance/transactions', icon:<CreditCard className="w-4 h-4"/> },
    { label:'Accounts', href:'/finance/accounts', icon:<DollarSign className="w-4 h-4"/> },
    { label:'Budgets', href:'/finance/budgets', icon:<BarChart3 className="w-4 h-4"/> },
    { label:'P&L', href:'/finance/profit-loss', icon:<TrendingUp className="w-4 h-4"/> },
  ]},
  { label:'Reports', href:'/reports', icon:<FileText className="w-4 h-4"/>, roles:['super_admin','hr_manager','finance_manager','inventory_manager','sales_manager'] },
  { label:'Settings', href:'/settings', icon:<Settings className="w-4 h-4"/> },
];

function NavItem({ item, depth=0 }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(() => item.children?.some(c => c.href && pathname.startsWith(c.href)) ?? false);
  if (item.roles && user && !item.roles.includes(user.role)) return null;
  if (item.children) {
    const isActive = item.children.some(c => c.href && pathname.startsWith(c.href));
    return (
      <div>
        <button onClick={()=>setOpen(!open)} className={cn('sidebar-item w-full',isActive?'sidebar-item-active':'sidebar-item-inactive',depth>0&&'pl-5')}>
          <span>{item.icon}</span><span className="flex-1 text-left">{item.label}</span>
          {open?<ChevronDown className="w-3.5 h-3.5"/>:<ChevronRight className="w-3.5 h-3.5"/>}
        </button>
        {open && <div className="ml-3 mt-0.5 border-l border-gray-200 dark:border-gray-700 pl-3 space-y-0.5">{item.children.map(c=><NavItem key={c.label} item={c} depth={depth+1}/>)}</div>}
      </div>
    );
  }
  const isActive = item.href==='/dashboard'?pathname===item.href:pathname.startsWith(item.href||'');
  return (
    <Link href={item.href||'#'} className={cn('sidebar-item',isActive?'sidebar-item-active':'sidebar-item-inactive',depth>0&&'py-2')}>
      <span>{item.icon}</span><span>{item.label}</span>
      {isActive&&<span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"/>}
    </Link>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, user } = useAuthStore();
  return (
    <>
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}
      <aside className={cn('fixed top-0 left-0 h-screen z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out w-64',sidebarOpen?'translate-x-0':'-translate-x-full lg:translate-x-0')}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center flex-shrink-0"><Zap className="w-4 h-4 text-white"/></div>
          <div className="flex-1"><p className="font-bold text-gray-900 dark:text-white text-sm leading-none">ERP System</p><p className="text-xs text-gray-400 mt-0.5">Enterprise Platform</p></div>
          <button onClick={()=>setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400"/></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">{navItems.map(item=><NavItem key={item.label} item={item}/>)}</nav>
        {user && (
          <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{user.firstName?.[0]}{user.lastName?.[0]}</div>
              <div className="flex-1 overflow-hidden"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.firstName} {user.lastName}</p><p className="text-xs text-gray-400 truncate capitalize">{user.role?.replace('_',' ')}</p></div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
