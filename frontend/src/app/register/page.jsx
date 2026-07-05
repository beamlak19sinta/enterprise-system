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

export default function RegisterPage() {
  const { setUser, setToken } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authApi.register({ firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password });
      const { user, accessToken, refreshToken } = res.data.data;
      setUser(user);
      setToken(accessToken);
      if (refreshToken) Cookies.set('refreshToken', refreshToken, { expires: 30 });
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the ERP System</p>
        </div>

        <div className="card p-8 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
                <input className="input-field w-full" placeholder="John" {...register('firstName', { required: 'Required' })} />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                <input className="input-field w-full" placeholder="Doe" {...register('lastName', { required: 'Required' })} />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" className="input-field w-full" placeholder="you@company.com" {...register('email', { required: 'Required', pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Invalid email' } })} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field w-full pr-10" placeholder="Min 8 characters" {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
              <input type="password" className="input-field w-full" placeholder="Repeat password" {...register('confirm', { required: 'Required', validate: v => v === watch('password') || 'Passwords do not match' })} />
              {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium text-sm hover:from-primary-600 hover:to-secondary-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary-500/30 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
