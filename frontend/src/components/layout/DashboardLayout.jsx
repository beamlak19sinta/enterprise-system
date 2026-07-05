'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '@/lib/utils';
import { authApi } from '@/lib/api';

export function DashboardLayout({ children }) {
  const { user, setUser, accessToken, sidebarOpen } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!accessToken) { router.push('/login'); return; }
    if (!user) { authApi.me().then(r => setUser(r.data.data.user)).catch(() => router.push('/login')); }
  }, [accessToken]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 animate-pulse"/>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar/>
      <div className={cn('transition-all duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-64')}>
        <Navbar/>
        <main className="p-4 md:p-6 max-w-screen-2xl">{children}</main>
      </div>
    </div>
  );
}
