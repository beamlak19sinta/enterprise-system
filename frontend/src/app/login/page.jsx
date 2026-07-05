'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { Zap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const { setUser, setToken } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data.data;
      setUser(user);
      setToken(accessToken);
      if (refreshToken) Cookies.set('refreshToken', refreshToken, { expires: 30 });
      toast.success(`Welcome back, ${user.firstName}!`);
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ERP System</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="admin@erpsystem.com"
                className="input-field w-full"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field w-full pr-10"
                  {...register('password', { required: 'Password is required' })}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium text-sm hover:from-primary-600 hover:to-secondary-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <p>Admin: <span className="font-mono">admin@erpsystem.com</span> / <span className="font-mono">Admin@123456</span></p>
              <p>HR: <span className="font-mono">hr@erpsystem.com</span> / <span className="font-mono">Hr@123456</span></p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need an account? <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
}
