'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
export default function Home() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (accessToken && user) router.push('/dashboard');
    else router.push('/login');
  }, []);
  return null;
}
