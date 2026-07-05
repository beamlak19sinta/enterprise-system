'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, Sun, Moon, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { dashboardApi, searchApi, authApi } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export function Navbar() {
  const { user, toggleSidebar, theme, setTheme, setUser, setToken, logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);

  useEffect(() => {
    if (user) dashboardApi.getNotifications().then(r => { setNotifs(r.data.data.notifications); setUnread(r.data.data.unreadCount); }).catch(()=>{});
  }, [user]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (search.length >= 2) { try { const r = await searchApi.search(search); setResults(r.data.data.results); setShowSearch(true); } catch {} }
      else { setResults([]); setShowSearch(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    setUser(null); setToken(null); logout();
  };

  const markAllRead = async () => {
    await dashboardApi.markAllRead();
    setUnread(0); setNotifs(p => p.map(n => ({ ...n, isRead: true })));
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 flex items-center px-4 gap-3 sticky top-0 z-30">
      <button onClick={toggleSidebar} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"><Menu className="w-5 h-5"/></button>
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white dark:focus:bg-gray-700 transition-all"/>
        {showSearch && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden z-50">
            {results.slice(0,6).map((r,i) => (
              <Link key={i} href={r.url} onClick={()=>{setShowSearch(false);setSearch('');}} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 capitalize">{r.type}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{r.data?.firstName?`${r.data.firstName} ${r.data.lastName}`:r.data?.companyName||r.data?.name||r.data?.orderNumber||r.data?.sku}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <button onClick={()=>setTheme(theme==='dark'?'light':'dark')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">{theme==='dark'?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}</button>
        <div className="relative">
          <button onClick={()=>{setShowNotif(!showNotif);setShowUser(false);}} className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
            <Bell className="w-4 h-4"/>
            {unread>0&&<span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{unread>9?'9+':unread}</span>}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800"><h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h3>{unread>0&&<button onClick={markAllRead} className="text-xs text-primary-500 hover:text-primary-600">Mark all read</button>}</div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                {notifs.length===0?<p className="text-center text-sm text-gray-400 py-8">No notifications</p>:notifs.map(n=>(
                  <div key={n._id} className={`px-4 py-3 ${!n.isRead?'bg-primary-50/50 dark:bg-primary-900/10':''}`}>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={()=>{setShowUser(!showUser);setShowNotif(false);}} className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xs font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">{user?.firstName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400"/>
          </button>
          {showUser && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100 dark:border-gray-800"><p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p><p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_',' ')}</p></div>
              <div className="p-1">
                <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><User className="w-4 h-4"/>Profile</Link>
                <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><Settings className="w-4 h-4"/>Settings</Link>
                <hr className="my-1 border-gray-100 dark:border-gray-800"/>
                <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><LogOut className="w-4 h-4"/>Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
