'use client';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { Zap, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
      toast.success('Reset instructions sent!');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 items-center justify-center mb-4 shadow-lg shadow-primary-500/30">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email to receive reset instructions</p>
        </div>

        <div className="card p-8 shadow-xl">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Check your email</h3>
              <p className="text-sm text-gray-500">If that email is registered, you will receive password reset instructions shortly.</p>
              <Link href="/login" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium mt-4">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  className="input-field w-full"
                  placeholder="you@company.com"
                  {...register('email', { required: 'Email is required', pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Invalid email' } })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-medium text-sm hover:from-primary-600 hover:to-secondary-600 transition-all disabled:opacity-60 shadow-lg shadow-primary-500/30">
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
              <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
