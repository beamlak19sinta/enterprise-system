import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'hr_manager' | 'finance_manager' | 'inventory_manager' | 'sales_manager' | 'employee';
  avatar?: string;
  phone?: string;
  department?: { _id: string; name: string; code: string };
  position?: string;
  isActive: boolean;
  preferences: { theme: 'light' | 'dark' | 'system'; language: string; notifications: boolean };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      theme: 'light',
      sidebarOpen: true,
      isLoading: false,
      setUser: (user) => set({ user }),
      setToken: (accessToken) => {
        set({ accessToken });
        if (accessToken) Cookies.set('accessToken', accessToken, { expires: 7 });
        else Cookies.remove('accessToken');
      },
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      logout: () => {
        set({ user: null, accessToken: null });
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
      },
    }),
    { name: 'erp-auth', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, theme: s.theme }) }
  )
);
